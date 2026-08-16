import { useState, useEffect, useRef, useCallback } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet'
import L from 'leaflet'
import { supabase } from '../lib/supabase'
import { MapPin, CheckCircle, Navigation, Wifi, WifiOff, Trash2, Loader, RefreshCw } from 'lucide-react'

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
})

const myIcon = new L.DivIcon({
  html: `<div style="background:linear-gradient(135deg,#10b981,#0d9488);width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;border:3px solid white;box-shadow:0 2px 10px rgba(0,0,0,0.5);font-size:18px;">🚛</div>`,
  className: '',
  iconSize: [36, 36],
  iconAnchor: [18, 18],
})

const binIcon = (fillLevel, completed) => new L.DivIcon({
  html: `<div style="background:${completed ? '#10b981' : fillLevel > 80 ? '#f87171' : '#fbbf24'};width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.4);font-size:13px;">${completed ? '✓' : '🗑'}</div>`,
  className: '',
  iconSize: [28, 28],
  iconAnchor: [14, 14],
})

// Nearest-neighbor route optimization
function nearestNeighborRoute(bins, startLat, startLng) {
  if (!bins.length) return []
  const unvisited = [...bins]
  const route = []
  let currentLat = startLat
  let currentLng = startLng

  while (unvisited.length > 0) {
    let nearest = null
    let minDist = Infinity
    let nearestIdx = -1

    unvisited.forEach((bin, idx) => {
      const dist = Math.sqrt(
        Math.pow(bin.lat - currentLat, 2) + Math.pow(bin.lng - currentLng, 2)
      )
      if (dist < minDist) { minDist = dist; nearest = bin; nearestIdx = idx }
    })

    route.push(nearest)
    currentLat = nearest.lat
    currentLng = nearest.lng
    unvisited.splice(nearestIdx, 1)
  }
  return route
}

function FlyTo({ position }) {
  const map = useMap()
  useEffect(() => { if (position) map.flyTo(position, 15, { duration: 1 }) }, [position])
  return null
}

