import { useEffect, useId, useRef, useState } from "react";
import type { KeyboardEvent } from "react";

/**
 * Outlined floating-label MultiSelect.
 *
 * Same visual language as FloatingLabelInput: the label sits ON the top border
 * with a gap exactly as wide as the label, and one color variable (--c) drives
 * both the border and the label.
 *
 * Selected values render as removable chips inside the field (with a "+N more"
 * chip when they overflow and a live count in the dropdown footer). The field IS
 * the search box — type to filter, no separate search bar in the dropdown, and
 * no checkboxes: selected rows are shown with a check mark.
 *
 * Tailwind CSS v4
 *   @import "tailwindcss";
 *   @custom-variant dark (&:where(.dark, .dark *));
 */

export interface MultiSelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface MultiSelectProps {
  /** Text shown as the floating label */
  label: string;
  options: MultiSelectOption[];
  /** Controlled values */
  value?: string[];
  /** Uncontrolled initial values */
  defaultValue?: string[];
  onChange?: (values: string[]) => void;
  /** Error message; turns the field red and is announced to screen readers */
  error?: string;
  /** Helper text shown under the field (hidden while an error is shown) */
  hint?: string;
  required?: boolean;
  disabled?: boolean;
  /** How many chips to show before collapsing into "+N more". Default: 3 */
  maxVisibleChips?: number;
  /** Text shown inside the field while searching. Default: "Search…" */
  placeholder?: string;
  /** Shown when the search matches nothing. Default: "No results found." */
  emptyMessage?: string;
  /** Renders a hidden input (comma-joined) so the value submits with a form */
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

const XIcon = () => (
  <svg {...iconProps} width={12} height={12}>
    <path d="M18 6 6 18M6 6l12 12" />
  </svg>
);

export default function MultiSelect({
  label,
  options,
  value: valueProp,
  defaultValue = [],
  onChange,
  error,
  hint,
  required,
  disabled,
  maxVisibleChips = 3,
  placeholder = "Search…",
  emptyMessage = "No results found.",
  name,
  id,
  className,
  wrapperClassName,
}: MultiSelectProps) {
  const autoId = useId();
  const selectId = id ?? autoId;
  const listId = `${selectId}-listbox`;
  const descriptionId = `${selectId}-description`;

  const [internalValues, setInternalValues] = useState<string[]>(defaultValue);
  const isControlled = valueProp !== undefined;
  const values = isControlled ? valueProp : internalValues;

  const [open, setOpen] = useState(false);
  const [focused, setFocused] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);

  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const hasError = Boolean(error);
  const hasDescription = Boolean(error || hint);
  const floating = focused || open || values.length > 0;

  const selected = values
    .map((v) => options.find((o) => o.value === v))
    .filter((o): o is MultiSelectOption => Boolean(o));

  const visibleChips = selected.slice(0, maxVisibleChips);
  const hiddenCount = selected.length - visibleChips.length;

  const filtered = query
    ? options.filter((o) => o.label.toLowerCase().includes(query.toLowerCase()))
    : options;

  const labelText = (
    <>
      {label}
      {required && <span aria-hidden="true"> *</span>}
    </>
  );

  const commit = (next: string[]) => {
    if (!isControlled) setInternalValues(next);
    onChange?.(next);
  };

  const toggle = (opt: MultiSelectOption) => {
    if (opt.disabled) return;
    commit(
      values.includes(opt.value)
        ? values.filter((v) => v !== opt.value)
        : [...values, opt.value],
    );
    setQuery("");
    setActiveIndex(0);
    inputRef.current?.focus();
  };

