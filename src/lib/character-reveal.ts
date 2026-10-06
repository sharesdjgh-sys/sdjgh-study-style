/** Shared with the first quiz discovery; opening video time is separate. */
export const CHARACTER_REVEAL_TIMING = {
  shuffleEnd: 3300,
  reveal: 3800,
  complete: 6000,
} as const;

export function characterShuffleDelay(tick: number) {
  return tick < 23 ? 85 : tick < 29 ? 150 : 280;
}

function frameDelays() {
  const delays: number[] = [];
  let elapsed = 0;
  let tick = 0;
  while (elapsed < CHARACTER_REVEAL_TIMING.shuffleEnd) {
    const delay = Math.min(
      characterShuffleDelay(tick++),
      CHARACTER_REVEAL_TIMING.shuffleEnd - elapsed,
    );
    delays.push(delay);
    elapsed += delay;
  }
  // Hold the awarded silhouette for the same 500ms anticipation pause.
  delays.push(CHARACTER_REVEAL_TIMING.reveal - elapsed);
  return delays;
}

export const REWARD_FRAME_DELAYS = frameDelays();

/** Presentation only. The server-issued award is never rerolled. */
export function rewardRevealSequence(
  codes: readonly string[],
  ownedCodes: readonly string[],
  award: string,
) {
  const owned = new Set(ownedCodes);
  // A collection refresh may already contain this newly awarded card.
  const candidates = [...new Set([...codes, award])].filter(
    (code) => code === award || !owned.has(code),
  );
  const sequence: string[] = [];
  for (let i = 0; i < REWARD_FRAME_DELAYS.length - 1; i++) {
    const previous = sequence.at(-1);
    const choices =
      candidates.length > 1
        ? candidates.filter((code) => code !== previous)
        : candidates;
    sequence.push(choices[Math.floor(Math.random() * choices.length)]);
  }
  sequence.push(award);
  return sequence;
}
