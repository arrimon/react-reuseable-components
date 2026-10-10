import { useEffect, useId, useRef } from "react";
import type { ReactNode } from "react";
import { createPortal } from "react-dom";

/**
 * Drawer — a slide-in panel rendered in a portal.
 *
 * - `side` can be "right" (default), "left" or "bottom".
 * - Closes on Escape / backdrop click (toggle with `closeOnBackdrop`).
 * - Locks body scroll and moves focus into the panel while open.
 * - Keeps the `isOpen` / `onClose` / `title` / `width` API it always had.
 *
 * Tailwind CSS v4
 *   @import "tailwindcss";
 *   @custom-variant dark (&:where(.dark, .dark *));
 */

export interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title?: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  side?: "right" | "left" | "bottom";
  /** Max width on the horizontal sides (Tailwind class). Default: "max-w-md" */
  width?: string;
  /** Close when the backdrop is clicked. Default: true */
  closeOnBackdrop?: boolean;
  className?: string;
  onApply?: () => void;
  onClear?: () => void;
}

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

const SIDE_PANEL = {
  right: "inset-y-0 end-0 h-full w-full rounded-s-2xl",
  left: "inset-y-0 start-0 h-full w-full rounded-e-2xl",
  bottom: "inset-x-0 bottom-0 max-h-[85vh] w-full rounded-t-2xl",
} as const;

const SIDE_CLOSED = {
  right: "translate-x-full",
  left: "-translate-x-full",
  bottom: "translate-y-full",
} as const;

export default function Drawer({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  side = "right",
  width = "max-w-md",
  closeOnBackdrop = true,
  className,
  onApply,
  onClear,
}: DrawerProps) {
  const titleId = useId();
  const descId = useId();
  const panelRef = useRef<HTMLDivElement>(null);

  /* ---- Escape to close ---- */
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  /* ---- Lock body scroll while open ---- */
  useEffect(() => {
    if (!isOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [isOpen]);

  /* ---- Move focus into the panel when it opens ---- */
  useEffect(() => {
    if (isOpen) panelRef.current?.focus();
  }, [isOpen]);

  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      className={cn("fixed inset-0 z-50", isOpen ? "pointer-events-auto" : "pointer-events-none")}
      aria-hidden={!isOpen}
      inert={!isOpen}
    >
      {/* Backdrop */}
      <div
        onClick={() => closeOnBackdrop && onClose()}
        aria-hidden="true"
        className={cn(
          "absolute inset-0 bg-black/40 transition-opacity duration-300",
          isOpen ? "opacity-100" : "opacity-0",
        )}
      />

      {/* Panel */}
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        aria-describedby={description ? descId : undefined}
        tabIndex={-1}
        className={cn(
          "absolute flex flex-col overflow-hidden bg-white shadow-2xl outline-hidden",
          "transition-transform duration-300 ease-in-out",
          "dark:bg-gray-900",
          SIDE_PANEL[side],
          side !== "bottom" && cn("border-gray-200 dark:border-gray-700", width),
          side === "right" && "border-l",
          side === "left" && "border-r",
          side === "bottom" && "border-t border-gray-200 dark:border-gray-700",
          isOpen ? "translate-x-0 translate-y-0" : SIDE_CLOSED[side],
          className,
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-4 border-b border-slate-200 bg-slate-50 px-6 py-4 dark:border-gray-700 dark:bg-gray-800/60">
          <div className="min-w-0">
            {title && (
              <h2
                id={titleId}
                className="text-[15px] leading-6 font-bold text-slate-900 dark:text-white"
              >
                {title}
              </h2>
            )}
            {description && (
              <p id={descId} className="mt-0.5 text-sm text-slate-500 dark:text-gray-400">
                {description}
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close drawer"
            className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-200/70 hover:text-slate-900 focus-visible:ring-2 focus-visible:ring-blue-500/40 focus-visible:outline-hidden dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white"
          >
            <svg
              className="size-[18px]"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto bg-white px-8 py-6 [scrollbar-color:var(--color-gray-300)_transparent] [scrollbar-width:thin] dark:bg-gray-900 dark:[scrollbar-color:var(--color-gray-600)_transparent]">
          {children}
          
          {/* Clear Filters option positioned nicely inside content or footer */}
          {onClear && (
            <div className="mt-6 flex justify-center">
              <button
                type="button"
                onClick={onClear}
                className="text-sm font-semibold text-red-500 transition-colors hover:text-red-600 dark:text-red-400"
              >
                Clear Filters
              </button>
            </div>
          )}
        </div>

        {/* Footer with exact "Apply Filters" button design */}
        {(footer || onApply) && (
          <div className="border-t border-slate-200 bg-white px-6 py-4 dark:border-gray-700 dark:bg-gray-900">
            {footer || (
              <button
                type="button"
                onClick={onApply}
                className="w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
              >
                Apply Filters
              </button>
            )}
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}