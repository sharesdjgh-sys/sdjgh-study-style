"use client";
import { useEffect, useState } from "react";
import { readSession, type Session } from "@/lib/storage";

export function useSavedSession() {
  const [state, setState] = useState<{
    session: Session | null;
    loaded: boolean;
  }>({
    session: null,
    loaded: false,
  });
  useEffect(() => {
    const id = requestAnimationFrame(() => {
      setState({ session: readSession(), loaded: true });
    });
    return () => cancelAnimationFrame(id);
  }, []);
  return state;
}
