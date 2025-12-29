// src/App.tsx
import React, { useRef, useState } from "react";
import { AudioProvider, Mixer, type SequencerHandle } from "@mode-7/mod";
import { useRebirthStreams } from "./engine/streams";
import { createBassPattern, createKickPattern } from "./engine/patterns";
import { BassPanel } from "./ui/BassPanel";
import { KickPanel } from "./ui/KickPanel";
import { MasterSection } from "./ui/MasterSection";
import { Transport } from "./ui/Transport";
import { styles } from "./ui/styles";

export default function App() {
  const streams = useRebirthStreams();

  const bassSeqRef = useRef<SequencerHandle>(null);
  const kickSeqRef = useRef<SequencerHandle>(null);

  const stepsCount = 16;

  const [bpm, setBpm] = useState(128);

  const [bassStep, setBassStep] = useState(0);
  const [kickStep, setKickStep] = useState(0);

  const [bassPlaying, setBassPlaying] = useState(false);
  const [kickPlaying, setKickPlaying] = useState(false);

  const [bassSteps, setBassSteps] = useState<number[]>(createBassPattern(stepsCount));
  const [kickSteps, setKickSteps] = useState<number[]>(createKickPattern(stepsCount));

  const isRunning = bassPlaying && kickPlaying;

  const [bassBaseFreq, setBassBaseFreq] = useState(110);
  const [bassPitchRange, setBassPitchRange] = useState(880);

  const [cutoffBase, setCutoffBase] = useState(250);
  const [resonance, setResonance] = useState(12);
  const [filterEnvAmt, setFilterEnvAmt] = useState(4500);

  const [bassOscGain, setBassOscGain] = useState(0.35);

  const [a, setA] = useState(0.001);
  const [d, setD] = useState(0.12);
  const [s, setS] = useState(0.0);
  const [r, setR] = useState(0.08);

  const [fa, setFa] = useState(0.001);
  const [fd, setFd] = useState(0.18);
  const [fs, setFs] = useState(0.0);
  const [fr, setFr] = useState(0.05);

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

  const statusLabel = `bass: ${bassPlaying ? "playing" : "paused"} • kick: ${kickPlaying ? "playing" : "paused"}`;

  const ampEnvelope = {
    attack: a,
    decay: d,
    sustain: s,
    release: r,
    onAttackChange: setA,
    onDecayChange: setD,
    onSustainChange: setS,
    onReleaseChange: setR,
  };

  const filterEnvelope = {
    attack: fa,
    decay: fd,
    sustain: fs,
    release: fr,
    onAttackChange: setFa,
    onDecayChange: setFd,
    onSustainChange: setFs,
    onReleaseChange: setFr,
  };

  return (
    <div style={styles.page}>
      <h2 style={styles.title}>ReBirth-ish MVP (MOD)</h2>

      <AudioProvider>
        <Transport
          isRunning={isRunning}
          bpm={bpm}
          onBpmChange={setBpm}
          onToggle={() => (isRunning ? stopAll() : startAll())}
          onReset={resetAll}
          statusLabel={statusLabel}
        />

        <div style={styles.grid}>
          <BassPanel
            bpm={bpm}
            onBpmChange={setBpm}
            stepsCount={stepsCount}
            steps={bassSteps}
            onStepsChange={setBassSteps}
            currentStep={bassStep}
            onCurrentStepChange={setBassStep}
            onPlayingChange={setBassPlaying}
            sequencerRef={bassSeqRef}
            streams={streams.bass}
            baseFrequency={bassBaseFreq}
            onBaseFrequencyChange={setBassBaseFreq}
            pitchRange={bassPitchRange}
            onPitchRangeChange={setBassPitchRange}
            cutoff={cutoffBase}
            onCutoffChange={setCutoffBase}
            resonance={resonance}
            onResonanceChange={setResonance}
            filterEnvelopeAmount={filterEnvAmt}
            onFilterEnvelopeAmountChange={setFilterEnvAmt}
            oscillatorGain={bassOscGain}
            onOscillatorGainChange={setBassOscGain}
            ampEnvelope={ampEnvelope}
            filterEnvelope={filterEnvelope}
          />

          <KickPanel
            bpm={bpm}
            onBpmChange={setBpm}
            stepsCount={stepsCount}
            steps={kickSteps}
            onStepsChange={setKickSteps}
            currentStep={kickStep}
            onCurrentStepChange={setKickStep}
            onPlayingChange={setKickPlaying}
            sequencerRef={kickSeqRef}
            streams={streams.kick}
          />
        </div>

        <Mixer inputs={[streams.bass.output, streams.kick.output]} output={streams.master} levels={[0.8, 0.9]} />

        <MasterSection stream={streams.master} />
      </AudioProvider>

      <p style={styles.note}>
        Tip: If you want instant acid, raise <b>Resonance</b> to ~16 and <b>Env Amt</b> to ~7000.
      </p>
    </div>
  );
}
