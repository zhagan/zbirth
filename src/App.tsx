// src/App.tsx
import React, { useMemo, useRef, useState } from "react";
import {
  AudioProvider,
  Sequencer,
  ADSR,
  ToneGenerator,
  Filter,
  VCA,
  Mixer,
  Monitor,
  useModStream,
  type SequencerHandle,
} from "@mode-7/mod";

const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

function makeSteps(len: number, fn: (i: number) => number) {
  return Array.from({ length: len }, (_, i) => fn(i));
}

function StepSliders({
  steps,
  setSteps,
  currentStep,
  height = 120,
}: {
  steps: number[];
  setSteps: (s: number[]) => void;
  currentStep: number;
  height?: number;
}) {
  return (
    <div style={{ display: "flex", gap: 6, alignItems: "flex-end", padding: 8, overflowX: "auto" }}>
      {steps.map((value, i) => (
        <div key={i} style={{ display: "grid", gap: 6, justifyItems: "center" }}>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={value}
            onChange={(e) => {
              const next = steps.slice();
              next[i] = Number(e.target.value);
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
              background: currentStep === i ? "#7af" : "#14141d",
            }}
            title={`step ${i + 1}`}
          />
          <div style={{ fontSize: 10, opacity: 0.7 }}>{i + 1}</div>
        </div>
      ))}
    </div>
  );
}

function ToggleSteps({
  steps,
  setSteps,
  currentStep,
}: {
  steps: number[];
  setSteps: (s: number[]) => void;
  currentStep: number;
}) {
  return (
    <div style={{ display: "flex", gap: 8, padding: 8, flexWrap: "wrap" }}>
      {steps.map((v, i) => {
        const on = v > 0.5;
        return (
          <button
            key={i}
            onClick={() => {
              const next = steps.slice();
              next[i] = on ? 0 : 1;
              setSteps(next);
            }}
            style={{
              width: 34,
              height: 34,
              borderRadius: 10,
              border: "1px solid #2a2a38",
              background: currentStep === i ? "#22324a" : "#12121a",
              color: on ? "#fff" : "rgba(255,255,255,0.65)",
              boxShadow: on ? "inset 0 0 0 2px rgba(122,170,255,0.7)" : "none",
              cursor: "pointer",
            }}
            title={`step ${i + 1}`}
          >
            {on ? "●" : "○"}
          </button>
        );
      })}
    </div>
  );
}

