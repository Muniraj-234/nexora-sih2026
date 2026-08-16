import { useState, useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import { supabase } from '../lib/supabase'
import { MapPin, Send, CheckCircle, Loader, Trash2, Droplets, Recycle, Zap } from 'lucide-react'

// Fix Leaflet icon
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
})

const selectedIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41],
})

function MapClickHandler({ onLocationSelect }) {
  useMapEvents({
    click(e) { onLocationSelect(e.latlng) }
  })
  return null
}

const WASTE_TYPES = [
  { value: 'wet', label: 'Wet Waste', icon: Droplets, color: '#60a5fa' },
  { value: 'dry', label: 'Dry Waste', icon: Trash2, color: '#fbbf24' },
  { value: 'recyclable', label: 'Recyclable', icon: Recycle, color: '#34d399' },
  { value: 'hazardous', label: 'Hazardous', icon: Zap, color: '#f87171' },
]

// Mumbai center
const DEFAULT_CENTER = [19.1136, 72.8697]

export default function RequestPickup({ profile }) {
  const [selectedLocation, setSelectedLocation] = useState(null)
  const [wasteType, setWasteType] = useState('wet')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [gpsLoading, setGpsLoading] = useState(false)

  const useMyLocation = () => {
    setGpsLoading(true)
    navigator.geolocation.getCurrentPosition(
      pos => {
        setSelectedLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        setGpsLoading(false)
      },
      () => {
        setSelectedLocation({ lat: DEFAULT_CENTER[0], lng: DEFAULT_CENTER[1] })
        setGpsLoading(false)
      }
    )
  }

  const handleSubmit = async () => {
    if (!selectedLocation || !profile?.id) return
    setLoading(true)
    const { error } = await supabase.from('pickup_requests').insert({
      citizen_id: profile.id,
      lat: selectedLocation.lat,
      lng: selectedLocation.lng,
      waste_type: wasteType,
      status: 'pending',
    })
    setLoading(false)
    if (!error) setSuccess(true)
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'var(--nexora-dark)' }}>
        <div className="text-center animate-slide-up">
          <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse-glow" style={{ background: 'rgba(16,185,129,0.2)', border: '2px solid #10b981' }}>
            <CheckCircle size={40} style={{ color: '#10b981' }} />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Pickup Requested!</h2>
          <p className="text-slate-400 mb-6">A collector will be assigned to your location soon.</p>
          <button className="btn-primary" onClick={() => setSuccess(false)}>
            Request Another Pickup
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="px-4 py-6 max-w-lg mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Request Pickup</h1>
        <p className="text-slate-400 text-sm mt-1">Pin your location on the map</p>
      </div>

      {/* Waste type selector */}
      <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">Waste Type</h3>
      <div className="grid grid-cols-2 gap-2 mb-5">
        {WASTE_TYPES.map(type => {
          const Icon = type.icon
          const active = wasteType === type.value
          return (
            <button
              key={type.value}
              onClick={() => setWasteType(type.value)}
              className="card flex items-center gap-2 py-3 transition-all"
              style={active ? { borderColor: type.color, background: `${type.color}15` } : {}}
            >
              <Icon size={18} style={{ color: active ? type.color : '#64748b' }} />
              <span className="text-sm font-medium" style={{ color: active ? type.color : '#94a3b8' }}>{type.label}</span>
              {active && <div className="ml-auto w-2 h-2 rounded-full" style={{ background: type.color }}></div>}
            </button>
          )
        })}
      </div>

      {/* Location section */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Pin Location</h3>
        <button
          onClick={useMyLocation}
          className="text-xs flex items-center gap-1 px-3 py-1.5 rounded-lg transition-all"
          style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', color: '#10b981' }}
        >
          {gpsLoading ? <Loader size={12} className="animate-spin" /> : <MapPin size={12} />}
          Use My Location
        </button>
      </div>

      <div style={{ height: '280px' }} className="rounded-2xl overflow-hidden mb-4" ref={null}>
        <MapContainer center={selectedLocation ? [selectedLocation.lat, selectedLocation.lng] : DEFAULT_CENTER} zoom={15} style={{ height: '100%', width: '100%' }}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapClickHandler onLocationSelect={setSelectedLocation} />
          {selectedLocation && (
            <Marker position={[selectedLocation.lat, selectedLocation.lng]} icon={selectedIcon}>
              <Popup>Pickup Location</Popup>
            </Marker>
          )}
        </MapContainer>
      </div>

      {selectedLocation ? (
        <div className="card mb-4 flex items-center gap-2 py-3" style={{ borderColor: 'rgba(16,185,129,0.3)', background: 'rgba(16,185,129,0.05)' }}>
          <MapPin size={16} style={{ color: '#10b981' }} />
          <span className="text-sm text-emerald-300">
            {selectedLocation.lat.toFixed(5)}, {selectedLocation.lng.toFixed(5)}
          </span>
        </div>
      ) : (
        <p className="text-sm text-slate-500 mb-4 text-center">👆 Tap on the map to pin your pickup location</p>
      )}

      <button className="btn-primary w-full" onClick={handleSubmit} disabled={!selectedLocation || loading}>
        {loading ? <Loader size={18} className="animate-spin" /> : <Send size={18} />}
        {loading ? 'Submitting...' : 'Request Pickup'}
      </button>
    </div>
  )
}
