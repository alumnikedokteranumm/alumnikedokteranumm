"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { IsianSandi } from "@/components/isian-sandi";
import { aksiMasuk } from "@/actions/autentikasi";
import { Bidang, Isian, Pesan, Tombol } from "@/components/ui/dasar";

function TombolKirim() {
  const { pending } = useFormStatus();
  return <Tombol type="submit" disabled={pending} className="w-full py-3">{pending ? "Memproses…" : "Masuk"}</Tombol>;
}

export function FormMasuk({ lanjut }: { lanjut: string }) {
  const [hasil, aksi] = useActionState(aksiMasuk, null);

  return (
    <form action={aksi} className="mt-7 space-y-4">
      <input type="hidden" name="lanjut" value={lanjut} />
      {hasil?.galat && <Pesan jenis="galat">{hasil.galat}</Pesan>}

      <Bidang label="Email" wajib>
        <Isian name="email" type="email" autoComplete="email" required placeholder="nama@contoh.com" />
      </Bidang>

      <Bidang label="Kata sandi" wajib>
        <IsianSandi name="sandi" autoComplete="current-password" required placeholder="••••••••" />
      </Bidang>

      <div className="flex justify-end">
        <Link href="/lupa-sandi" className="text-sm text-merek-700 hover:underline">Lupa kata sandi?</Link>
      </div>

      <TombolKirim />
    </form>
  );
}
