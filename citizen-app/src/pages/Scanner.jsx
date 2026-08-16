import { useState, useRef, useCallback } from 'react'
import { Camera, Upload, Loader, CheckCircle, AlertTriangle, Recycle, Droplets, Trash2, Zap, X, RefreshCw } from 'lucide-react'

const WASTE_TYPES = {
  wet: {
    label: 'Wet Waste',
    description: 'Organic, biodegradable waste like food scraps, vegetable peels',
    color: '#60a5fa',
    bg: 'rgba(59,130,246,0.15)',
    border: 'rgba(59,130,246,0.3)',
    icon: Droplets,
    tip: 'Dispose in blue bin. Can be composted.',
    emoji: '🥗'
  },
  dry: {
    label: 'Dry Waste',
    description: 'Non-biodegradable waste like paper, cardboard, plastic bags',
    color: '#fbbf24',
    bg: 'rgba(245,158,11,0.15)',
    border: 'rgba(245,158,11,0.3)',
    icon: Trash2,
    tip: 'Dispose in yellow bin. Keep dry and clean.',
    emoji: '📦'
  },
  recyclable: {
    label: 'Recyclable',
    description: 'Glass, metals, hard plastics that can be recycled',
    color: '#34d399',
    bg: 'rgba(16,185,129,0.15)',
    border: 'rgba(16,185,129,0.3)',
    icon: Recycle,
    tip: 'Dispose in green bin. Clean before recycling.',
    emoji: '♻️'
  },
  hazardous: {
    label: 'Hazardous',
    description: 'Batteries, chemicals, medical waste, e-waste',
    color: '#f87171',
    bg: 'rgba(239,68,68,0.15)',
    border: 'rgba(239,68,68,0.3)',
    icon: Zap,
    tip: 'Take to designated hazardous waste facility.',
    emoji: '⚠️'
  }
}

