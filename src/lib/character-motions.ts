export type CharacterMotionAsset = {
  video: string;
  poster: string;
  background?: string;
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

// Median top/bottom edge RGB sampled across eight frames of each video.
// Encoded video colors vary slightly between pixels and frames.
const backgrounds: Record<(typeof codes)[number], string> = {
  "visual-solo-planned": "#dde6d6",
  "visual-solo-flexible": "#dfe8d4",
  "visual-team-planned": "#dde7d4",
  "visual-team-flexible": "#dee8d4",
  "auditory-solo-planned": "#f2e1cb",
  "auditory-solo-flexible": "#f2e1cd",
  "auditory-team-planned": "#f2e1cd",
  "auditory-team-flexible": "#f2e1cd",
  "tactile-solo-planned": "#e7e1ec",
  "tactile-solo-flexible": "#e7e1ee",
  "tactile-team-planned": "#e7e1ee",
  "tactile-team-flexible": "#e7e1ec",
  "motion-solo-planned": "#d8e9e8",
  "motion-solo-flexible": "#e0e0da",
  "motion-team-planned": "#d8e8e9",
  "motion-team-flexible": "#d7e8e7",
};

export const CHARACTER_MOTIONS: Readonly<
  Partial<Record<string, CharacterMotionAsset>>
> = Object.fromEntries(
  codes.map((code) => [
    code,
    {
      background: backgrounds[code],
      video: `/characters/motion/${code}-loop-8s-${code === "auditory-solo-flexible" ? "v2" : "v1"}.mp4`,
      poster: `/characters/motion/${code}-loop-8s-${code === "auditory-solo-flexible" ? "v2" : "v1"}.webp`,
    },
  ]),
);