export default function App() {
  // ===== Streams (patch cables) =====
  // Bass lane
  const bassPitchCv = useModStream();
  const bassGate = useModStream();
  const bassAmpEnv = useModStream();
  const bassFilterEnv = useModStream();
  const bassOsc = useModStream();
  const bassFiltered = useModStream();
  const bassOut = useModStream();

  // Kick lane
  const kickTrig = useModStream();
  const kickGate = useModStream();
  const kickEnv = useModStream();
  const kickOsc = useModStream();
  const kickOut = useModStream();

  // Master
  const master = useModStream();

  // ===== Sequencer refs (so one Play button controls both) =====
  const bassSeqRef = useRef<SequencerHandle>(null);
  const kickSeqRef = useRef<SequencerHandle>(null);

  // ===== UI state =====
  const stepsCount = 16;

  const [bpm, setBpm] = useState(128);

  // Track current steps for UI highlight (from Sequencer callbacks)
  const [bassStep, setBassStep] = useState(0);
  const [kickStep, setKickStep] = useState(0);

  const [bassPlaying, setBassPlaying] = useState(false);
  const [kickPlaying, setKickPlaying] = useState(false);

  // Bass: CV steps (0..1) — treat as "pitch lane"
  const [bassSteps, setBassSteps] = useState<number[]>(
    makeSteps(stepsCount, (i) => {
      const pat = [0.0, 0.18, 0.35, 0.62];
      return pat[i % pat.length];
    })
  );

  // Kick: simple on/off steps (0/1)
  const [kickSteps, setKickSteps] = useState<number[]>(
    makeSteps(stepsCount, (i) => (i % 4 === 0 ? 1 : 0))
  );

  const isRunning = bassPlaying && kickPlaying;

  // ===== Synth parameters (so you can hear changes clearly) =====
  const [bassBaseFreq, setBassBaseFreq] = useState(110);
  const [bassPitchRange, setBassPitchRange] = useState(880);

  const [cutoffBase, setCutoffBase] = useState(250);
  const [resonance, setResonance] = useState(12);
  const [filterEnvAmt, setFilterEnvAmt] = useState(4500);

  const [bassOscGain, setBassOscGain] = useState(0.35);

  // Amp envelope
  const [a, setA] = useState(0.001);
  const [d, setD] = useState(0.12);
  const [s, setS] = useState(0.0);
  const [r, setR] = useState(0.08);

  // Filter envelope
  const [fa, setFa] = useState(0.001);
  const [fd, setFd] = useState(0.18);
  const [fs, setFs] = useState(0.0);
  const [fr, setFr] = useState(0.05);

  // A tiny helper: you can start both sequencers together
  const startAll = () => {
    bassSeqRef.current?.play();
    kickSeqRef.current?.play();
  };

  const stopAll = () => {
    bassSeqRef.current?.pause();
    kickSeqRef.current?.pause();
  };

  const resetAll = () => {
    bassSeqRef.current?.reset();
    kickSeqRef.current?.reset();
  };

  // Normalize kick to 0/1 (in case you later turn it into sliders)
  const normalizedKickSteps = useMemo(() => kickSteps.map((v) => (v > 0.5 ? 1 : 0)), [kickSteps]);

  return (
    <div style={styles.page}>
      <h2 style={styles.title}>ReBirth-ish MVP (MOD)</h2>

      <AudioProvider>
        {/* ===== Transport (starts Sequencers, not Clock) ===== */}
        <div style={styles.transport}>
          <button
            style={styles.button}
            onClick={() => {
              // Must be a user click to unlock WebAudio; Sequencer.play() is the right call here.
              if (isRunning) stopAll();
              else startAll();
            }}
          >
            {isRunning ? "Stop" : "Play"}
          </button>

          <button style={styles.button} onClick={resetAll}>
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
              onChange={(e) => setBpm(Number(e.target.value))}
            />
          </label>

          <span style={styles.dim}>
            bass: {bassPlaying ? "playing" : "paused"} • kick: {kickPlaying ? "playing" : "paused"}
          </span>
        </div>

        <div style={styles.grid}>
          {/* ===== Bass panel ===== */}
          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <div>
                <div style={styles.cardTitle}>Bass (303-ish)</div>
                <div style={styles.cardSub}>Pitch CV + gate → envelopes → saw → LPF → VCA</div>
              </div>
            </div>

            {/* Bass Sequencer w/ UI */}
            <Sequencer
              ref={bassSeqRef}
              output={bassPitchCv}
              gateOutput={bassGate}
              numSteps={stepsCount}
              steps={bassSteps}
              onStepsChange={setBassSteps}
              bpm={bpm}
              onBpmChange={setBpm}
              onCurrentStepChange={setBassStep}
              onPlayingChange={setBassPlaying}
            />

            <StepSliders steps={bassSteps} setSteps={setBassSteps} currentStep={bassStep} />

            {/* Amp ADSR */}
            <ADSR gate={bassGate} output={bassAmpEnv} attack={a} decay={d} sustain={s} release={r} />

            {/* Filter ADSR */}
            <ADSR gate={bassGate} output={bassFilterEnv} attack={fa} decay={fd} sustain={fs} release={fr} />

            {/* Osc */}
            <ToneGenerator
              output={bassOsc}
              waveform="sawtooth"
              frequency={bassBaseFreq}
              cv={bassPitchCv}
              cvAmount={bassPitchRange}
              gain={bassOscGain}
            />

            {/* Filter */}
            <Filter
              input={bassOsc}
              output={bassFiltered}
              type="lowpass"
              frequency={cutoffBase}
              Q={resonance}
              cv={bassFilterEnv}
              cvAmount={filterEnvAmt}
            />

            {/* VCA */}
            <VCA input={bassFiltered} output={bassOut} gain={0} cv={bassAmpEnv} cvAmount={1.0} />

            {/* Controls */}
            <div style={styles.controls}>
              <Knob label="Base Freq" value={bassBaseFreq} min={40} max={440} step={1} onChange={setBassBaseFreq} />
              <Knob label="Pitch Range" value={bassPitchRange} min={50} max={2000} step={10} onChange={setBassPitchRange} />
              <Knob label="Cutoff" value={cutoffBase} min={60} max={5000} step={10} onChange={setCutoffBase} />
              <Knob label="Resonance" value={resonance} min={0.1} max={24} step={0.1} onChange={setResonance} />
              <Knob label="Env Amt" value={filterEnvAmt} min={0} max={10000} step={50} onChange={setFilterEnvAmt} />
              <Knob label="Osc Gain" value={bassOscGain} min={0} max={1} step={0.01} onChange={setBassOscGain} />
            </div>

            <div style={styles.controls}>
              <Knob label="A" value={a} min={0.001} max={1} step={0.001} onChange={setA} />
              <Knob label="D" value={d} min={0.001} max={1} step={0.001} onChange={setD} />
              <Knob label="S" value={s} min={0} max={1} step={0.01} onChange={setS} />
              <Knob label="R" value={r} min={0.001} max={2} step={0.001} onChange={setR} />
              <div style={{ opacity: 0.7, fontSize: 12, paddingLeft: 8 }}>Amp ADSR</div>
            </div>

            <div style={styles.controls}>
              <Knob label="fA" value={fa} min={0.001} max={1} step={0.001} onChange={setFa} />
              <Knob label="fD" value={fd} min={0.001} max={1} step={0.001} onChange={setFd} />
              <Knob label="fS" value={fs} min={0} max={1} step={0.01} onChange={setFs} />
              <Knob label="fR" value={fr} min={0.001} max={2} step={0.001} onChange={setFr} />
              <div style={{ opacity: 0.7, fontSize: 12, paddingLeft: 8 }}>Filter ADSR</div>
            </div>
          </div>

          {/* ===== Kick panel ===== */}
          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <div>
                <div style={styles.cardTitle}>Kick (MVP)</div>
                <div style={styles.cardSub}>Trigger steps → ADSR → sine → VCA</div>
              </div>
            </div>

            <Sequencer
              ref={kickSeqRef}
              output={kickTrig}
              gateOutput={kickGate}
              numSteps={stepsCount}
              steps={normalizedKickSteps}
              onStepsChange={setKickSteps}
              bpm={bpm}
              onBpmChange={setBpm}
              onCurrentStepChange={setKickStep}
              onPlayingChange={setKickPlaying}
            />

            <ToggleSteps steps={normalizedKickSteps} setSteps={setKickSteps} currentStep={kickStep} />

            <ADSR gate={kickGate} output={kickEnv} attack={0.001} decay={0.18} sustain={0.0} release={0.02} />

            <ToneGenerator output={kickOsc} waveform="sine" frequency={55} cv={kickTrig} cvAmount={15} gain={0.9} />
            <VCA input={kickOsc} output={kickOut} gain={0} cv={kickEnv} cvAmount={1.0} />
          </div>
        </div>

        {/* ===== Mix + Master Output with UI ===== */}
        <Mixer inputs={[bassOut, kickOut]} output={master} levels={[0.8, 0.9]} />

        <Monitor input={master}>
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
                  onChange={(e) => setGain(Number(e.target.value))}
                  disabled={isMuted}
                  style={{ width: 260 }}
                />
                <span style={styles.dim}>{Math.round(gain * 100)}%</span>
              </label>

              <span style={styles.dim}>active: {String(isActive)}</span>
            </div>
          )}
        </Monitor>
      </AudioProvider>

      <p style={styles.note}>
        Tip: If you want instant acid, raise <b>Resonance</b> to ~16 and <b>Env Amt</b> to ~7000.
      </p>
    </div>
  );
}

