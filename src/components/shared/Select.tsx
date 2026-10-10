import { useEffect, useId, useRef, useState } from "react";
import type { KeyboardEvent } from "react";

/**
 * Outlined floating-label Select (single choice).
 *
 * Same visual language as FloatingLabelInput: the label sits ON the top border
 * with a gap exactly as wide as the label, and one color variable (--c) drives
 * both the border and the label.
 *
 * The field IS the search box — focus it and type to filter, with no separate
 * search bar inside the dropdown. Full keyboard support: ↑ ↓ Enter Esc.
 *
 * Tailwind CSS v4
 *   @import "tailwindcss";
 *   @custom-variant dark (&:where(.dark, .dark *));
 */

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps {
  /** Text shown as the floating label */
  label: string;
  options: SelectOption[];
  /** Controlled value */
  value?: string | null;
  /** Uncontrolled initial value */
  defaultValue?: string | null;
  onChange?: (value: string | null) => void;
  /** Error message; turns the field red and is announced to screen readers */
  error?: string;
  /** Helper text shown under the field (hidden while an error is shown) */
  hint?: string;
  required?: boolean;
  disabled?: boolean;
  /** Text shown inside the field while searching. Default: "Search…" */
  placeholder?: string;
  /** Shown when the search matches nothing. Default: "No results found." */
  emptyMessage?: string;
  /** Renders a hidden input so the value is submitted with a form */
  name?: string;
  id?: string;
  /** Extra classes for the field itself */
  className?: string;
  /** Extra classes for the outer wrapper */
  wrapperClassName?: string;
}

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

/**
 * One color drives both the border and the label, derived from the surrounding
 * text color so it follows light / dark on its own. Edit here to re-theme.
 */
const COLOR_IDLE =
  "[--c:color-mix(in_oklab,currentColor_42%,transparent)] " +
  "not-focus-within:hover:[--c:color-mix(in_oklab,currentColor_65%,transparent)] " +
  "focus-within:[--c:var(--color-indigo-500)]";
const COLOR_ERROR = "[--c:var(--color-red-500)]";

const FLOAT_TEXT = "text-[11px] leading-4 font-medium";
const EDGE = "[border-color:var(--c)] transition-[border-color] duration-200";

