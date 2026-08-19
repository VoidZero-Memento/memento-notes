import { useEffect, useRef, useState } from "react";

import { useGalleryGate } from "@/lib/gallery/use-gallery-gate";

import styles from "./GalleryGateField.module.css";

import type { KeyboardEvent } from "react";

type GalleryGateFieldProps = {
  autoFocus?: boolean;
  variant: "inline" | "page";
  onUnlocked?: () => void;
  onCancel?: () => void;
};

export const GalleryGateField = ({ autoFocus, variant, onUnlocked, onCancel }: GalleryGateFieldProps) => {
  const { unlock } = useGalleryGate();
  const inputRef = useRef<HTMLInputElement>(null);
  const busyRef = useRef(false);
  const shakeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState(false);
  const [denied, setDenied] = useState(false);

  useEffect(() => {
    return () => {
      if (shakeTimerRef.current) clearTimeout(shakeTimerRef.current);
    };
  }, []);

  const submit = async () => {
    if (busyRef.current) return;
    const raw = value.trim();
    if (!raw) return;
    busyRef.current = true;
    setBusy(true);
    setDenied(false);
    const ok = await unlock(raw);
    if (ok) {
      onUnlocked?.();
      return;
    }
    busyRef.current = false;
    setValue("");
    setDenied(true);
    setBusy(false);
    inputRef.current?.focus();
    if (shakeTimerRef.current) clearTimeout(shakeTimerRef.current);
    shakeTimerRef.current = setTimeout(() => setDenied(false), 520);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== "Escape" || !onCancel) return;
    event.preventDefault();
    event.stopPropagation();
    onCancel();
  };

  const className = [
    styles.field,
    variant === "inline" ? styles.inline : styles.page,
    denied ? styles.denied : "",
    busy ? styles.busy : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <form
      className={className}
      onClick={(event) => event.stopPropagation()}
      onSubmit={(event) => {
        event.preventDefault();
        void submit();
      }}
    >
      <input
        ref={inputRef}
        className={styles.input}
        type="password"
        name="gallery-gate"
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck={false}
        autoFocus={autoFocus}
        disabled={busy}
        placeholder="密钥"
        aria-label="画廊密钥"
        aria-invalid={denied}
        value={value}
        onChange={(event) => setValue(event.target.value)}
        onKeyDown={handleKeyDown}
      />
      {variant === "page" ? (
        <p className={styles.hint} aria-live="polite">
          {denied ? "不对" : "回车进入"}
        </p>
      ) : null}
    </form>
  );
};
