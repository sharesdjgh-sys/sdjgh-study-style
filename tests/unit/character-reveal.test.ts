import { describe, expect, it } from "vitest";
import { STUDY_TYPES } from "../../src/lib/content";
import {
  CHARACTER_REVEAL_TIMING,
  REWARD_FRAME_DELAYS,
  rewardRevealSequence,
} from "../../src/lib/character-reveal";

const codes = STUDY_TYPES.map((type) => type.code);
describe("gift reveal", () => {
  it("matches the first discovery's 3300ms shuffle and 500ms pause", () => {
    expect(REWARD_FRAME_DELAYS.slice(0, -1).reduce((a, b) => a + b, 0)).toBe(
      CHARACTER_REVEAL_TIMING.shuffleEnd,
    );
    expect(REWARD_FRAME_DELAYS.at(-1)).toBe(500);
    expect(REWARD_FRAME_DELAYS.reduce((a, b) => a + b, 0)).toBe(3800);
    expect(
      REWARD_FRAME_DELAYS.slice(0, 23).every((delay) => delay === 85),
    ).toBe(true);
  });
  it.each([0, 1, 8, 14, 15])(
    "excludes %i previously collected cards and always lands on the award",
    (count) => {
      const owned = codes.slice(0, count);
      const award = codes.at(-1)!;
      for (let run = 0; run < 20; run++) {
        // Refresh has already added the award to the collection.
        const frames = rewardRevealSequence(codes, [...owned, award], award);
        expect(frames).toHaveLength(REWARD_FRAME_DELAYS.length);
        expect(frames.at(-1)).toBe(award);
        expect(
          frames.every((code) => codes.includes(code) && !owned.includes(code)),
        ).toBe(true);
        if (count < 15)
          expect(
            frames.slice(1, -1).every((code, i) => code !== frames[i]),
          ).toBe(true);
        else expect(new Set(frames)).toEqual(new Set([award]));
      }
    },
  );
  it("can hold the awarded card even if the candidate snapshot is empty", () => {
    expect(new Set(rewardRevealSequence([], [], codes[0]))).toEqual(
      new Set([codes[0]]),
    );
  });
});
