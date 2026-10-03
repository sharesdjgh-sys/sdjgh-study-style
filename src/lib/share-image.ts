export const SHARE_IMAGE_WIDTH = 1200;
export const SHARE_IMAGE_HEIGHT = 630;

// Change the URL when the artwork changes so image caches fetch the new card.
export function shareImagePath(typeCode?: string) {
  const params = new URLSearchParams({ v: "6" });
  if (typeCode) params.set("type", typeCode);
  return `/api/og?${params}`;
}