function Knob({
  label,
  value,
  min,
  max,
  step,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
}) {
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
        onChange={(e) => onChange(clamp(Number(e.target.value), min, max))}
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

function formatValue(v: number) {
  if (v >= 1000) return `${Math.round(v)}`;
  if (v >= 10) return v.toFixed(1);
  return v.toFixed(3);
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    padding: 16,
    fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
    color: "#eaeaea",
    background: "#0b0b0f",
    minHeight: "100vh",
  },
  title: { margin: "0 0 12px 0", fontSize: 18, fontWeight: 800 },
  transport: {
    display: "flex",
    gap: 10,
    alignItems: "center",
    padding: 12,
    borderRadius: 14,
    border: "1px solid #222",
    background: "#12121a",
    width: "fit-content",
  },
  grid: {
    marginTop: 12,
    display: "grid",
    gridTemplateColumns: "1.3fr 1fr",
    gap: 12,
    alignItems: "start",
  },
  card: {
    border: "1px solid #222",
    borderRadius: 16,
    background: "#0f0f16",
    padding: 12,
  },
  cardHeader: { display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: 8 },
  cardTitle: { fontWeight: 800, fontSize: 14 },
  cardSub: { opacity: 0.7, fontSize: 12, marginTop: 2 },
  controls: {
    marginTop: 10,
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
    alignItems: "center",
  },
  master: {
    marginTop: 12,
    padding: 12,
    display: "flex",
    gap: 12,
    alignItems: "center",
    borderRadius: 14,
    border: "1px solid #222",
    background: "#12121a",
    width: "fit-content",
  },
  button: {
    padding: "8px 12px",
    borderRadius: 12,
    border: "1px solid #2a2a38",
    background: "#1a1a26",
    color: "#fff",
    cursor: "pointer",
  },
  label: { display: "flex", alignItems: "center", gap: 10, fontSize: 12 },
  input: {
    width: 86,
    padding: "6px 8px",
    borderRadius: 10,
    border: "1px solid #2a2a38",
    background: "#0f0f16",
    color: "#fff",
  },
  dim: { opacity: 0.7, fontSize: 12 },
  note: { marginTop: 12, opacity: 0.75, fontSize: 12 },
};
