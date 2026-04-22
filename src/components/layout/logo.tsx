import Link from "next/link";
import { cn } from "@/lib/utils";

type Tone = "light" | "dark";

export function BrandMark({
  size = 32,
  tone = "dark",
}: {
  size?: number;
  tone?: Tone;
}) {
  const bg = tone === "light" ? "#FFFFFF" : "#1E40AF";
  const ball = "#D4ED4C";
  const line = tone === "light" ? "#1E40AF" : "#FFFFFF";
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 56 56"
      fill="none"
      aria-hidden="true"
      className="shrink-0"
    >
      <rect width="56" height="56" rx="14" fill={bg} />
      <circle cx="28" cy="28" r="13" fill={ball} />
      <path
        d="M17 22 C22 32, 34 24, 39 34"
        stroke={line}
        strokeWidth="1.4"
        fill="none"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function Wordmark({
  className,
  colon = "primary",
}: {
  className?: string;
  colon?: "primary" | "accent" | "inherit";
}) {
  const colonColor =
    colon === "accent"
      ? "var(--accent)"
      : colon === "inherit"
        ? "currentColor"
        : "var(--primary)";
  return (
    <span className={cn("font-display leading-none", className)}>
      HRAJ<span style={{ color: colonColor }}>:</span>PADEL
    </span>
  );
}

export function BrandLockup({
  href = "/",
  size = 32,
  className,
  tone = "dark",
}: {
  href?: string;
  size?: number;
  className?: string;
  tone?: Tone;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "group inline-flex items-center gap-2.5 font-display leading-none tracking-wide",
        className,
      )}
    >
      <BrandMark size={size} tone={tone} />
      <Wordmark className="text-2xl" />
    </Link>
  );
}
