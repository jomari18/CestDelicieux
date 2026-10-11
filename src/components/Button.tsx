import type { ButtonHTMLAttributes } from "react";
export function Button({
  className = "",
  busy,
  children,
  variant,
  fullWidth,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  busy?: boolean;
  variant?: "outline" | "ghost";
  fullWidth?: boolean;
}) {
  return (
    <button
      {...props}
      className={["button", className, variant, fullWidth ? "full-width" : ""]
        .filter(Boolean)
        .join(" ")}
      disabled={props.disabled || busy}
      aria-busy={busy}
    >
      {busy ? (
        <>
          <span className="spinner" /> Working…
        </>
      ) : (
        children
      )}
    </button>
  );
}
