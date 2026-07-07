import type { SVGProps } from "react";

// Small inline icon set (previously pulled from nextra/icons).
// All icons inherit `currentColor` and size via props.

type IconProps = SVGProps<SVGSVGElement>;

const base = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

/** Stand-in artwork for devices without an image. Deliberately carries no
    width/height defaults — callers size it entirely via CSS. */
export function PhoneSymbol(props: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.1}
      strokeLinecap="round"
      aria-hidden="true"
      {...props}
    >
      <rect x="6.75" y="2.75" width="10.5" height="18.5" rx="2.6" />
      <line x1="10.6" y1="18.7" x2="13.4" y2="18.7" />
    </svg>
  );
}

export function CopyIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" width="1em" height="1em" {...base} {...props}>
      <rect x="9" y="9" width="11" height="11" rx="2.5" />
      <path d="M5 15H4.5A1.5 1.5 0 0 1 3 13.5v-9A1.5 1.5 0 0 1 4.5 3h9A1.5 1.5 0 0 1 15 4.5V5" />
    </svg>
  );
}

export function CheckIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" width="1em" height="1em" {...base} strokeWidth={2} {...props}>
      <path d="M4.5 12.5 10 18 19.5 6.5" />
    </svg>
  );
}

export function LinkArrowIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" width="1em" height="1em" {...base} {...props}>
      <path d="M7 17 17 7M9 7h8v8" />
    </svg>
  );
}

export function SearchIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" width="1em" height="1em" {...base} {...props}>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.6-3.6" />
    </svg>
  );
}

export function SunIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" width="1em" height="1em" {...base} {...props}>
      <circle cx="12" cy="12" r="4.5" />
      <path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5 5l1.6 1.6M17.4 17.4 19 19M19 5l-1.6 1.6M6.6 17.4 5 19" />
    </svg>
  );
}

export function MoonIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" width="1em" height="1em" {...base} {...props}>
      <path d="M20.5 14.5A8.5 8.5 0 0 1 9.5 3.5a8.5 8.5 0 1 0 11 11Z" />
    </svg>
  );
}

export function MoonFilledIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" width="1em" height="1em" {...props}>
      <path
        d="M20.5 14.5A8.5 8.5 0 0 1 9.5 3.5a8.5 8.5 0 1 0 11 11Z"
        fill="currentColor"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function CircleHalfIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" width="1em" height="1em" {...base} {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 3.5a8.5 8.5 0 0 1 0 17Z" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function ChevronRightIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" width="1em" height="1em" {...base} {...props}>
      <path d="m9 5 7 7-7 7" />
    </svg>
  );
}

export function PersonIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" width="1em" height="1em" {...base} {...props}>
      <circle cx="12" cy="8" r="3.75" />
      <path d="M5 20c.8-3.5 3.6-5.25 7-5.25s6.2 1.75 7 5.25" />
    </svg>
  );
}

export function InfoIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" width="1em" height="1em" {...base} {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8h.01M11 12h1v5h1" />
    </svg>
  );
}
