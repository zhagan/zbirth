import React from "react";
import { Monitor } from "@mode-7/mod";
import type { ModStream } from "../engine/streams";
import { styles } from "./styles";

interface MasterSectionProps {
  stream: ModStream;
}

export function MasterSection({ stream }: MasterSectionProps) {
  return (
    <Monitor input={stream}>
      {({ gain, setGain, isMuted, setMuted, isActive }) => (
        <div style={styles.master}>
          <button style={styles.button} onClick={() => setMuted(!isMuted)}>
            {isMuted ? "Unmute" : "Mute"}
          </button>

          <label style={styles.label}>
            Master
            <input
              type="range"
              min={0}
              max={1.5}
              step={0.01}
              value={gain}
              onChange={(event) => setGain(Number(event.target.value))}
              disabled={isMuted}
              style={{ width: 260 }}
            />
            <span style={styles.dim}>{Math.round(gain * 100)}%</span>
          </label>

          <span style={styles.dim}>active: {String(isActive)}</span>
        </div>
      )}
    </Monitor>
  );
}
