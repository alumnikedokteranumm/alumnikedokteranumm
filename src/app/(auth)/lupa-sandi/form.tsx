"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { aksiLupaSandi } from "@/actions/autentikasi";
import { Bidang, Isian, Pesan, Tombol } from "@/components/ui/dasar";

function TombolKirim() {
  const { pending } = useFormStatus();
  return <Tombol type="submit" disabled={pending} className="w-full py-3">{pending ? "Mengirim…" : "Kirim Tautan"}</Tombol>;
}

export function FormLupaSandi() {
  const [hasil, aksi] = useActionState(aksiLupaSandi, null);

  if (hasil?.sukses) return <div className="mt-7"><Pesan jenis="sukses" judul="Tautan dikirim">{hasil.sukses}</Pesan></div>;

  return (
    <form action={aksi} className="mt-7 space-y-4">
      {hasil?.galat && <Pesan jenis="galat">{hasil.galat}</Pesan>}
      <Bidang label="Email" wajib>
        <Isian name="email" type="email" required autoComplete="email" placeholder="nama@contoh.com" />
      </Bidang>
      <TombolKirim />
    </form>
  );
}
