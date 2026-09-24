"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { aksiGantiSandi } from "@/actions/autentikasi";
import { Bidang, Isian, Pesan, Tombol } from "@/components/ui/dasar";

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
        <Isian name="sandi" type="password" required minLength={8} autoComplete="new-password" />
      </Bidang>
      <Bidang label="Ulangi kata sandi baru" wajib>
        <Isian name="ulangi" type="password" required minLength={8} autoComplete="new-password" />
      </Bidang>
      <TombolKirim />
    </form>
  );
}
