import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts'
import { BarChart2, TrendingUp, Recycle } from 'lucide-react'

const WASTE_COLORS = {
  wet: '#60a5fa',
  dry: '#fbbf24',
  recyclable: '#34d399',
  hazardous: '#f87171',
}

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 10, padding: '10px 14px' }}>
        <p style={{ color: '#94a3b8', fontSize: 12, marginBottom: 4 }}>{label}</p>
        {payload.map(p => (
          <p key={p.name} style={{ color: p.color, fontSize: 13, fontWeight: 600 }}>
            {p.name}: {p.value}
          </p>
        ))}
      </div>
    )
  }
  return null
}

export default function Analytics() {
  const [dailyData, setDailyData] = useState([])
  const [wasteTypePie, setWasteTypePie] = useState([])
  const [binFillData, setBinFillData] = useState([])
  const [loading, setLoading] = useState(true)
  const [totalCollections, setTotalCollections] = useState(0)

  useEffect(() => { fetchAnalytics() }, [])

  async function fetchAnalytics() {
    setLoading(true)

    // Collections over last 7 days
    const days = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      days.push(d)
    }

    const dailyPromises = days.map(async (day) => {
      const start = new Date(day)
      start.setHours(0, 0, 0, 0)
      const end = new Date(day)
      end.setHours(23, 59, 59, 999)

      const { count } = await supabase
        .from('collections_log')
        .select('*', { count: 'exact', head: true })
        .gte('timestamp', start.toISOString())
        .lte('timestamp', end.toISOString())

      return {
        day: day.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric' }),
        collections: count || 0,
      }
    })

    const daily = await Promise.all(dailyPromises)
    setDailyData(daily)
    setTotalCollections(daily.reduce((a, b) => a + b.collections, 0))

    // Waste type breakdown
    const { data: logs } = await supabase.from('collections_log').select('waste_type')
    const typeCounts = {}
    ;(logs || []).forEach(log => {
      const t = log.waste_type || 'unknown'
      typeCounts[t] = (typeCounts[t] || 0) + 1
    })
    setWasteTypePie(
      Object.entries(typeCounts).map(([name, value]) => ({ name, value }))
    )

    // Bin fill level distribution
    const { data: bins } = await supabase.from('bins').select('fill_level, type')
    const fillRanges = [
      { range: '0–25%', count: 0 },
      { range: '26–50%', count: 0 },
      { range: '51–75%', count: 0 },
      { range: '76–100%', count: 0 },
    ]
    ;(bins || []).forEach(bin => {
      if (bin.fill_level <= 25) fillRanges[0].count++
      else if (bin.fill_level <= 50) fillRanges[1].count++
      else if (bin.fill_level <= 75) fillRanges[2].count++
      else fillRanges[3].count++
    })
    setBinFillData(fillRanges)

    setLoading(false)
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-64">
      <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="w-full space-y-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <p style={{ color: 'var(--nexora-text)', opacity: 0.6 }} className="text-sm font-medium">Collection performance · Last 7 days</p>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">
        {[
          { label: 'Collections (7d)', value: totalCollections, icon: BarChart2, color: '#10b981' },
          { label: 'Avg/Day', value: Math.round(totalCollections / 7), icon: TrendingUp, color: '#60a5fa' },
          { label: 'Waste Types', value: wasteTypePie.length, icon: Recycle, color: '#a78bfa' },
        ].map(kpi => {
          const Icon = kpi.icon
          return (
            <div key={kpi.label} className="card py-6 flex flex-col justify-center transition-transform hover:-translate-y-1 hover:shadow-lg">
              <Icon size={24} style={{ color: kpi.color }} className="mb-4" />
              <div className="text-3xl font-extrabold mb-2 tracking-tight" style={{ color: 'var(--nexora-text)' }}>{kpi.value}</div>
              <div className="text-sm font-semibold uppercase tracking-wider" style={{ color: 'var(--nexora-text)', opacity: 0.6 }}>{kpi.label}</div>
            </div>
          )
        })}
      </div>

      {/* Collections over time */}
      <div className="card mb-6 shadow-md border-0 ring-1" style={{ ringColor: 'var(--nexora-border)' }}>
        <h2 className="text-lg font-bold mb-1" style={{ color: 'var(--nexora-text)' }}>Collections Over Time</h2>
        <p className="text-sm font-medium mb-6" style={{ color: 'var(--nexora-text)', opacity: 0.6 }}>Daily collections in the last 7 days</p>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={dailyData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="day" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Line
              type="monotone" dataKey="collections" name="Collections"
              stroke="#10b981" strokeWidth={2.5} dot={{ fill: '#10b981', strokeWidth: 0, r: 4 }}
              activeDot={{ r: 6, fill: '#10b981' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Waste type pie */}
        <div className="card shadow-md border-0 ring-1" style={{ ringColor: 'var(--nexora-border)' }}>
          <h2 className="text-lg font-bold mb-1" style={{ color: 'var(--nexora-text)' }}>Collections by Waste Type</h2>
          <p className="text-sm font-medium mb-6" style={{ color: 'var(--nexora-text)', opacity: 0.6 }}>All time breakdown</p>
          {wasteTypePie.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={wasteTypePie} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={4} dataKey="value">
                  {wasteTypePie.map((entry, index) => (
                    <Cell key={index} fill={WASTE_COLORS[entry.name] || '#94a3b8'} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend formatter={(value) => <span style={{ color: '#94a3b8', fontSize: 12, textTransform: 'capitalize' }}>{value}</span>} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="font-medium text-center py-12" style={{ color: 'var(--nexora-text)', opacity: 0.5 }}>No data yet</p>
          )}
        </div>

        {/* Bin fill distribution */}
        <div className="card shadow-md border-0 ring-1" style={{ ringColor: 'var(--nexora-border)' }}>
          <h2 className="text-lg font-bold mb-1" style={{ color: 'var(--nexora-text)' }}>Bin Fill Distribution</h2>
          <p className="text-sm font-medium mb-6" style={{ color: 'var(--nexora-text)', opacity: 0.6 }}>Current fill levels across all bins</p>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={binFillData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="range" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="count" name="Bins" radius={[6, 6, 0, 0]}>
                {binFillData.map((entry, index) => {
                  const colors = ['#34d399', '#fbbf24', '#fb923c', '#f87171']
                  return <Cell key={index} fill={colors[index]} />
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
