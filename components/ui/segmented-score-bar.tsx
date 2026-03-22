type SegmentedScoreBarProps = {
  label: string
  value: number
}

export default function SegmentedScoreBar({
  label,
  value,
}: SegmentedScoreBarProps) {
  const safeValue = Math.max(0, Math.min(100, Math.round(value)))
  const activeSegments = Math.max(1, Math.ceil(safeValue / 20))

  return (
    <div className="crm-score">
      <div className="crm-score-top">
        <span className="crm-score-label">{label}</span>
        <span className="crm-score-value">{safeValue}%</span>
      </div>

      <div className="crm-score-track">
        {Array.from({ length: 5 }).map((_, index) => (
          <span
            key={index}
            className={`crm-score-segment${
              index < activeSegments ? " active" : ""
            }`}
          />
        ))}
      </div>
    </div>
  )
}