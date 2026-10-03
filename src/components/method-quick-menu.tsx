"use client";
import { useEffect, useState } from "react";
import { CATEGORIES, type MethodCategory } from "@/lib/methods";
import { MethodIcon } from "./method-icon";

const CATEGORIES_IN_ORDER = Object.keys(CATEGORIES) as MethodCategory[];

export function MethodQuickMenu() {
  const [active, setActive] = useState<MethodCategory>("concept");

  useEffect(() => {
    let frame = 0;
    function update() {
      frame = 0;
      let current: MethodCategory = "concept";
      for (const category of CATEGORIES_IN_ORDER) {
        const heading = document.getElementById(`catalog-${category}`);
        if (
          heading &&
          heading.getBoundingClientRect().top <= innerHeight * 0.3
        ) {
          current = category;
        }
      }
      setActive(current);
    }
    function scheduleUpdate() {
      if (!frame) frame = requestAnimationFrame(update);
    }
    scheduleUpdate();
    window.addEventListener("scroll", scheduleUpdate, { passive: true });
    window.addEventListener("resize", scheduleUpdate);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", scheduleUpdate);
      window.removeEventListener("resize", scheduleUpdate);
    };
  }, []);

  return (
    <nav
      className="quick-menu method-quick-menu"
      aria-label="공부법 분류 빠른 메뉴"
    >
      {CATEGORIES_IN_ORDER.map((category) => (
        <a
          key={category}
          href={`#catalog-${category}`}
          aria-current={active === category ? "location" : undefined}
        >
          <MethodIcon id={category} size={36} loading="eager" />
          <span>{CATEGORIES[category].label}</span>
        </a>
      ))}
    </nav>
  );
}
