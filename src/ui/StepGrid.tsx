import React from "react";

interface StepGridProps {
  steps: number[];
  setSteps: (steps: number[]) => void;
  currentStep: number;
}

interface SliderStepGridProps extends StepGridProps {
  height?: number;
}

export function StepSliders({ steps, setSteps, currentStep, height = 120 }: SliderStepGridProps) {
  return (
    <div style={{ display: "flex", gap: 6, alignItems: "flex-end", padding: 8, overflowX: "auto" }}>
      {steps.map((value, index) => (
        <div key={index} style={{ display: "grid", gap: 6, justifyItems: "center" }}>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={value}
            onChange={(event) => {
              const next = steps.slice();
              next[index] = Number(event.target.value);
              setSteps(next);
            }}
            style={{
              writingMode: "bt-lr",
              WebkitAppearance: "slider-vertical",
              width: 22,
              height,
            }}
          />
          <div
            style={{
              width: 18,
              height: 10,
              borderRadius: 6,
              border: "1px solid #2a2a38",
              background: currentStep === index ? "#7af" : "#14141d",
            }}
            title={`step ${index + 1}`}
          />
          <div style={{ fontSize: 10, opacity: 0.7 }}>{index + 1}</div>
        </div>
      ))}
    </div>
  );
}

export function ToggleSteps({ steps, setSteps, currentStep }: StepGridProps) {
  return (
    <div style={{ display: "flex", gap: 8, padding: 8, flexWrap: "wrap" }}>
      {steps.map((value, index) => {
        const on = value > 0.5;
        return (
          <button
            key={index}
            onClick={() => {
              const next = steps.slice();
              next[index] = on ? 0 : 1;
              setSteps(next);
            }}
            style={{
              width: 34,
              height: 34,
              borderRadius: 10,
              border: "1px solid #2a2a38",
              background: currentStep === index ? "#22324a" : "#12121a",
              color: on ? "#fff" : "rgba(255,255,255,0.65)",
              boxShadow: on ? "inset 0 0 0 2px rgba(122,170,255,0.7)" : "none",
              cursor: "pointer",
            }}
            title={`step ${index + 1}`}
          >
            {on ? "●" : "○"}
          </button>
        );
      })}
    </div>
  );
}
