import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'

interface ScoreGaugeProps { score: number; size?: number }

export function ScoreGauge({ score, size = 140 }: ScoreGaugeProps) {
  const color = score >= 80 ? '#10b981' : score >= 60 ? '#f59e0b' : '#ef4444'
  const data = [{ value: score }, { value: 100 - score }]
  // cy="55%" → diameter sits at 55% of SVG height = 0.55 * size
  // container clips at that point, showing only the upper semicircle
  const containerH = Math.round(size * 0.55)

  return (
    <div className="flex flex-col items-center">
      <div style={{ width: size, height: containerH }} className="relative overflow-hidden">
        <ResponsiveContainer width="100%" height={size}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="55%"
              startAngle={180}
              endAngle={0}
              innerRadius={size * 0.30}
              outerRadius={size * 0.44}
              paddingAngle={3}
              dataKey="value"
            >
              <Cell fill={color} />
              <Cell fill="#e2e8f0" />
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        {/* Score text sits inside the inner hole of the arc, near the diameter line */}
        <div className="absolute bottom-0 left-0 right-0 flex justify-center items-end pb-1 pointer-events-none">
          <div className="text-center leading-none">
            <span className="text-2xl font-bold" style={{ color }}>{score}</span>
            <span className="text-xs text-slate-400 ml-0.5">/100</span>
          </div>
        </div>
      </div>
    </div>
  )
}