const iconProps = {
  width: 16,
  height: 16,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

const ChevronDown = ({ className }: { className?: string }) => (
  <svg {...iconProps} className={className}>
    <path d="m6 9 6 6 6-6" />
  </svg>
);

const CheckIcon = () => (
  <svg {...iconProps} width={15} height={15}>
    <path d="m20 6-11 11-5-5" />
  </svg>
);

export default function Select({
  label,
  options,
  value: valueProp,
  defaultValue = null,
  onChange,
  error,
  hint,
  required,
  disabled,
  placeholder = "Search…",
  emptyMessage = "No results found.",
  name,
  id,
  className,
  wrapperClassName,
}: SelectProps) {
  const autoId = useId();
  const selectId = id ?? autoId;
  const listId = `${selectId}-listbox`;
  const descriptionId = `${selectId}-description`;

  const [internalValue, setInternalValue] = useState<string | null>(defaultValue);
  const isControlled = valueProp !== undefined;
  const value = isControlled ? valueProp : internalValue;

  const [open, setOpen] = useState(false);
  const [focused, setFocused] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);

  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const hasError = Boolean(error);
  const hasDescription = Boolean(error || hint);
  const selected = options.find((o) => o.value === value) ?? null;
  const floating = focused || open || Boolean(value);

  // The field doubles as the search box: while open it shows what you type,
  // otherwise it shows the selected label.
  const inputValue = open ? query : (selected?.label ?? "");

  const filtered = query
    ? options.filter((o) => o.label.toLowerCase().includes(query.toLowerCase()))
    : options;

  const labelText = (
    <>
      {label}
      {required && <span aria-hidden="true"> *</span>}
    </>
  );

  /* ---- close on outside click ---- */
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  const openMenu = () => {
    if (disabled || open) return;
    setQuery("");
    setActiveIndex(Math.max(0, options.findIndex((o) => o.value === value)));
    setOpen(true);
  };

  const select = (opt: SelectOption) => {
    if (opt.disabled) return;
    if (!isControlled) setInternalValue(opt.value);
    onChange?.(opt.value);
    setQuery("");
    setOpen(false);
    inputRef.current?.blur();
  };

  const handleInput = (v: string) => {
    if (!open) setOpen(true);
    setQuery(v);
    setActiveIndex(0);
  };

  const moveActive = (delta: number) => {
    if (filtered.length === 0) return;
    setActiveIndex((prev) => {
      let next = prev;
      for (let i = 0; i < filtered.length; i++) {
        next = (next + delta + filtered.length) % filtered.length;
        if (!filtered[next].disabled) break;
      }
      return next;
    });
  };

  const onKeyDown = (e: KeyboardEvent) => {
    if (disabled) return;
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        if (!open) openMenu();
        else moveActive(1);
        break;
      case "ArrowUp":
        e.preventDefault();
        if (!open) openMenu();
        else moveActive(-1);
        break;
      case "Enter":
        e.preventDefault();
        if (!open) openMenu();
        else if (filtered[activeIndex]) select(filtered[activeIndex]);
        break;
      case "Escape":
        if (open) {
          e.preventDefault();
          setOpen(false);
          setQuery("");
        }
        break;
      case "Tab":
        setOpen(false);
        break;
    }
  };

  return (
    <div className={wrapperClassName}>
      <div
        ref={wrapperRef}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        className={cn(
          "relative text-gray-900 dark:text-white",
          hasError ? COLOR_ERROR : COLOR_IDLE,
        )}
      >
        {/* Hidden input so the value participates in forms */}
        {name && <input type="hidden" name={name} value={value ?? ""} />}

        {/* The field is the combobox AND the search box */}
        <input
          ref={inputRef}
          id={selectId}
          type="text"
          disabled={disabled}
          role="combobox"
          autoComplete="off"
          aria-expanded={open}
          aria-haspopup="listbox"
          aria-autocomplete="list"
          aria-controls={open ? listId : undefined}
          aria-invalid={hasError ? true : undefined}
          aria-describedby={hasDescription ? descriptionId : undefined}
          aria-activedescendant={
            open && filtered[activeIndex] ? `${listId}-${activeIndex}` : undefined
          }
          value={inputValue}
          placeholder={open ? placeholder : undefined}
          onFocus={openMenu}
          onChange={(e) => handleInput(e.target.value)}
          onKeyDown={onKeyDown}
          className={cn(
            "peer block h-10 w-full rounded-lg bg-transparent pe-9 ps-3.5 text-sm",
            "text-inherit caret-indigo-500",
            "border-0! shadow-none! ring-0! outline-hidden!",
            "focus:border-0! focus:shadow-none! focus:ring-0!",
            "disabled:cursor-not-allowed disabled:opacity-60",
            "autofill:[transition-delay:9999s]",
            "placeholder:text-gray-400 dark:placeholder:text-gray-500",
            className,
          )}
        />

        {/* Chevron (decorative, non-focusable) */}
        <span className="pointer-events-none absolute inset-y-0 end-3 flex items-center text-gray-400 dark:text-gray-500">
          <ChevronDown
            className={cn(
              "transition-transform duration-200",
              open && "rotate-180",
              disabled && "opacity-60",
            )}
          />
        </span>

        {/* Outline, drawn in pieces so the label never has a line behind it */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 peer-disabled:opacity-60"
        >
          <div className="absolute inset-x-0 top-0 flex h-3">
            <div className={cn("w-2 shrink-0 rounded-tl-lg border-t border-l", EDGE)} />
            <div
              className={cn(
                "shrink-0 overflow-hidden transition-[max-width] duration-200 ease-out",
                floating ? "max-w-full" : "max-w-0",
              )}
            >
              <span className={cn("invisible block px-1.5 whitespace-nowrap", FLOAT_TEXT)}>
                {labelText}
              </span>
            </div>
            <div className={cn("min-w-0 flex-1 rounded-tr-lg border-t border-r", EDGE)} />
          </div>
          <div
            className={cn(
              "absolute inset-x-0 top-3 bottom-0 rounded-b-lg border-x border-b",
              EDGE,
            )}
          />
        </div>

        {/* Floating label */}
        <label
          htmlFor={selectId}
          className={cn(
            "pointer-events-none absolute z-10 -translate-y-1/2 whitespace-nowrap [color:var(--c)]",
            "transition-all duration-200 ease-out peer-disabled:opacity-60",
            floating
              ? cn("start-[8px] top-0 px-1.5", FLOAT_TEXT)
              : "start-3.5 top-1/2 px-0 text-sm leading-5 font-normal",
          )}
        >
          {labelText}
        </label>

        {/* Dropdown: options only, no search bar */}
        {open && (
          <ul
            id={listId}
            role="listbox"
            aria-label={label}
            className="absolute inset-x-0 top-full z-20 mt-1 max-h-60 overflow-auto rounded-lg border border-gray-200 bg-white py-1 shadow-lg [scrollbar-color:var(--color-gray-300)_transparent] [scrollbar-width:thin] dark:border-gray-700 dark:bg-gray-800 dark:[scrollbar-color:var(--color-gray-600)_transparent]"
          >
            {filtered.length === 0 && (
              <li className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
                {emptyMessage}
              </li>
            )}

            {filtered.map((opt, i) => {
              const isSelected = opt.value === value;
              const isActive = i === activeIndex;
              return (
                <li
                  key={opt.value}
                  id={`${listId}-${i}`}
                  role="option"
                  aria-selected={isSelected}
                  aria-disabled={opt.disabled}
                  onMouseDown={(e) => e.preventDefault()}
                  onMouseEnter={() => setActiveIndex(i)}
                  onClick={() => select(opt)}
                  className={cn(
                    "mx-1 flex cursor-pointer items-center justify-between gap-2 rounded-md px-2.5 py-2 text-sm",
                    opt.disabled
                      ? "cursor-not-allowed text-gray-400 dark:text-gray-600"
                      : isActive
                        ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-200"
                        : "text-gray-700 dark:text-gray-200",
                  )}
                >
                  <span className="truncate">{opt.label}</span>
                  {isSelected && (
                    <span className="shrink-0 text-indigo-600 dark:text-indigo-400">
                      <CheckIcon />
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {hasDescription && (
        <p
          id={descriptionId}
          role={hasError ? "alert" : undefined}
          className={cn("mt-1.5 ps-1 text-xs", hasError ? "text-red-500" : "opacity-65")}
        >
          {error ?? hint}
        </p>
      )}
    </div>
  );
}

/* ---------------------------------------------------------------
 * Usage
 * ---------------------------------------------------------------
 *
 * const [role, setRole] = useState<string | null>(null);
 *
 * <Select
 *   label="Role"
 *   value={role}
 *   onChange={setRole}
 *   options={[
 *     { value: "admin", label: "Administrator" },
 *     { value: "editor", label: "Editor" },
 *   ]}
 *   wrapperClassName="max-w-md"
 * />
 *
 * <Select label="Country" options={countries} error="Country is required." required />
 */
