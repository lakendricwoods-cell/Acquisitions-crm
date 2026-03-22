"use client"

import { useState } from "react"
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts"

type DealData = {
  name: string
  value: number
}

const stageData: DealData[] = [
  { name: "New Lead", value: 14 },
  { name: "Contacted", value: 9 },
  { name: "Negotiating", value: 5 },
  { name: "Offer Sent", value: 3 },
  { name: "Under Contract", value: 2 },
]

const COLORS = ["#6b7280", "#3b82f6", "#8b5cf6", "#f59e0b", "#10b981"]

export default function DealIntelligenceGraph() {
  const [mode, setMode] = useState<"line" | "bar" | "pie">("line")

  return (
    <div
      style={{
        display: "grid",
        gap: 12,
      }}
    >
      <div
        style={{
          display: "flex",
          gap: 8,
          flexWrap: "wrap",
        }}
      >
        <button className="crm-btn" onClick={() => setMode("line")}>
          Line
        </button>
        <button className="crm-btn" onClick={() => setMode("bar")}>
          Bar
        </button>
        <button className="crm-btn" onClick={() => setMode("pie")}>
          Pie
        </button>
      </div>

      <div style={{ width: "100%", height: 280 }}>
        <ResponsiveContainer>
          {mode === "line" ? (
            <LineChart data={stageData}>
              <CartesianGrid stroke="rgba(255,255,255,0.08)" />
              <XAxis dataKey="name" stroke="rgba(255,255,255,0.5)" />
              <YAxis stroke="rgba(255,255,255,0.5)" />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="value"
                stroke="#d7b267"
                strokeWidth={2}
              />
            </LineChart>
          ) : mode === "bar" ? (
            <BarChart data={stageData}>
              <CartesianGrid stroke="rgba(255,255,255,0.08)" />
              <XAxis dataKey="name" stroke="rgba(255,255,255,0.5)" />
              <YAxis stroke="rgba(255,255,255,0.5)" />
              <Tooltip />
              <Bar dataKey="value" fill="#d7b267" radius={[6, 6, 0, 0]} />
            </BarChart>
          ) : (
            <PieChart>
              <Pie data={stageData} dataKey="value" nameKey="name" outerRadius={90}>
                {stageData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  )
}