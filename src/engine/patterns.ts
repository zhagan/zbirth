export function makeSteps(len: number, fn: (index: number) => number) {
  return Array.from({ length: len }, (_, i) => fn(i));
}

export function createBassPattern(stepsCount: number) {
  const pattern = [0.0, 0.18, 0.35, 0.62];
  return makeSteps(stepsCount, (index) => pattern[index % pattern.length]);
}

export function createKickPattern(stepsCount: number) {
  return makeSteps(stepsCount, (index) => (index % 4 === 0 ? 1 : 0));
}

export function normalizeSteps(steps: number[]) {
  return steps.map((value) => (value > 0.5 ? 1 : 0));
}
