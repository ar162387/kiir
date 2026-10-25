"use client";

import Image from "next/image";

/** Thumbnail tile with a graceful fallback when an item has no image — a
 * flat tint tile labeled "no thumbnail", exactly as the mockup specifies,
 * rather than a broken image or a generic stock photo.
 *
 * `widthClass` defaults to full-width (top-of-card layout). Pass a fixed
 * width (e.g. "w-38 sm:w-50") for the horizontal feed-row layout, where the
 * mockup pins the thumbnail to a fixed column instead of stretching it.
 *
 * `zoom` applies a subtle scale-up on hover, driven by a `group` class on
 * the ancestor link/card — the frame stays fixed (overflow-hidden) while the
 * image inside grows, the standard editorial hover treatment.
 */
export default function Thumb({
  src,
  alt,
  heightClass = "h-33",
  widthClass = "w-full",
  fallbackLabel = "no thumbnail · fallback tile",
  sizes = "(min-width: 1024px) 25vw, 50vw",
  zoom = true,
}: {
  src: string | null;
  alt: string;
  heightClass?: string;
  widthClass?: string;
  fallbackLabel?: string;
  sizes?: string;
  zoom?: boolean;
}) {
  if (!src) {
    return (
      <div
        className={`flex flex-none items-end border-b border-line bg-thumb p-2.5 shadow-[inset_0_0_0_1px_rgba(16,36,59,0.03)] ${widthClass} ${heightClass}`}
      >
        <span className="font-mono text-[9.5px] uppercase tracking-[0.08em] text-muted-2">{fallbackLabel}</span>
      </div>
    );
  }
  return (
    <div className={`relative flex-none overflow-hidden bg-thumb ${widthClass} ${heightClass}`}>
      <Image
        unoptimized={src.startsWith("https://res.cloudinary.com/")}
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        className={`object-cover ${zoom ? "transition-transform duration-300 ease-out group-hover:scale-110" : ""}`}
      />
    </div>
  );
}
