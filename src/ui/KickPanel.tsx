import React, { useMemo } from "react";
import { ADSR, Sequencer, ToneGenerator, VCA, type SequencerHandle } from "@mode-7/mod";
import type { KickStreams } from "../engine/streams";
import { normalizeSteps } from "../engine/patterns";
import { ToggleSteps } from "./StepGrid";
import { styles } from "./styles";

interface KickPanelProps {
  bpm: number;
  onBpmChange: (value: number) => void;
  stepsCount: number;
  steps: number[];
  onStepsChange: (steps: number[]) => void;
  currentStep: number;
  onCurrentStepChange: (step: number) => void;
  onPlayingChange: (playing: boolean) => void;
  sequencerRef: React.RefObject<SequencerHandle>;
  streams: KickStreams;
}

export function KickPanel({
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
}: KickPanelProps) {
  const normalizedKickSteps = useMemo(() => normalizeSteps(steps), [steps]);

  return (
    <div style={styles.card}>
      <div style={styles.cardHeader}>
        <div>
          <div style={styles.cardTitle}>Kick (MVP)</div>
          <div style={styles.cardSub}>Trigger steps → ADSR → sine → VCA</div>
        </div>
      </div>

      <Sequencer
        ref={sequencerRef}
        output={streams.trigger}
        gateOutput={streams.gate}
        numSteps={stepsCount}
        steps={normalizedKickSteps}
        onStepsChange={onStepsChange}
        bpm={bpm}
        onBpmChange={onBpmChange}
        onCurrentStepChange={onCurrentStepChange}
        onPlayingChange={onPlayingChange}
      />

      <ToggleSteps steps={normalizedKickSteps} setSteps={onStepsChange} currentStep={currentStep} />

      <ADSR gate={streams.gate} output={streams.envelope} attack={0.001} decay={0.18} sustain={0.0} release={0.02} />

      <ToneGenerator output={streams.oscillator} waveform="sine" frequency={55} cv={streams.trigger} cvAmount={15} gain={0.9} />
      <VCA input={streams.oscillator} output={streams.output} gain={0} cv={streams.envelope} cvAmount={1.0} />
    </div>
  );
}
