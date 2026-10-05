"use client";
import { useEffect, useState } from "react";
import {
  readSession,
  readFirstSession,
  RECORDS_CLEARED,
  type Session,
} from "@/lib/storage";

export function useSavedSession(refreshKey?: string) {
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
    function refresh() {
      setState({
        session: readSession(),
        first: readFirstSession(),
        loaded: true,
      });
    }
    const id = requestAnimationFrame(refresh);
    window.addEventListener(RECORDS_CLEARED, refresh);
    window.addEventListener("storage", refresh);
    return () => {
      cancelAnimationFrame(id);
      window.removeEventListener(RECORDS_CLEARED, refresh);
      window.removeEventListener("storage", refresh);
    };
  }, [refreshKey]);
  return state;
}
