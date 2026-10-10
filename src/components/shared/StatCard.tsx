import type { FC, ReactNode } from "react";

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

export type StatTone = "blue" | "green" | "yellow" | "red";

export interface StatBadge {
  label: string;
  value: number | string;
}

export interface StatCardProps {
  title: string;
  count: number | string;
  icon: ReactNode;
  tone?: StatTone;
  badges?: StatBadge[];
  /** Force a theme. Leave undefined to follow the `dark` class on a parent. */
  theme?: "light" | "dark";
  className?: string;
}

/* ------------------------------------------------------------------ */
/* Tone styles (Tailwind classes, light + dark variants)               */
/* ------------------------------------------------------------------ */

const toneStyles: Record<StatTone, { iconWrap: string; iconColor: string }> = {
  blue: {
    iconWrap: "bg-blue-100 dark:bg-blue-500/20",
    iconColor: "text-blue-500 dark:text-blue-400",
  },
  green: {
    iconWrap: "bg-emerald-100 dark:bg-emerald-500/20",
    iconColor: "text-emerald-500 dark:text-emerald-400",
  },
  yellow: {
    iconWrap: "bg-yellow-100 dark:bg-yellow-500/20",
    iconColor: "text-yellow-500 dark:text-yellow-400",
  },
  red: {
    iconWrap: "bg-red-100 dark:bg-red-500/20",
    iconColor: "text-red-500 dark:text-red-400",
  },
};

/* ------------------------------------------------------------------ */
/* StatCard                                                            */
/* ------------------------------------------------------------------ */

export const StatCard: FC<StatCardProps> = ({
  title,
  count,
  icon,
  tone = "blue",
  badges = [],
  theme,
  className = "",
}) => {
  const t = toneStyles[tone];
  const themeClass = theme === "dark" ? "dark" : "";

  return (
    <div className={`h-full ${themeClass}`}>
      <div
        className={`flex h-full flex-col rounded-xl border border-sky-200 bg-white p-3 shadow-sm
        dark:border-slate-700 dark:bg-slate-800 ${className}`}
      >
        {/* Header: icon + title */}
        <div className="flex items-center gap-2">
          <span className={`shrink-0 ${t.iconColor}`}>{icon}</span>
          <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
            {title}
          </span>
        </div>

        {/* Count — centered inside the card */}
        <div className="my-2 text-center text-2xl font-extrabold text-slate-800 dark:text-white">
          {count}
        </div>

        {/* Chips — left aligned */}
        {badges.length > 0 && (
          <div className="mt-auto flex flex-nowrap items-center justify-start gap-1 overflow-x-auto">
            {badges.map((b) => (
              <span
                key={b.label}
                className="shrink-0 rounded-full border border-sky-200 bg-sky-50 px-1.5 py-px text-[9px] leading-4 font-medium whitespace-nowrap text-slate-500
                dark:border-slate-600 dark:bg-slate-700 dark:text-slate-300"
              >
                {b.label}:{" "}
                <b className="font-bold text-slate-900 dark:text-white">
                  {b.value}
                </b>
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default StatCard;

/* ------------------------------------------------------------------ */
/* Inline icons (no extra dependency)                                  */
/* ------------------------------------------------------------------ */

const svgProps = {
  width: 16,
  height: 16,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export const UsersIcon = () => (
  <svg {...svgProps}>
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

export const UserCheckIcon = () => (
  <svg {...svgProps}>
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <polyline points="16 11 18 13 22 9" />
  </svg>
);

export const ClockIcon = () => (
  <svg {...svgProps}>
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

export const LogOutIcon = () => (
  <svg {...svgProps}>
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </svg>
);
