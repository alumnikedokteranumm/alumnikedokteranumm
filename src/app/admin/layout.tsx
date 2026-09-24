import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ambilSesi } from "@/lib/sesi";
import { NavAdmin } from "./nav";

export const metadata: Metadata = { title: { default: "Panel Admin", template: "%s · Admin Alumni Kedokteran UMM" }, robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function TataLetakAdmin({ children }: { children: React.ReactNode }) {
  const { profil } = await ambilSesi();
  if (!profil || !["admin", "pengurus"].includes(profil.peran)) redirect("/");

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="grid gap-8 lg:grid-cols-[220px_1fr]">
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
            Panel {profil.peran === "admin" ? "Admin" : "Pengurus"}
          </p>
          <NavAdmin admin={profil.peran === "admin"} />
        </aside>
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
