import { useEffect, useRef, type ReactNode } from "react";
import { Button } from "./Button";
import { Icon } from "./Icon";
export function Dialog({
  open,
  title,
  onClose,
  children,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const element = ref.current,
      previous = document.activeElement as HTMLElement | null;
    if (open && !element?.open) element?.showModal();
    if (!open && element?.open) element.close();
    return () => {
      if (element?.open) {
        element.close();
        if (previous?.isConnected) previous.focus();
        else {
          const heading = document.querySelector<HTMLElement>("main h1");
          heading?.setAttribute("tabindex", "-1");
          heading?.focus();
        }
      }
    };
  }, [open]);
  return (
    <dialog
      ref={ref}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      aria-label={title}
      className="dialog"
    >
      <div className="dialog-heading">
        <h2>{title}</h2>
        <Button
          className="icon-button ghost"
          aria-label="Close dialog"
          onClick={onClose}
        >
          <Icon name="close" />
        </Button>
      </div>
      {children}
    </dialog>
  );
}