export default function TodayRoute({ profile }) {
  const [route, setRoute] = useState(null)
  const [bins, setBins] = useState([])
  const [optimizedRoute, setOptimizedRoute] = useState([])
  const [completedStops, setCompletedStops] = useState([])
  const [myPosition, setMyPosition] = useState(null)
  const [broadcasting, setBroadcasting] = useState(false)
  const [loading, setLoading] = useState(true)
  const gpsIntervalRef = useRef(null)

  useEffect(() => {
    if (profile?.id) fetchTodayRoute()
    return () => {
      if (gpsIntervalRef.current) clearInterval(gpsIntervalRef.current)
    }
  }, [profile])

  async function fetchTodayRoute() {
    setLoading(true)
    const today = new Date().toISOString().split('T')[0]

    // Get collector's route for today
    const { data: routeData } = await supabase
      .from('collector_routes')
      .select('*')
      .eq('collector_id', profile.id)
      .eq('date', today)
      .single()

    if (routeData) {
      setRoute(routeData)
      // Fetch bins in the route
      if (routeData.ordered_bin_ids?.length) {
        const { data: binsData } = await supabase
          .from('bins')
          .select('*')
          .in('id', routeData.ordered_bin_ids)
        if (binsData) {
          // Apply nearest-neighbor optimization
          const startLat = routeData.current_lat || binsData[0]?.lat
          const startLng = routeData.current_lng || binsData[0]?.lng
          const optimized = nearestNeighborRoute(binsData, startLat, startLng)
          setOptimizedRoute(optimized)
          setBins(binsData)
        }
      }
    } else {
      // Create a default route with all bins for this collector
      const { data: allBins } = await supabase.from('bins').select('*').limit(8)
      if (allBins) {
        const optimized = nearestNeighborRoute(allBins, 11.6643, 78.1460)
        setOptimizedRoute(optimized)
        setBins(allBins)
        // Insert route into DB
        const binIds = optimized.map(b => b.id)
        const { data: newRoute } = await supabase.from('collector_routes').insert({
          collector_id: profile.id,
          date: today,
          ordered_bin_ids: binIds,
          current_lat: 11.6643,
          current_lng: 78.1460,
        }).select().single()
        if (newRoute) setRoute(newRoute)
      }
    }
    setLoading(false)
  }

  const startGPSBroadcast = useCallback(async () => {
    if (broadcasting) {
      clearInterval(gpsIntervalRef.current)
      setBroadcasting(false)
      return
    }
    setBroadcasting(true)

    const broadcastPosition = () => {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const { latitude: lat, longitude: lng } = pos.coords
          setMyPosition([lat, lng])
          if (route?.id) {
            await supabase.from('collector_routes').update({
              current_lat: lat,
              current_lng: lng,
              last_updated: new Date().toISOString(),
            }).eq('id', route.id)
          }
        },
        () => {
          // Simulate movement for demo (around Mumbai Andheri)
          setMyPosition(prev => prev ? [
            prev[0] + (Math.random() - 0.5) * 0.001,
            prev[1] + (Math.random() - 0.5) * 0.001,
          ] : [11.6643, 78.1460])
        }
      )
    }

    broadcastPosition()
    gpsIntervalRef.current = setInterval(broadcastPosition, 10000)
  }, [broadcasting, route])

  const checkInStop = async (bin) => {
    if (completedStops.includes(bin.id)) return

    setCompletedStops(prev => [...prev, bin.id])

    // Log collection
    if (profile?.id) {
      await supabase.from('collections_log').insert({
        bin_id: bin.id,
        collector_id: profile.id,
        waste_type: bin.type,
        timestamp: new Date().toISOString(),
      })
      // Reset bin fill level
      await supabase.from('bins').update({ fill_level: 5 }).eq('id', bin.id)
    }
  }

  const progress = optimizedRoute.length > 0
    ? Math.round((completedStops.length / optimizedRoute.length) * 100)
    : 0

  const polylinePoints = optimizedRoute.map(b => [b.lat, b.lng])

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="w-10 h-10 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-slate-400">Loading your route...</p>
      </div>
    </div>
  )

  return (
    <div className="px-4 py-6 max-w-lg mx-auto">
      {/* Header */}
      <div className="mb-5">
        <h1 className="text-2xl font-bold text-white">Today's Route</h1>
        <p className="text-slate-400 text-sm">{new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        {[
          { label: 'Total Stops', value: optimizedRoute.length, color: '#60a5fa' },
          { label: 'Completed', value: completedStops.length, color: '#34d399' },
          { label: 'Progress', value: `${progress}%`, color: '#fbbf24' },
        ].map(s => (
          <div key={s.label} className="card text-center py-4">
            <div className="text-xl font-bold" style={{ color: s.color }}>{s.value}</div>
            <div className="text-xs text-slate-400 mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Progress bar */}
      <div className="card mb-5 py-3">
        <div className="flex justify-between text-xs text-slate-400 mb-2">
          <span>Route Progress</span>
          <span>{completedStops.length}/{optimizedRoute.length} stops</span>
        </div>
        <div className="h-3 rounded-full" style={{ background: 'rgba(51,65,85,0.8)' }}>
          <div className="h-3 rounded-full transition-all duration-500" style={{ width: `${progress}%`, background: 'linear-gradient(90deg, #10b981, #0d9488)' }}></div>
        </div>
      </div>

      {/* GPS Broadcast button */}
      <button
        className="btn-primary mb-5"
        onClick={startGPSBroadcast}
        style={broadcasting ? { background: 'linear-gradient(135deg, #f59e0b, #d97706)' } : {}}
      >
        {broadcasting ? <><Wifi size={18} className="animate-pulse" /> Stop Broadcasting</> : <><Navigation size={18} /> Start GPS Broadcast</>}
      </button>

      {/* Map */}
      <div style={{ height: '280px' }} className="rounded-2xl overflow-hidden mb-5">
        <MapContainer center={myPosition || [11.6643, 78.1460]} zoom={14} style={{ height: '100%', width: '100%' }}>
          <TileLayer attribution='&copy; <a href="https://carto.com/">CartoDB</a>' url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
          {/* Route line */}
          {polylinePoints.length > 1 && (
            <Polyline positions={polylinePoints} color="#10b981" weight={3} opacity={0.7} dashArray="8,4" />
          )}
          {/* Bin markers */}
          {optimizedRoute.map((bin, idx) => (
            <Marker
              key={bin.id}
              position={[bin.lat, bin.lng]}
              icon={binIcon(bin.fill_level, completedStops.includes(bin.id))}
            >
              <Popup>
                <div>
                  <div className="font-semibold">Stop #{idx + 1} - {bin.type} bin</div>
                  <div className="text-sm">Fill: {bin.fill_level}%</div>
                </div>
              </Popup>
            </Marker>
          ))}
          {/* My position */}
          {myPosition && (
            <Marker position={myPosition} icon={myIcon}>
              <Popup>You are here</Popup>
            </Marker>
          )}
          {myPosition && <FlyTo position={myPosition} />}
        </MapContainer>
      </div>

      {/* Stops list */}
      <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">Stop List (Optimized)</h3>
      <div className="space-y-2">
        {optimizedRoute.map((bin, idx) => {
          const done = completedStops.includes(bin.id)
          const fillColor = bin.fill_level > 80 ? '#f87171' : bin.fill_level > 50 ? '#fbbf24' : '#34d399'
          return (
            <div
              key={bin.id}
              className="card flex items-center gap-3 py-3"
              style={done ? { borderColor: 'rgba(16,185,129,0.4)', background: 'rgba(16,185,129,0.05)' } : {}}
            >
              <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold"
                style={{ background: done ? '#10b981' : 'var(--nexora-border)', color: done ? 'white' : '#64748b' }}>
                {done ? '✓' : idx + 1}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-white capitalize">{bin.type} Bin</div>
                <div className="flex items-center gap-2 mt-1">
                  <div className="h-1.5 flex-1 rounded-full" style={{ background: 'rgba(51,65,85,0.8)' }}>
                    <div className="h-1.5 rounded-full" style={{ width: `${bin.fill_level}%`, background: fillColor }}></div>
                  </div>
                  <span className="text-xs" style={{ color: fillColor }}>{bin.fill_level}%</span>
                </div>
              </div>
              <button
                onClick={() => checkInStop(bin)}
                disabled={done}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                style={done
                  ? { background: 'rgba(16,185,129,0.15)', color: '#10b981', cursor: 'default' }
                  : { background: 'rgba(16,185,129,0.2)', color: '#10b981', border: '1px solid rgba(16,185,129,0.3)', cursor: 'pointer' }
                }
              >
                {done ? <><CheckCircle size={12} /> Done</> : <><MapPin size={12} /> Check In</>}
              </button>
            </div>
          )
        })}
      </div>

      {progress === 100 && (
        <div className="card mt-6 text-center py-8 animate-slide-up" style={{ borderColor: 'rgba(16,185,129,0.4)', background: 'rgba(16,185,129,0.08)' }}>
          <div className="text-4xl mb-3">🎉</div>
          <h3 className="text-xl font-bold text-white mb-1">Route Complete!</h3>
          <p className="text-slate-400">All {optimizedRoute.length} stops collected. Great work!</p>
        </div>
      )}
    </div>
  )
}
