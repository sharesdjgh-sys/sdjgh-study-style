"use client";
import Image from "next/image";
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
    <Image
      className={className}
      src={
        locked
          ? `/skills/lock-${skillPrice(id)}.webp`
          : `/study-methods/${id}.webp`
      }
      alt=""
      width={size}
      height={size}
      sizes={sizes}
      loading={loading}
    />
  );
}
