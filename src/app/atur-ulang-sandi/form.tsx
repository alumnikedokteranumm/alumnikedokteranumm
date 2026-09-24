"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { IsianSandi } from "@/components/isian-sandi";
import { aksiGantiSandi } from "@/actions/autentikasi";
import { Bidang, Pesan, Tombol } from "@/components/ui/dasar";

function TombolKirim() {
  const { pending } = useFormStatus();
  return <Tombol type="submit" disabled={pending} className="w-full py-3">{pending ? "Menyimpan…" : "Simpan Kata Sandi"}</Tombol>;
}

export function FormGantiSandi() {
  const [hasil, aksi] = useActionState(aksiGantiSandi, null);
  return (
    <form action={aksi} className="mt-7 space-y-4">
      {hasil?.galat && <Pesan jenis="galat">{hasil.galat}</Pesan>}
      <Bidang label="Kata sandi baru" petunjuk="Minimal 8 karakter." wajib>
        <IsianSandi name="sandi" required minLength={8} autoComplete="new-password" />
      </Bidang>
      <Bidang label="Ulangi kata sandi baru" wajib>
        <IsianSandi name="ulangi" required minLength={8} autoComplete="new-password" />
      </Bidang>
      <TombolKirim />
    </form>
  );
}
