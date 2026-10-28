import type { HTMLAttributes } from "react";

export interface TimerDisplayProps extends HTMLAttributes<HTMLTimeElement> {
  elapsedMs: number;
}

export function formatTimer(elapsedMs: number): string {
  if (!Number.isFinite(elapsedMs)) {
    throw new RangeError("elapsedMs must be a finite number");
  }

  const centiseconds = Math.floor(Math.max(0, elapsedMs) / 10);
  const hours = Math.floor(centiseconds / 360_000);
  const minutes = Math.floor(centiseconds / 6_000) % 60;
  const seconds = Math.floor(centiseconds / 100) % 60;
  const hundredths = centiseconds % 100;
  const twoDigits = (value: number) => value.toString().padStart(2, "0");

  if (hours > 0) {
    return `${twoDigits(hours)}:${twoDigits(minutes)}:${twoDigits(seconds)}.${twoDigits(hundredths)}`;
  }

  return `${twoDigits(Math.floor(centiseconds / 6_000))}:${twoDigits(seconds)}.${twoDigits(hundredths)}`;
}

export function TimerDisplay({ elapsedMs, className, ...props }: TimerDisplayProps) {
  const time = formatTimer(elapsedMs);

  return (
    <time
      {...props}
      className={["deckgala-timer", className].filter(Boolean).join(" ")}
      role="timer"
      aria-label={props["aria-label"] ?? `Elapsed time ${time}`}
    >
      {time}
    </time>
  );
}
