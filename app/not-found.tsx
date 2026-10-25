import Link from "@/components/AppLink";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-[640px] flex-col items-start px-4 py-24 sm:px-6">
      <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-teal">404</span>
      <h1 className="mt-3 font-serif text-[clamp(30px,4vw,44px)] leading-[1.1] tracking-[-0.02em] text-navy">
        Page not found
      </h1>
      <p className="mt-3 max-w-[50ch] text-[15px] leading-relaxed text-slate" dir="rtl" lang="ur">
        یہ صفحہ دستیاب نہیں ہے۔
      </p>
      <p className="mt-1 max-w-[50ch] text-[15px] leading-relaxed text-slate">
        The page you&apos;re looking for doesn&apos;t exist or may have been moved.
      </p>
      <Link
        href="/"
        className="mt-7 bg-navy px-5 py-3 font-mono text-[11px] uppercase tracking-[0.14em] text-canvas transition-colors duration-150 hover:bg-cyan hover:text-navy"
      >
        Back to homepage
      </Link>
    </div>
  );
}
