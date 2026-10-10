import { forwardRef, useId } from "react";
import type { InputHTMLAttributes, ReactNode } from "react";

/**
 * Outlined floating-label input.
 *
 * - The label sits ON the top border with no background. The outline is drawn
 *   in three pieces (left cap · gap · right piece) and the gap is exactly as
 *   wide as the label, so no border line ever runs behind the text.
 * - Border and label share ONE color variable (--c), so they always match:
 *     idle → gray · hover → darker gray · focus → indigo · error → red
 *
 * Tailwind CSS v4
 *   @import "tailwindcss";
 *
 * Light / dark: nothing to configure. Colors come from the surrounding text
 * color, so the field follows whatever theme switch your app already uses
 * (class, data-attribute, OS setting...). Just make sure your page sets a text
 * color for each theme, as it normally does.
 */

export interface FloatingLabelInputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "placeholder" | "prefix"> {
  /** Text shown as the floating label */
  label: string;
  /** Error message; turns the field red and is announced to screen readers */
  error?: string;
  /** Helper text shown under the field (hidden while an error is shown) */
  hint?: string;
  /** Small prefix inside the field, e.g. a currency symbol like "৳" or "$" */
  startAdornment?: ReactNode;
  /** Extra classes for the outer wrapper */
  wrapperClassName?: string;
}

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

/**
 * One color drives both the border and the label. It is derived from the
 * surrounding TEXT color (currentColor), so it adapts to light and dark on its
 * own, with no `dark:` variant and no dependence on how your app switches theme.
 * Edit the percentages / indigo shade here to re-theme.
 */
const COLOR_IDLE =
  "[--c:color-mix(in_oklab,currentColor_42%,transparent)] " +
  "not-focus-within:hover:[--c:color-mix(in_oklab,currentColor_65%,transparent)] " +
  "focus-within:[--c:var(--color-indigo-500)]";
const COLOR_ERROR = "[--c:var(--color-red-500)]";

/** Floated label typography. Shared by the label and its invisible gap-sizer. */
const FLOAT_TEXT = "text-[11px] leading-4 font-medium";

const EDGE = "[border-color:var(--c)] transition-[border-color] duration-200";

const FloatingLabelInput = forwardRef<HTMLInputElement, FloatingLabelInputProps>(
  (
    {
      label,
      error,
      hint,
      id,
      type = "text",
      required,
      startAdornment,
      className,
      wrapperClassName,
      ...props
    },
    ref,
  ) => {
    const autoId = useId();
    const inputId = id ?? autoId;
    const descriptionId = `${inputId}-description`;
    const hasDescription = Boolean(error || hint);
    const hasError = Boolean(error);

    const labelText = (
      <>
        {label}
        {required && <span aria-hidden="true"> *</span>}
      </>
    );

    return (
      <div className={wrapperClassName}>
        <div
          className={cn(
            "relative text-gray-900 dark:text-white",
            hasError ? COLOR_ERROR : COLOR_IDLE,
          )}
        >
          {/* 1) The real input. Its own border is replaced by the outline below. */}
          <input
            ref={ref}
            id={inputId}
            type={type}
            required={required}
            // A single space keeps :placeholder-shown working without showing text.
            placeholder=" "
            aria-invalid={hasError ? true : undefined}
            aria-describedby={hasDescription ? descriptionId : undefined}
            className={cn(
              "peer block h-10 w-full rounded-lg pe-3.5 text-sm",
              // Input text uses the full text color of the page: always the strongest
              // element, clearly sharper than the label and border.
              "text-inherit caret-indigo-500",
              // Hard reset (!important) so global form styles (e.g. @tailwindcss/forms,
              // Flowbite) can never add their own border, ring or shadow to the input.
              "border-0! bg-transparent! shadow-none! ring-0! outline-hidden!",
              "focus:border-0! focus:shadow-none! focus:ring-0!",
              "disabled:cursor-not-allowed disabled:opacity-60",
              // stop browsers painting a blue/yellow autofill background
              "autofill:[transition-delay:9999s]",
              startAdornment ? "ps-9" : "ps-3.5",
              className,
            )}
            {...props}
          />

          {/* 2) Outline, drawn in pieces so the label never has a line behind it */}
          <div
            aria-hidden="true"
            className={cn(
              "pointer-events-none absolute inset-0 peer-disabled:opacity-60",
              // Gap open (filled / focused) vs closed (empty and resting)
              "[--notch-max:100%] peer-placeholder-shown:[--notch-max:0px] peer-focus:[--notch-max:100%]",
            )}
          >
            {/* Top row: left cap + label-sized gap + right piece */}
            <div className="absolute inset-x-0 top-0 flex h-3">
              <div className={cn("w-2 shrink-0 rounded-tl-lg border-t border-l", EDGE)} />
              <div className="max-w-(--notch-max) shrink-0 overflow-hidden transition-[max-width] duration-200 ease-out">
                {/* Invisible copy of the label: gives the gap exactly the label's width */}
                <span
                  className={cn("invisible block px-1.5 whitespace-nowrap", FLOAT_TEXT)}
                >
                  {labelText}
                </span>
              </div>
              <div className={cn("min-w-0 flex-1 rounded-tr-lg border-t border-r", EDGE)} />
            </div>

            {/* Sides + bottom */}
            <div
              className={cn(
                "absolute inset-x-0 top-3 bottom-0 rounded-b-lg border-x border-b",
                EDGE,
              )}
            />
          </div>

          {/* 3) Optional prefix */}
          {startAdornment && (
            <span className="pointer-events-none absolute inset-y-0 start-3.5 flex items-center text-sm opacity-60">
              {startAdornment}
            </span>
          )}

          {/* 4) Floating label: transparent, same color as the border */}
          <label
            htmlFor={inputId}
            className={cn(
              "pointer-events-none absolute z-10 whitespace-nowrap [color:var(--c)]",
              "transition-all duration-200 ease-out peer-disabled:opacity-60",
              // Floated: smaller, centred in the gap (text starts at 14px, same as resting)
              "start-[8px] top-0 -translate-y-1/2 px-1.5",
              FLOAT_TEXT,
              // Resting: centred inside the field
              startAdornment
                ? "peer-placeholder-shown:start-9"
                : "peer-placeholder-shown:start-3.5",
              "peer-placeholder-shown:top-1/2 peer-placeholder-shown:px-0 peer-placeholder-shown:text-sm peer-placeholder-shown:leading-5 peer-placeholder-shown:font-normal",
              // Focused: floated again
              "peer-focus:start-[8px] peer-focus:top-0 peer-focus:px-1.5 peer-focus:text-[11px] peer-focus:leading-4 peer-focus:font-medium",
            )}
          >
            {labelText}
          </label>
        </div>

        {hasDescription && (
          <p
            id={descriptionId}
            role={hasError ? "alert" : undefined}
            className={cn(
              "mt-1.5 ps-1 text-xs",
              hasError ? "text-red-500" : "opacity-65",
            )}
          >
            {error ?? hint}
          </p>
        )}
      </div>
    );
  },
);

FloatingLabelInput.displayName = "FloatingLabelInput";

export default FloatingLabelInput;

/* ---------------------------------------------------------------
 * Usage
 * ---------------------------------------------------------------
 *
 * <FloatingLabelInput label="Full Name" name="name" wrapperClassName="max-w-md" />
 *
 * <FloatingLabelInput
 *   label="Revenue Target"
 *   type="number"
 *   required
 *   startAdornment="৳"
 *   value={target}
 *   onChange={(e) => setTarget(e.target.value)}
 * />
 *
 * <FloatingLabelInput label="Email" type="email" hint="We'll never share your email." />
 */