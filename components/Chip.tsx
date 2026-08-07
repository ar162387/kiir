"use client";

export default function Chip({
  active,
  onClick,
  children,
  isUr,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  isUr?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`cursor-pointer border px-3.5 py-2 font-mono text-[10.5px] uppercase tracking-[0.08em] transition-colors duration-150 ${
        isUr ? "font-urdu normal-case tracking-normal" : ""
      } ${active ? "border-navy bg-navy text-canvas" : "border-line bg-transparent text-slate hover:border-navy/40"}`}
    >
      {children}
    </button>
  );
}
