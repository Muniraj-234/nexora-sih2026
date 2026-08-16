import React, { useState, useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet'
import L from 'leaflet'
import { supabase } from '../lib/supabase'
import { Wifi, WifiOff, RefreshCw, Trash2 } from 'lucide-react'

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
})

const truckIcon = new L.DivIcon({
  html: `<div style="background:linear-gradient(135deg,#10b981,#0d9488);width:40px;height:40px;border-radius:50%;display:flex;align-items:center;justify-content:center;border:3px solid white;box-shadow:0 4px 12px rgba(0,0,0,0.5);font-size:20px;">🚛</div>`,
  className: '', iconSize: [40, 40], iconAnchor: [20, 20],
})

const getBinIcon = (fillLevel, type) => {
  const color = fillLevel > 80 ? '#f87171' : fillLevel > 50 ? '#fbbf24' : '#34d399'
  const emoji = { wet: '💧', dry: '📦', recyclable: '♻️', hazardous: '⚠️' }[type] || '🗑'
  return new L.DivIcon({
    html: `<div style="background:${color};width:30px;height:30px;border-radius:50%;display:flex;align-items:center;justify-content:center;border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.4);font-size:14px;">${emoji}</div>`,
    className: '', iconSize: [30, 30], iconAnchor: [15, 15],
  })
}

export default function FleetMap() {
  const [routes, setRoutes] = useState([])
  const [bins, setBins] = useState([])
  const [showBins, setShowBins] = useState(true)
  const [connected, setConnected] = useState(false)
  const [lastUpdate, setLastUpdate] = useState(null)
  const DEFAULT_CENTER = [19.1136, 72.8697]

  useEffect(() => {
    fetchAll()

    const channel = supabase
      .channel('fleet-map-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'collector_routes' }, () => {
        fetchAll()
        setLastUpdate(new Date())
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bins' }, () => {
        fetchBins()
      })
      .subscribe(status => setConnected(status === 'SUBSCRIBED'))

    return () => supabase.removeChannel(channel)
  }, [])

  async function fetchAll() {
    fetchRoutes()
    fetchBins()
  }

  async function fetchRoutes() {
    const today = new Date().toISOString().split('T')[0]
    const { data } = await supabase
      .from('collector_routes').select('*, users(name)').eq('date', today)
    setRoutes(data || [])
  }

  async function fetchBins() {
    const { data } = await supabase.from('bins').select('*')
    setBins(data || [])
  }

  const activeCollectors = routes.filter(r => r.current_lat && r.current_lng)
  const criticalBins = bins.filter(b => b.fill_level > 80)

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Live Fleet Map</h1>
          <p className="text-slate-400 text-sm mt-0.5">Real-time collector positions + bin status</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchAll} className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-all">
            <RefreshCw size={16} />
          </button>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium"
            style={{ background: connected ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)', border: `1px solid ${connected ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`, color: connected ? '#10b981' : '#f87171' }}>
            {connected ? <Wifi size={12} /> : <WifiOff size={12} />}
            {connected ? 'Live' : 'Connecting...'}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-4">
        {[
          { label: 'Active Collectors', value: activeCollectors.length, color: '#34d399' },
          { label: 'Total Bins', value: bins.length, color: '#60a5fa' },
          { label: 'Critical Bins', value: criticalBins.length, color: '#f87171' },
        ].map(s => (
          <div key={s.label} className="card text-center py-3">
            <div className="text-xl font-bold" style={{ color: s.color }}>{s.value}</div>
            <div className="text-xs text-slate-400 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3 mb-4">
        <button onClick={() => setShowBins(!showBins)}
          className="text-xs px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1"
          style={showBins
            ? { background: 'rgba(16,185,129,0.2)', color: '#10b981', border: '1px solid rgba(16,185,129,0.3)' }
            : { background: 'var(--nexora-card)', color: '#64748b', border: '1px solid var(--nexora-border)' }}>
          <Trash2 size={12} /> {showBins ? 'Hide' : 'Show'} Bins
        </button>
        {lastUpdate && <span className="text-xs text-slate-500">Updated: {lastUpdate.toLocaleTimeString()}</span>}
      </div>

      <div style={{ height: '460px' }} className="rounded-2xl overflow-hidden mb-4">
        <MapContainer center={DEFAULT_CENTER} zoom={14} style={{ height: '100%', width: '100%' }}>
          <TileLayer
            attribution='&copy; <a href="https://openstreetmap.org">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {showBins && bins.map(bin => (
            <Marker key={bin.id} position={[bin.lat, bin.lng]} icon={getBinIcon(bin.fill_level, bin.type)}>
              <Popup>
                <div className="text-sm">
                  <p className="font-bold capitalize">{bin.type} Bin</p>
                  <p>Fill: <span style={{ color: bin.fill_level > 80 ? '#dc2626' : '#16a34a', fontWeight: 600 }}>{bin.fill_level}%</span></p>
                  {bin.fill_level > 80 && <p style={{ color: '#dc2626' }}>⚠️ Needs collection!</p>}
                </div>
              </Popup>
            </Marker>
          ))}
          {activeCollectors.map(route => (
            <React.Fragment key={route.id}>
              <Marker position={[route.current_lat, route.current_lng]} icon={truckIcon}>
                <Popup>
                  <div className="text-sm">
                    <p className="font-bold">{route.users?.name || 'Collector'}</p>
                    <p>{route.ordered_bin_ids?.length || 0} stops today</p>
                    <p className="text-xs text-gray-500">
                      {route.current_lat.toFixed(4)}, {route.current_lng.toFixed(4)}
                    </p>
                  </div>
                </Popup>
              </Marker>
              <Circle
                center={[route.current_lat, route.current_lng]}
                radius={80}
                pathOptions={{ color: '#10b981', fillColor: '#10b981', fillOpacity: 0.08, weight: 1 }}
              />
            </React.Fragment>
          ))}
        </MapContainer>
      </div>

      {criticalBins.length > 0 && (
        <div className="card" style={{ borderColor: 'rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.05)' }}>
          <h3 className="text-sm font-semibold mb-3" style={{ color: '#f87171' }}>
            ⚠️ Critical Bins — {criticalBins.length} need immediate collection
          </h3>
          <div className="grid grid-cols-2 gap-2">
            {criticalBins.map(bin => (
              <div key={bin.id} className="flex items-center gap-2 text-xs p-2 rounded-lg"
                style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                  style={{ background: '#f87171', color: 'white' }}>{bin.fill_level}%</div>
                <span className="text-slate-300 capitalize">{bin.type} bin</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
