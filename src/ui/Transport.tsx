import React from "react";
import { styles } from "./styles";

interface TransportProps {
  isRunning: boolean;
  bpm: number;
  onBpmChange: (value: number) => void;
  onToggle: () => void;
  onReset: () => void;
  statusLabel: string;
}

export function Transport({ isRunning, bpm, onBpmChange, onToggle, onReset, statusLabel }: TransportProps) {
  return (
    <div style={styles.transport}>
      <button style={styles.button} onClick={onToggle}>
        {isRunning ? "Stop" : "Play"}
      </button>

      <button style={styles.button} onClick={onReset}>
        Reset
      </button>

      <label style={styles.label}>
        BPM
        <input
          style={styles.input}
          type="number"
          min={40}
          max={240}
          value={bpm}
          onChange={(event) => onBpmChange(Number(event.target.value))}
        />
      </label>

      <span style={styles.dim}>{statusLabel}</span>
    </div>
  );
}
