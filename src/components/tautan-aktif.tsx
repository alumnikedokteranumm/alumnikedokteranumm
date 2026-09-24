"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

export function TautanAktif({
  href, children, sorot,
}: { href: string; children: ReactNode; sorot?: boolean }) {
  const jalur = usePathname();
  const aktif = href === "/" ? jalur === "/" : jalur.startsWith(href);

  return (
    <Link
      href={href}
      aria-current={aktif ? "page" : undefined}
      className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
        aktif
          ? "bg-merek-50 text-merek-800"
          : sorot
            ? "text-merek-700 hover:bg-merek-50"
            : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
      }`}
    >
      {children}
    </Link>
  );
}
