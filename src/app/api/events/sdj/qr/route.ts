import QRCode from "qrcode";
import { siteUrl } from "@/lib/site";
import { SDJ_EVENT } from "@/lib/sdj-event";

export async function GET() {
  const png = await QRCode.toBuffer(`${siteUrl()}${SDJ_EVENT.path}?from=qr`, {
    width: 1200,
    margin: 4,
    errorCorrectionLevel: "M",
    color: { dark: "#163f35", light: "#ffffff" },
  });
  return new Response(new Uint8Array(png), {
    headers: {
      "Content-Type": "image/png",
      "Content-Disposition": 'inline; filename="sdj-event-qr.png"',
      "Cache-Control": "public, max-age=3600",
    },
  });
}
