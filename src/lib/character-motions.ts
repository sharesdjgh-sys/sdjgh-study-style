export type CharacterMotionAsset = {
  video: string;
  poster: string;
};

const codes = [
  "visual-solo-planned",
  "visual-solo-flexible",
  "visual-team-planned",
  "visual-team-flexible",
  "auditory-solo-planned",
  "auditory-solo-flexible",
  "auditory-team-planned",
  "auditory-team-flexible",
  "tactile-solo-planned",
  "tactile-solo-flexible",
  "tactile-team-planned",
  "tactile-team-flexible",
  "motion-solo-planned",
  "motion-solo-flexible",
  "motion-team-planned",
  "motion-team-flexible",
] as const;

export const CHARACTER_MOTIONS: Readonly<
  Partial<Record<string, CharacterMotionAsset>>
> = Object.fromEntries(
  codes.map((code) => [
    code,
    {
      video: `/characters/motion/${code}-loop-8s-${code === "auditory-solo-flexible" ? "v2" : "v1"}.mp4`,
      poster: `/characters/motion/${code}-loop-8s-${code === "auditory-solo-flexible" ? "v2" : "v1"}.webp`,
    },
  ]),
);
