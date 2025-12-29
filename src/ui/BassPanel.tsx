import React from "react";
import { ADSR, Filter, Sequencer, ToneGenerator, VCA, type SequencerHandle } from "@mode-7/mod";
import type { BassStreams } from "../engine/streams";
import { StepSliders } from "./StepGrid";
import { Knob } from "./Knob";
import { styles } from "./styles";

interface EnvelopeSettings {
  attack: number;
  decay: number;
  sustain: number;
  release: number;
  onAttackChange: (value: number) => void;
  onDecayChange: (value: number) => void;
  onSustainChange: (value: number) => void;
  onReleaseChange: (value: number) => void;
}

interface BassPanelProps {
  bpm: number;
  onBpmChange: (value: number) => void;
  stepsCount: number;
  steps: number[];
  onStepsChange: (steps: number[]) => void;
  currentStep: number;
  onCurrentStepChange: (step: number) => void;
  onPlayingChange: (playing: boolean) => void;
  sequencerRef: React.RefObject<SequencerHandle>;
  streams: BassStreams;
  baseFrequency: number;
  onBaseFrequencyChange: (value: number) => void;
  pitchRange: number;
  onPitchRangeChange: (value: number) => void;
  cutoff: number;
  onCutoffChange: (value: number) => void;
  resonance: number;
  onResonanceChange: (value: number) => void;
  filterEnvelopeAmount: number;
  onFilterEnvelopeAmountChange: (value: number) => void;
  oscillatorGain: number;
  onOscillatorGainChange: (value: number) => void;
  ampEnvelope: EnvelopeSettings;
  filterEnvelope: EnvelopeSettings;
}

export function BassPanel({
  bpm,
  onBpmChange,
  stepsCount,
  steps,
  onStepsChange,
  currentStep,
  onCurrentStepChange,
  onPlayingChange,
  sequencerRef,
  streams,
  baseFrequency,
  onBaseFrequencyChange,
  pitchRange,
  onPitchRangeChange,
  cutoff,
  onCutoffChange,
  resonance,
  onResonanceChange,
  filterEnvelopeAmount,
  onFilterEnvelopeAmountChange,
  oscillatorGain,
  onOscillatorGainChange,
  ampEnvelope,
  filterEnvelope,
}: BassPanelProps) {
  return (
    <div style={styles.card}>
      <div style={styles.cardHeader}>
        <div>
          <div style={styles.cardTitle}>Bass (303-ish)</div>
          <div style={styles.cardSub}>Pitch CV + gate → envelopes → saw → LPF → VCA</div>
        </div>
      </div>

      <Sequencer
        ref={sequencerRef}
        output={streams.pitchCv}
        gateOutput={streams.gate}
        numSteps={stepsCount}
        steps={steps}
        onStepsChange={onStepsChange}
        bpm={bpm}
        onBpmChange={onBpmChange}
        onCurrentStepChange={onCurrentStepChange}
        onPlayingChange={onPlayingChange}
      />

      <StepSliders steps={steps} setSteps={onStepsChange} currentStep={currentStep} />

      <ADSR gate={streams.gate} output={streams.ampEnvelope} attack={ampEnvelope.attack} decay={ampEnvelope.decay} sustain={ampEnvelope.sustain} release={ampEnvelope.release} />
      <ADSR gate={streams.gate} output={streams.filterEnvelope} attack={filterEnvelope.attack} decay={filterEnvelope.decay} sustain={filterEnvelope.sustain} release={filterEnvelope.release} />

      <ToneGenerator
        output={streams.oscillator}
        waveform="sawtooth"
        frequency={baseFrequency}
        cv={streams.pitchCv}
        cvAmount={pitchRange}
        gain={oscillatorGain}
      />

      <Filter
        input={streams.oscillator}
        output={streams.filtered}
        type="lowpass"
        frequency={cutoff}
        Q={resonance}
        cv={streams.filterEnvelope}
        cvAmount={filterEnvelopeAmount}
      />

      <VCA input={streams.filtered} output={streams.output} gain={0} cv={streams.ampEnvelope} cvAmount={1.0} />

      <div style={styles.controls}>
        <Knob label="Base Freq" value={baseFrequency} min={40} max={440} step={1} onChange={onBaseFrequencyChange} />
        <Knob label="Pitch Range" value={pitchRange} min={50} max={2000} step={10} onChange={onPitchRangeChange} />
        <Knob label="Cutoff" value={cutoff} min={60} max={5000} step={10} onChange={onCutoffChange} />
        <Knob label="Resonance" value={resonance} min={0.1} max={24} step={0.1} onChange={onResonanceChange} />
        <Knob label="Env Amt" value={filterEnvelopeAmount} min={0} max={10000} step={50} onChange={onFilterEnvelopeAmountChange} />
        <Knob label="Osc Gain" value={oscillatorGain} min={0} max={1} step={0.01} onChange={onOscillatorGainChange} />
      </div>

      <div style={styles.controls}>
        <Knob label="A" value={ampEnvelope.attack} min={0.001} max={1} step={0.001} onChange={ampEnvelope.onAttackChange} />
        <Knob label="D" value={ampEnvelope.decay} min={0.001} max={1} step={0.001} onChange={ampEnvelope.onDecayChange} />
        <Knob label="S" value={ampEnvelope.sustain} min={0} max={1} step={0.01} onChange={ampEnvelope.onSustainChange} />
        <Knob label="R" value={ampEnvelope.release} min={0.001} max={2} step={0.001} onChange={ampEnvelope.onReleaseChange} />
        <div style={{ opacity: 0.7, fontSize: 12, paddingLeft: 8 }}>Amp ADSR</div>
      </div>

      <div style={styles.controls}>
        <Knob label="fA" value={filterEnvelope.attack} min={0.001} max={1} step={0.001} onChange={filterEnvelope.onAttackChange} />
        <Knob label="fD" value={filterEnvelope.decay} min={0.001} max={1} step={0.001} onChange={filterEnvelope.onDecayChange} />
        <Knob label="fS" value={filterEnvelope.sustain} min={0} max={1} step={0.01} onChange={filterEnvelope.onSustainChange} />
        <Knob label="fR" value={filterEnvelope.release} min={0.001} max={2} step={0.001} onChange={filterEnvelope.onReleaseChange} />
        <div style={{ opacity: 0.7, fontSize: 12, paddingLeft: 8 }}>Filter ADSR</div>
      </div>
    </div>
  );
}