export default function Scanner() {
  const [image, setImage] = useState(null)
  const [imageFile, setImageFile] = useState(null)
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [useCamera, setUseCamera] = useState(false)
  const fileInputRef = useRef(null)
  const cameraRef = useRef(null)
  const videoRef = useRef(null)
  const streamRef = useRef(null)

  const handleFileUpload = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setImageFile(file)
    const reader = new FileReader()
    reader.onload = (ev) => setImage(ev.target.result)
    reader.readAsDataURL(file)
    setResult(null)
    setError('')
  }

  const startCamera = useCallback(async () => {
    setUseCamera(true)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
      streamRef.current = stream
      if (videoRef.current) videoRef.current.srcObject = stream
    } catch {
      setError('Camera not available. Please upload an image instead.')
      setUseCamera(false)
    }
  }, [])

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop())
      streamRef.current = null
    }
    setUseCamera(false)
  }, [])

  const capturePhoto = useCallback(() => {
    const canvas = document.createElement('canvas')
    canvas.width = videoRef.current.videoWidth
    canvas.height = videoRef.current.videoHeight
    canvas.getContext('2d').drawImage(videoRef.current, 0, 0)
    const dataUrl = canvas.toDataURL('image/jpeg', 0.9)
    setImage(dataUrl)
    // Convert to blob for Gemini
    canvas.toBlob(blob => setImageFile(blob), 'image/jpeg', 0.9)
    stopCamera()
    setResult(null)
    setError('')
  }, [stopCamera])

  const analyzeWithGemini = async () => {
    if (!image) return
    setLoading(true)
    setError('')
    setResult(null)

    const apiKey = import.meta.env.VITE_GEMINI_API_KEY
    if (!apiKey || apiKey === 'REPLACE_WITH_YOUR_GEMINI_KEY') {
      // Simulate result for demo
      await new Promise(r => setTimeout(r, 1800))
      const types = ['wet', 'dry', 'recyclable', 'hazardous']
      const randomType = types[Math.floor(Math.random() * types.length)]
      setResult({ type: randomType, confidence: Math.floor(Math.random() * 20 + 80), demo: true })
      setLoading(false)
      return
    }

    try {
      // Convert image to base64
      const base64 = image.split(',')[1]
      const mimeType = image.startsWith('data:image/png') ? 'image/png' : 'image/jpeg'

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              parts: [
                {
                  inlineData: { mimeType, data: base64 }
                },
                {
                  text: `Analyze this waste image and classify it into exactly ONE of these categories: wet, dry, recyclable, or hazardous.

Definitions:
- wet: Food waste, vegetable scraps, organic biodegradable material
- dry: Paper, cardboard, cloth, plastic bags, non-recyclable plastics  
- recyclable: Glass bottles, metal cans, hard plastic containers, aluminum
- hazardous: Batteries, chemicals, medical waste, paint, e-waste

Respond with ONLY a JSON object in this exact format:
{"type": "wet|dry|recyclable|hazardous", "confidence": 85, "reason": "Brief explanation"}`
                }
              ]
            }],
            generationConfig: { temperature: 0.1, maxOutputTokens: 200 }
          })
        }
      )

      const data = await response.json()
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || ''
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0])
        setResult(parsed)
      } else {
        throw new Error('Could not parse AI response')
      }
    } catch (err) {
      console.error(err)
      // Fallback to demo mode if API fails
      const types = ['wet', 'dry', 'recyclable', 'hazardous']
      const randomType = types[Math.floor(Math.random() * types.length)]
      setResult({ type: randomType, confidence: Math.floor(Math.random() * 20 + 80), demo: true })
      setError('AI Analysis failed (Invalid API Key). Falling back to demo mode.')
    }
    setLoading(false)
  }

  const wasteInfo = result ? WASTE_TYPES[result.type] : null
  const WasteIcon = wasteInfo?.icon

  return (
    <div className="px-4 py-6 max-w-lg mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Waste Scanner</h1>
        <p className="text-slate-400 text-sm mt-1">AI-powered waste classification</p>
      </div>

      {/* Camera / Upload Area */}
      {useCamera ? (
        <div className="relative rounded-2xl overflow-hidden mb-4" style={{ height: '280px' }}>
          <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
          {/* Scanner overlay */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative w-48 h-48 border-2 border-emerald-400 rounded-xl">
              <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-emerald-400 rounded-tl-lg"></div>
              <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-emerald-400 rounded-tr-lg"></div>
              <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-emerald-400 rounded-bl-lg"></div>
              <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-emerald-400 rounded-br-lg"></div>
              <div className="absolute left-0 right-0 h-0.5 opacity-80" style={{ background: 'linear-gradient(90deg, transparent, #10b981, transparent)', animation: 'scan-line 2s linear infinite', top: '50%' }}></div>
            </div>
          </div>
          <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-4">
            <button onClick={stopCamera} className="p-3 rounded-full" style={{ background: 'rgba(239,68,68,0.8)' }}>
              <X size={20} color="white" />
            </button>
            <button onClick={capturePhoto} className="p-4 rounded-full border-4 border-white" style={{ background: 'rgba(16,185,129,0.9)' }}>
              <Camera size={24} color="white" />
            </button>
          </div>
        </div>
      ) : image ? (
        <div className="relative rounded-2xl overflow-hidden mb-4" style={{ height: '260px' }}>
          <img src={image} alt="Waste" className="w-full h-full object-cover" />
          <button
            onClick={() => { setImage(null); setResult(null); setError('') }}
            className="absolute top-3 right-3 p-2 rounded-full"
            style={{ background: 'rgba(0,0,0,0.6)' }}
          >
            <X size={16} color="white" />
          </button>
        </div>
      ) : (
        <div
          className="rounded-2xl border-2 border-dashed mb-4 flex flex-col items-center justify-center cursor-pointer transition-all hover:border-emerald-500"
          style={{ height: '220px', borderColor: 'var(--nexora-border)', background: 'rgba(16,185,129,0.03)' }}
          onClick={() => fileInputRef.current?.click()}
        >
          <Camera size={40} className="mb-3" style={{ color: '#10b981' }} />
          <p className="text-white font-semibold">Upload Waste Photo</p>
          <p className="text-slate-400 text-sm mt-1">Tap to browse or use camera</p>
        </div>
      )}

      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />

      {/* Action buttons */}
      {!image && !useCamera && (
        <div className="grid grid-cols-2 gap-3 mb-4">
          <button className="btn-primary" onClick={() => fileInputRef.current?.click()}>
            <Upload size={18} /> Upload Photo
          </button>
          <button
            className="btn-primary"
            onClick={startCamera}
            style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
          >
            <Camera size={18} /> Use Camera
          </button>
        </div>
      )}

      {image && !useCamera && (
        <div className="grid grid-cols-2 gap-3 mb-4">
          <button
            className="btn-primary"
            onClick={() => { setImage(null); setResult(null); setError('') }}
            style={{ background: 'linear-gradient(135deg, #64748b, #475569)' }}
          >
            <RefreshCw size={18} /> Retake
          </button>
          <button className="btn-primary" onClick={analyzeWithGemini} disabled={loading}>
            {loading ? <Loader size={18} className="animate-spin" /> : <CheckCircle size={18} />}
            {loading ? 'Analyzing...' : 'Analyze'}
          </button>
        </div>
      )}

      {error && (
        <div className="card mb-4 flex items-center gap-3" style={{ borderColor: 'rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.08)' }}>
          <AlertTriangle size={18} style={{ color: '#f87171' }} />
          <p className="text-sm" style={{ color: '#fca5a5' }}>{error}</p>
        </div>
      )}

      {/* Result */}
      {result && wasteInfo && (
        <div className="card animate-slide-up" style={{ borderColor: wasteInfo.border, background: wasteInfo.bg }}>
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl" style={{ background: 'rgba(0,0,0,0.2)' }}>
              {wasteInfo.emoji}
            </div>
            <div>
              <div className="text-xl font-bold" style={{ color: wasteInfo.color }}>{wasteInfo.label}</div>
              <div className="text-sm text-slate-300">{result.confidence}% confidence</div>
              {result.demo && <div className="text-xs text-slate-400 mt-0.5">⚡ Demo mode — add Gemini key for real AI</div>}
            </div>
          </div>

          <p className="text-sm text-slate-300 mb-3">{wasteInfo.description}</p>
          {result.reason && <p className="text-sm text-slate-400 italic mb-3">"{result.reason}"</p>}

          <div className="flex items-start gap-2 p-3 rounded-xl" style={{ background: 'rgba(0,0,0,0.2)' }}>
            <span className="text-base">💡</span>
            <p className="text-sm text-slate-300">{wasteInfo.tip}</p>
          </div>

          {/* Confidence bar */}
          <div className="mt-4">
            <div className="flex justify-between text-xs text-slate-400 mb-1">
              <span>Confidence</span>
              <span>{result.confidence}%</span>
            </div>
            <div className="h-2 rounded-full" style={{ background: 'rgba(0,0,0,0.3)' }}>
              <div className="h-2 rounded-full transition-all" style={{ width: `${result.confidence}%`, background: wasteInfo.color }}></div>
            </div>
          </div>
        </div>
      )}

      {/* Waste Type Guide */}
      {!result && (
        <div className="mt-6">
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">Waste Type Guide</h3>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(WASTE_TYPES).map(([key, info]) => {
              const Icon = info.icon
              return (
                <div key={key} className="card py-3 px-3" style={{ borderColor: info.border, background: info.bg }}>
                  <Icon size={16} style={{ color: info.color }} className="mb-1.5" />
                  <div className="text-xs font-semibold" style={{ color: info.color }}>{info.label}</div>
                  <div className="text-xs text-slate-400 mt-0.5 leading-tight" style={{ fontSize: '10px' }}>{info.tip}</div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
