// Mengunduh seluruh berkas dari semua bucket Supabase Storage ke folder lokal.
// Dipakai oleh .github/workflows/backup.yml. Butuh SUPABASE_DB_URL (untuk menebak
// alamat proyek) dan SUPABASE_SECRET_KEY (kunci rahasia / service_role).
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";

const tujuan = process.argv[2] ?? "berkas";
const kunci = process.env.SUPABASE_SECRET_KEY ?? "";
const db = new URL(process.env.SUPABASE_DB_URL ?? "");

// Session pooler: user "postgres.<ref>" · koneksi langsung: host "db.<ref>.supabase.co"
const ref = db.username.split(".")[1] ?? db.hostname.match(/^db\.([a-z0-9]+)\.supabase\.co$/)?.[1];
if (!ref) throw new Error("Tidak bisa membaca ID proyek dari SUPABASE_DB_URL");
const dasar = `https://${ref}.supabase.co/storage/v1`;

// Kunci lama (JWT) dikirim sebagai Bearer; kunci baru "sb_secret_…" cukup di header apikey.
const kepala = { apikey: kunci, ...(kunci.startsWith("eyJ") ? { Authorization: `Bearer ${kunci}` } : {}) };

async function minta(url, init = {}) {
  const r = await fetch(url, { ...init, headers: { ...kepala, ...init.headers } });
  if (!r.ok) throw new Error(`${r.status} ${r.statusText} — ${url}: ${await r.text()}`);
  return r;
}

async function daftar(bucket, awalan) {
  const hasil = [];
  for (let offset = 0; ; offset += 1000) {
    const r = await minta(`${dasar}/object/list/${bucket}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prefix: awalan, limit: 1000, offset, sortBy: { column: "name", order: "asc" } }),
    });
    const isi = await r.json();
    for (const item of isi) {
      const jalur = awalan ? `${awalan}/${item.name}` : item.name;
      if (item.id === null) hasil.push(...(await daftar(bucket, jalur)));   // folder
      else hasil.push(jalur);
    }
    if (isi.length < 1000) return hasil;
  }
}

const buckets = await (await minta(`${dasar}/bucket`)).json();
let total = 0;
let gagal = 0;
for (const { id } of buckets) {
  const berkas = await daftar(id, "");
  for (const jalur of berkas) {
    try {
      const r = await minta(`${dasar}/object/${id}/${jalur.split("/").map(encodeURIComponent).join("/")}`);
      const file = join(tujuan, id, jalur);
      await mkdir(dirname(file), { recursive: true });
      await writeFile(file, Buffer.from(await r.arrayBuffer()));
      total++;
    } catch (e) {
      gagal++;
      console.log(`::warning::Gagal mengunduh ${id}/${jalur}: ${e.message}`);
    }
  }
  console.log(`Bucket "${id}": ${berkas.length} berkas`);
}
console.log(`Selesai: ${total} berkas tersalin, ${gagal} gagal.`);
if (gagal && !total) process.exit(1);
