import { useModStream } from "@mode-7/mod";

export type ModStream = ReturnType<typeof useModStream>;

export interface BassStreams {
  pitchCv: ModStream;
  gate: ModStream;
  ampEnvelope: ModStream;
  filterEnvelope: ModStream;
  oscillator: ModStream;
  filtered: ModStream;
  output: ModStream;
}

export interface KickStreams {
  trigger: ModStream;
  gate: ModStream;
  envelope: ModStream;
  oscillator: ModStream;
  output: ModStream;
}

export interface RebirthStreams {
  bass: BassStreams;
  kick: KickStreams;
  master: ModStream;
}

export function useRebirthStreams(): RebirthStreams {
  const bass: BassStreams = {
    pitchCv: useModStream(),
    gate: useModStream(),
    ampEnvelope: useModStream(),
    filterEnvelope: useModStream(),
    oscillator: useModStream(),
    filtered: useModStream(),
    output: useModStream(),
  };

  const kick: KickStreams = {
    trigger: useModStream(),
    gate: useModStream(),
    envelope: useModStream(),
    oscillator: useModStream(),
    output: useModStream(),
  };

  const master = useModStream();

  return { bass, kick, master };
}
