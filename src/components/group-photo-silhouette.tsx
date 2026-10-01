import Image from "next/image";
import { STUDY_TYPES, type Modality } from "@/lib/content";
import { characterThumbnail } from "@/lib/characters";

export function GroupPhotoSilhouette({ modality }: { modality?: Modality }) {
  const members = STUDY_TYPES.filter(
    (type) => !modality || type.modality === modality,
  );
  return (
    <div
      className={`group-photo-silhouette ${modality ? "is-family" : "is-full"}`}
      aria-hidden="true"
    >
      {members.map((type) => (
        <div key={type.code}>
          <Image
            src={characterThumbnail(type.code)}
            alt=""
            width={80}
            height={80}
            unoptimized
          />
          <span>?</span>
        </div>
      ))}
    </div>
  );
}
