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

const COLORS = [
  "#6b7280",
  "#3b82f6",
  "#8b5cf6",
  "#f59e0b",
  "#10b981",
]

export default function DealIntelligenceGraph() {
  const [mode, setMode] = useState<"line" | "bar" | "pie">("line")

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <h3 style={titleStyle}>Deal Intelligence</h3>

        <div style={modeButtons}>
          <button onClick={() => setMode("line")} style={buttonStyle}>
            Line
          </button>
          <button onClick={() => setMode("bar")} style={buttonStyle}>
            Bar
          </button>
          <button onClick={() => setMode("pie")} style={buttonStyle}>
            Pie
          </button>
        </div>
      </div>

      <div style={{ width: "100%", height: 260 }}>
        <ResponsiveContainer>
          {mode === "line" ? (
            <LineChart data={stageData}>
              <CartesianGrid stroke="#222" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="value"
                stroke="#fbbf24"
                strokeWidth={2}
              />
            </LineChart>
          ) : mode === "bar" ? (
            <BarChart data={stageData}>
              <CartesianGrid stroke="#222" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#fbbf24" />
            </BarChart>
          ) : (
            <PieChart>
              <Pie
                data={stageData}
                dataKey="value"
                nameKey="name"
                outerRadius={90}
              >
                {stageData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
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

const containerStyle = {
  background: "#0b0b0c",
  borderRadius: 16,
  padding: 16,
  border: "1px solid rgba(255,255,255,0.05)",
}

const headerStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: 12,
}

const titleStyle = {
  fontSize: 16,
  fontWeight: 600,
}

const modeButtons = {
  display: "flex",
  gap: 8,
}

const buttonStyle = {
  padding: "6px 10px",
  background: "#111",
  borderRadius: 8,
  border: "1px solid rgba(255,255,255,0.08)",
  cursor: "pointer",
}