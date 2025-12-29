import React from "react";

interface KnobProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
}

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

function formatValue(value: number) {
  if (value >= 1000) return `${Math.round(value)}`;
  if (value >= 10) return value.toFixed(1);
  return value.toFixed(3);
}

export function Knob({ label, value, min, max, step, onChange }: KnobProps) {
  const normalized = (value - min) / (max - min || 1);

  return (
    <label style={{ display: "grid", gap: 6, padding: 8, border: "1px solid #222", borderRadius: 12, background: "#12121a" }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "baseline" }}>
        <span style={{ fontSize: 12, opacity: 0.8 }}>{label}</span>
        <span style={{ fontSize: 12, opacity: 0.7 }}>{formatValue(value)}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(clamp(Number(event.target.value), min, max))}
        style={{ width: 180 }}
      />
      <div
        style={{
          height: 6,
          borderRadius: 999,
          background: "#0f0f16",
          border: "1px solid #2a2a38",
          overflow: "hidden",
        }}
      >
        <div style={{ height: "100%", width: `${normalized * 100}%`, background: "#7af" }} />
      </div>
    </label>
  );
}
