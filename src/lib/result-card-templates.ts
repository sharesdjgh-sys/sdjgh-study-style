import { CHARACTERS } from "./characters";

const INKS: Record<string, string> = {
  "visual-solo-planned": "#153725",
  "visual-solo-flexible": "#234b36",
  "visual-team-planned": "#153f3b",
  "visual-team-flexible": "#21534a",
  "auditory-solo-planned": "#93451f",
  "auditory-solo-flexible": "#853447",
  "auditory-team-planned": "#214757",
  "auditory-team-flexible": "#21543d",
  "tactile-solo-planned": "#694526",
  "tactile-solo-flexible": "#513367",
  "tactile-team-planned": "#244f69",
  "tactile-team-flexible": "#26594f",
  "motion-solo-planned": "#204d68",
  "motion-solo-flexible": "#254b35",
  "motion-team-planned": "#204866",
  "motion-team-flexible": "#254c35",
};

/** Finished artwork. Source masters and prompts live in art/result-cards/. */
export function resultCardTemplate(code: string) {
  if (!CHARACTERS[code] || !INKS[code])
    throw new Error("알 수 없는 공부캐예요.");
  return { src: `/result-cards/${code}-fixed-v2.webp`, ink: INKS[code] };
}
