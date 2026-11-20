import { cn } from "@/lib/utils";

export function Logo({ className, iconOnly = false }: { className?: string; iconOnly?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <svg
        width="28"
        height="28"
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0"
        aria-hidden="true"
      >
        <rect width="32" height="32" rx="8" className="fill-primary" />
        <path
          d="M8 23V12.5C8 11.12 9.12 10 10.5 10H14.5C15.88 10 17 11.12 17 12.5V23"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M17 23V9.5C17 8.12 18.12 7 19.5 7H21.5C22.88 7 24 8.12 24 9.5V23"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path d="M6 23H26" stroke="white" strokeWidth="2" strokeLinecap="round" />
        <circle cx="12.5" cy="15" r="1" fill="white" />
        <circle cx="20.5" cy="13" r="1" fill="white" />
        <circle cx="20.5" cy="17" r="1" fill="white" />
      </svg>
      {!iconOnly && <span className="font-bold text-xl tracking-tight">Nibash</span>}
    </span>
  );
}
