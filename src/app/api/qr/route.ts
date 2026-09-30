import QRCode from "qrcode";
import { siteUrl } from "@/lib/site";
export async function GET() {
  const png = await QRCode.toBuffer(`${siteUrl()}/?from=qr`, {
    width: 600,
    margin: 3,
    color: { dark: "#292a26", light: "#fffefa" },
  });
  return new Response(new Uint8Array(png), {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