  const remove = (v: string) => commit(values.filter((x) => x !== v));

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
    setActiveIndex(0);
    setOpen(true);
  };

  const handleInput = (v: string) => {
    if (!open) setOpen(true);
    setQuery(v);
    setActiveIndex(0);
  };

  const focusInput = () => {
    if (disabled) return;
    inputRef.current?.focus();
    if (!open) openMenu();
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
        else if (filtered[activeIndex]) toggle(filtered[activeIndex]);
        break;
      case "Backspace":
        if (query === "" && values.length > 0) {
          remove(values[values.length - 1]);
        }
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
        {name && <input type="hidden" name={name} value={values.join(",")} />}

        {/* Trigger = the field itself; holds chips + the inline search input */}
        <div
          onClick={focusInput}
          className={cn(
            "peer flex min-h-10 w-full flex-wrap items-center gap-1.5 rounded-lg bg-transparent px-2.5 py-1.5 pe-9 text-start text-sm",
            disabled ? "cursor-not-allowed opacity-60" : "cursor-text",
            className,
          )}
        >
          {visibleChips.map((opt) => (
            <span
              key={opt.value}
              className="inline-flex max-w-full items-center gap-1 rounded-md bg-indigo-50 py-0.5 ps-2 pe-1 text-xs font-medium text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-200"
            >
              <span className="truncate">{opt.label}</span>
              {!disabled && (
                <button
                  type="button"
                  tabIndex={-1}
                  aria-label={`Remove ${opt.label}`}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    remove(opt.value);
                  }}
                  className="inline-flex size-4 items-center justify-center rounded-sm text-indigo-500 transition-colors hover:bg-indigo-200/60 hover:text-indigo-800 focus-visible:ring-2 focus-visible:ring-indigo-500/40 focus-visible:outline-hidden dark:text-indigo-300 dark:hover:bg-indigo-400/25 dark:hover:text-white"
                >
                  <XIcon />
                </button>
              )}
            </span>
          ))}

          {hiddenCount > 0 && (
            <span className="inline-flex items-center rounded-md bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600 dark:bg-gray-700 dark:text-gray-300">
              +{hiddenCount} more
            </span>
          )}

          {/* Inline search: the field itself is the combobox input */}
          <input
            ref={inputRef}
            id={selectId}
            role="combobox"
            autoComplete="off"
            disabled={disabled}
            aria-expanded={open}
            aria-haspopup="listbox"
            aria-autocomplete="list"
            aria-multiselectable="true"
            aria-controls={open ? listId : undefined}
            aria-invalid={hasError ? true : undefined}
            aria-describedby={hasDescription ? descriptionId : undefined}
            aria-activedescendant={
              open && filtered[activeIndex] ? `${listId}-${activeIndex}` : undefined
            }
            value={query}
            placeholder={open ? placeholder : undefined}
            onFocus={openMenu}
            onChange={(e) => handleInput(e.target.value)}
            onKeyDown={onKeyDown}
            className={cn(
              "min-w-16 flex-1 bg-transparent text-sm text-inherit caret-indigo-500",
              "border-0! shadow-none! ring-0! outline-hidden!",
              "focus:border-0! focus:shadow-none! focus:ring-0!",
              "placeholder:text-gray-400 dark:placeholder:text-gray-500",
            )}
          />
        </div>

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
          className={cn("pointer-events-none absolute inset-0", disabled && "opacity-60")}
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
            "transition-all duration-200 ease-out",
            disabled && "opacity-60",
            floating
              ? cn("start-[8px] top-0 px-1.5", FLOAT_TEXT)
              : "start-3.5 top-1/2 px-0 text-sm leading-5 font-normal",
          )}
        >
          {labelText}
        </label>

        {/* Dropdown: options only (no search bar, no checkboxes) */}
        {open && (
          <div className="absolute inset-x-0 top-full z-20 mt-1 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800">
            <ul
              id={listId}
              role="listbox"
              aria-multiselectable="true"
              aria-label={label}
              className="max-h-60 overflow-auto py-1 [scrollbar-color:var(--color-gray-300)_transparent] [scrollbar-width:thin] dark:[scrollbar-color:var(--color-gray-600)_transparent]"
            >
              {filtered.length === 0 && (
                <li className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
                  {emptyMessage}
                </li>
              )}

              {filtered.map((opt, i) => {
                const isSelected = values.includes(opt.value);
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
                    onClick={() => toggle(opt)}
                    className={cn(
                      "mx-1 flex cursor-pointer items-center justify-between gap-2 rounded-md px-2.5 py-2 text-sm",
                      opt.disabled
                        ? "cursor-not-allowed text-gray-400 dark:text-gray-600"
                        : isActive
                          ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-200"
                          : isSelected
                            ? "font-medium text-indigo-700 dark:text-indigo-300"
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

            {/* Footer: live count + clear all */}
            <div className="flex items-center justify-between gap-2 border-t border-gray-100 px-3 py-2 text-xs dark:border-gray-700/60">
              <span className="text-gray-500 dark:text-gray-400">
                <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                  {values.length}
                </span>{" "}
                selected
              </span>
              {values.length > 0 && (
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    commit([]);
                    inputRef.current?.focus();
                  }}
                  className="font-medium text-gray-500 transition-colors hover:text-red-600 focus-visible:ring-2 focus-visible:ring-indigo-500/40 focus-visible:outline-hidden dark:text-gray-400 dark:hover:text-red-400"
                >
                  Clear all
                </button>
              )}
            </div>
          </div>
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
 * const [tags, setTags] = useState<string[]>([]);
 *
 * <MultiSelect
 *   label="Tags"
 *   value={tags}
 *   onChange={setTags}
 *   maxVisibleChips={3}
 *   options={[
 *     { value: "react", label: "React" },
 *     { value: "vue", label: "Vue" },
 *   ]}
 *   wrapperClassName="max-w-md"
 * />
 *
 * <MultiSelect label="Countries" options={countries} required hint="Pick at least one." />
 */
