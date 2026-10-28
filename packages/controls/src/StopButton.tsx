import type { ButtonHTMLAttributes, ReactNode } from "react";

export interface StopButtonProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children" | "type"> {
  children?: ReactNode;
}

export function StopButton({
  children = "Stop timer",
  className,
  ...props
}: StopButtonProps) {
  return (
    <button
      {...props}
      type="button"
      className={["deckgala-stop-button", className].filter(Boolean).join(" ")}
    >
      {children}
    </button>
  );
}
