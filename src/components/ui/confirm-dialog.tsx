"use client";
import { useCallback, useEffect, useRef, useState } from "react";
type Options = {
  title: string;
  description: string;
  confirmLabel: string;
  tone?: "danger";
  eyebrow?: string;
  note?: string;
};
export function useConfirm() {
  const [options, setOptions] = useState<Options | null>(null);
  const resolve = useRef<((yes: boolean) => void) | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const open = useCallback(
    (value: Options) =>
      new Promise<boolean>((done) => {
        resolve.current = done;
        setOptions(value);
      }),
    [],
  );
  const close = (yes: boolean) => {
    dialog.current?.close();
    resolve.current?.(yes);
    resolve.current = null;
    setOptions(null);
  };
  useEffect(() => {
    if (options) dialog.current?.showModal();
  }, [options]);
  useEffect(() => () => resolve.current?.(false), []);
  return [
    open,
    <dialog
      ref={dialog}
      key="confirmation"
      className="confirm-dialog"
      onCancel={(event) => {
        event.preventDefault();
        close(false);
      }}
      aria-labelledby="confirm-title"
    >
      {options && (
        <>
          <p className="eyebrow">{options.eyebrow ?? "잠깐 확인해 주세요"}</p>
          <h2 id="confirm-title">{options.title}</h2>
          <p>{options.description}</p>
          {options.note && <p className="muted small">{options.note}</p>}
          <div className="button-row">
            <button
              autoFocus
              className="button secondary"
              onClick={() => close(false)}
            >
              취소
            </button>
            <button
              className={`button ${options.tone === "danger" ? "danger" : ""}`}
              onClick={() => close(true)}
            >
              {options.confirmLabel}
            </button>
          </div>
        </>
      )}
    </dialog>,
  ] as const;
}
