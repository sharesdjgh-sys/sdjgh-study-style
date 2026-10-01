"use client";
import { useEffect, useState } from "react";
import { readSession, readFirstSession, type Session } from "@/lib/storage";

export function useSavedSession() {
  const [state, setState] = useState<{
    session: Session | null;
    first: Session | null;
    loaded: boolean;
  }>({
    session: null,
    first: null,
    loaded: false,
  });
  useEffect(() => {
    const id = requestAnimationFrame(() => {
      setState({
        session: readSession(),
        first: readFirstSession(),
        loaded: true,
      });
    });
    return () => cancelAnimationFrame(id);
  }, []);
  return state;
}
