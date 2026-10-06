"use client";
import Image from "next/image";
import type { CSSProperties } from "react";
import { isMethodId } from "@/lib/methods";
import { skillPrice } from "@/lib/skill-economy";
import { useSkills } from "./skill-provider";
import type { MethodCategory, MethodId } from "@/lib/methods";

/** Adjacent labels name the method; the illustration is decorative. */
export function MethodIcon({
  id,
  size,
  sizes = `${size}px`,
  className,
  loading = "lazy",
}: {
  id: MethodId | MethodCategory;
  size: number;
  sizes?: string;
  className?: string;
  loading?: "eager" | "lazy";
}) {
  const { progress } = useSkills();
  const locked = isMethodId(id) && !progress.unlocked.includes(id);
  return (
    <span
      className={`method-icon-frame ${className ?? ""}`}
      data-locked={locked}
      style={{ "--method-size": `${size}px` } as CSSProperties}
    >
      <Image
        className="method-original-icon"
        src={`/study-methods/${id}.webp`}
        alt=""
        width={size}
        height={size}
        sizes={sizes}
        loading={loading}
      />
      {locked && (
        <Image
          className="method-mini-lock"
          src={`/skills/lock-${skillPrice(id)}.webp`}
          width={40}
          height={48}
          alt=""
        />
      )}
    </span>
  );
}
