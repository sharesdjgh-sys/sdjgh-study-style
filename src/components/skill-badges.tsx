import Image from "next/image";
import { CHARACTERS, characterThumbnail } from "@/lib/characters";
import { FAMILIES } from "@/lib/content";
import { methodModality, type MethodId } from "@/lib/methods";
import { Icon } from "./icon";

export function SkillModality({ id }: { id: MethodId }) {
  const modality = methodModality(id);
  return (
    <span
      className="skill-modality"
      data-modality={modality}
      title={`${FAMILIES[modality].verb} 해 보는 공부법`}
    >
      <Icon name={FAMILIES[modality].icon} size={16} />
      {FAMILIES[modality].label}
    </span>
  );
}

/** Generated enamel frame + the original mascot portrait keep all 16 identities intact. */
export function SignatureBadge({
  code,
  imageSizes,
  label,
}: {
  code: string;
  imageSizes?: string;
  label?: string;
}) {
  const name = CHARACTERS[code].name;
  return (
    <span
      className="signature-badge"
      data-character={code}
      role="img"
      aria-label={label ?? `${name} 시그니처 배지 · 획득`}
      title={label ?? `${name} 시그니처 배지 · 획득`}
    >
      <span className="signature-badge-portrait">
        <Image
          className="signature-badge-face"
          src={characterThumbnail(code)}
          alt=""
          width={192}
          height={192}
          sizes={imageSizes ?? "96px"}
        />
      </span>
      <Image
        className="signature-badge-frame"
        src="/skills/signature-badge-frame.webp"
        alt=""
        width={192}
        height={192}
        sizes={imageSizes ?? "64px"}
      />
    </span>
  );
}
