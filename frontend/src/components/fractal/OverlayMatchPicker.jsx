import React from "react";

// Phase label mapping - FULL names (space allows)
const PHASE_LABELS = {
  ACCUMULATION: "Accumulation",
  ACC: "Accumulation",
  DISTRIBUTION: "Distribution",
  DIS: "Distribution",
  RECOVERY: "Recovery",
  REC: "Recovery",
  MARKDOWN: "Markdown",
  MAR: "Markdown",
  MARKUP: "Markup",
  MKU: "Markup",
  CAPITULATION: "Capitulation",
  CAP: "Capitulation",
};

export function OverlayMatchPicker({ matches, value, onChange }) {
  const top = matches.slice(0, 5);
  return (
    <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
      {top.map((m, i) => {
        const active = i === value;
        const isBest = i === 0; // First match is best (highest similarity)
        const phaseLabel = PHASE_LABELS[m.phase] || m.phase;
        
        // Color logic: Best match = green, Active = dark, Rest = gray
        let textColor = "#6b7280"; // default gray
        if (isBest) {
          textColor = "#059669"; // emerald-600 (green) for best match
        } else if (active) {
          textColor = "#1f2937"; // dark for active non-best
        }
        
        return (
          <button
            key={m.id}
            onClick={() => onChange(i)}
            data-testid={`match-picker-${i}`}
            title={isBest ? "Best match (highest similarity)" : "Click to replay this historical pattern"}
            style={{
              padding: "4px 0",
              background: "transparent",
              color: textColor,
              border: "none",
              cursor: "pointer",
              fontSize: 13,
              fontWeight: active ? 600 : 400,
              transition: "all 0.15s ease"
            }}
          >
            {i + 1} · {phaseLabel} · {(m.similarity * 100).toFixed(0)}%
          </button>
        );
      })}
    </div>
  );
}
