import { useState, useEffect, useRef } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import { supabase } from '../lib/supabase'
import { Navigation, Wifi, WifiOff, Truck } from 'lucide-react'

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
})

const truckIcon = new L.DivIcon({
  html: `<div style="background:linear-gradient(135deg,#10b981,#0d9488);width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.4);font-size:18px;">🚛</div>`,
  className: '',
  iconSize: [36, 36],
  iconAnchor: [18, 18],
})

function FlyToMarker({ position }) {
  const map = useMap()
  useEffect(() => {
    if (position) map.flyTo(position, 15, { duration: 1 })
  }, [position, map])
  return null
}

export default function LiveTracking() {
  const [routes, setRoutes] = useState([])
  const [connected, setConnected] = useState(false)
  const [lastUpdate, setLastUpdate] = useState(null)
  const DEFAULT_CENTER = [11.6643, 78.1460]

  useEffect(() => {
    // Initial fetch
    fetchRoutes()

    // Realtime subscription
    const channel = supabase
      .channel('collector-routes-tracking')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'collector_routes',
      }, (payload) => {
        setLastUpdate(new Date())
        fetchRoutes()
      })
      .subscribe((status) => {
        setConnected(status === 'SUBSCRIBED')
      })

    return () => supabase.removeChannel(channel)
  }, [])

  async function fetchRoutes() {
    const today = new Date().toISOString().split('T')[0]
    const { data } = await supabase
      .from('collector_routes')
      .select('*, users(name)')
      .eq('date', today)
    setRoutes(data || [])
  }

  const activeCollectors = routes.filter(r => r.current_lat && r.current_lng)

  return (
    <div className="px-4 py-6 max-w-lg mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Live Tracking</h1>
          <p className="text-slate-400 text-sm mt-1">Real-time collector positions</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium"
          style={{ background: connected ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)', border: `1px solid ${connected ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`, color: connected ? '#10b981' : '#f87171' }}>
          {connected ? <Wifi size={12} /> : <WifiOff size={12} />}
          {connected ? 'Live' : 'Connecting'}
        </div>
      </div>

      {/* Map */}
      <div style={{ height: '340px' }} className="rounded-2xl overflow-hidden mb-4">
        <MapContainer center={DEFAULT_CENTER} zoom={14} style={{ height: '100%', width: '100%' }}>
          <TileLayer
            attribution='&copy; <a href="https://carto.com/">CartoDB</a>'
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          />
          {activeCollectors.map(route => (
            <Marker key={route.id} position={[route.current_lat, route.current_lng]} icon={truckIcon}>
              <Popup>
                <div className="text-sm font-semibold">{route.users?.name || 'Collector'}</div>
                <div className="text-xs text-gray-500">Route #{route.id.slice(-6)}</div>
              </Popup>
            </Marker>
          ))}
          {activeCollectors[0] && (
            <FlyToMarker position={[activeCollectors[0].current_lat, activeCollectors[0].current_lng]} />
          )}
        </MapContainer>
      </div>

      {/* Collector Cards */}
      <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">Active Collectors Today</h3>
      {routes.length === 0 ? (
        <div className="card text-center py-8">
          <Truck size={32} className="mx-auto mb-2 text-slate-600" />
          <p className="text-slate-400">No active collectors right now</p>
        </div>
      ) : (
        <div className="space-y-3">
          {routes.map(route => (
            <div key={route.id} className="card flex items-center gap-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-lg" style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)' }}>
                🚛
              </div>
              <div className="flex-1">
                <div className="font-semibold text-white text-sm">{route.users?.name || 'Collector'}</div>
                <div className="text-xs text-slate-400">
                  {route.current_lat ? `${route.current_lat.toFixed(4)}, ${route.current_lng.toFixed(4)}` : 'Location pending...'}
                </div>
                <div className="text-xs text-slate-500">
                  {route.ordered_bin_ids?.length || 0} stops · Route #{route.id.slice(-6)}
                </div>
              </div>
              <div className="flex flex-col items-end gap-1">
                <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: route.current_lat ? '#10b981' : '#64748b' }}></div>
                <span className="text-xs text-slate-500">{route.current_lat ? 'Active' : 'Idle'}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {lastUpdate && (
        <p className="text-center text-xs text-slate-500 mt-4">
          Last updated: {lastUpdate.toLocaleTimeString()}
        </p>
      )}

      {/* Info card */}
      <div className="card mt-4" style={{ borderColor: 'rgba(16,185,129,0.2)', background: 'rgba(16,185,129,0.05)' }}>
        <div className="flex items-center gap-2 mb-2">
          <Navigation size={14} style={{ color: '#10b981' }} />
          <span className="text-sm font-semibold text-emerald-400">How it works</span>
        </div>
        <p className="text-xs text-slate-400">Collector positions update every 10 seconds via GPS broadcast. The map reflects real-time movement of all active collection vehicles in your zone.</p>
      </div>
    </div>
  )
}
