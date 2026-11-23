export function formatSdjPrizeNumber(number: number) {
  return `SDJGH-${String(number).padStart(2, "0")}`;
}
