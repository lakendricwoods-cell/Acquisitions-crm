import ActionButton from "@/components/ui/action-button"

type PipelineToolbarProps = {
  search: string
  onSearchChange: (value: string) => void
  stepFilter: "all" | "current" | "next"
  onStepFilterChange: (value: "all" | "current" | "next") => void
  onRefresh: () => void
}

export default function PipelineToolbar({
  search,
  onSearchChange,
  stepFilter,
  onStepFilterChange,
  onRefresh,
}: PipelineToolbarProps) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "minmax(260px, 1.2fr) 220px auto",
        gap: 12,
        alignItems: "center",
      }}
    >
      <input
        className="crm-input"
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        placeholder="Search address, seller, phone, source, next action..."
      />

      <select
        className="crm-select"
        value={stepFilter}
        onChange={(e) =>
          onStepFilterChange(e.target.value as "all" | "current" | "next")
        }
      >
        <option value="all">Show All Stages</option>
        <option value="current">Current Active Work</option>
        <option value="next">Next Step Focus</option>
      </select>

      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <ActionButton onClick={onRefresh}>Refresh Pipeline</ActionButton>
      </div>
    </div>
  )
}