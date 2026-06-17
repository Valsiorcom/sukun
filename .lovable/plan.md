## Tujuan
Siapkan proyek MITAN agar bisa di-deploy ke Spaceship Starlight Hyperlift sebagai **container Node.js SSR** (bukan static Nginx), karena proyek ini TanStack Start dengan server functions + SSR — bukan Vite SPA.

## File yang akan dibuat / diubah

### 1. `Dockerfile` (baru, di root)
Multi-stage build untuk Node SSR worker:
- Stage 1 (`node:20-alpine`): `bun install` → `bun run build` (menghasilkan `.output/` Nitro bundle untuk preset Node).
- Stage 2 (`node:20-alpine`): copy `.output/`, expose `3000`, `CMD ["node", ".output/server/index.mjs"]`.
- Tidak pakai Nginx. SSR + server functions + `/api/public/*` semua tetap jalan.

### 2. `vite.config.ts` (ubah)
Tambahkan opsi build preset Node agar `bun run build` menghasilkan output Node-compatible (bukan Cloudflare Worker):
```ts
export default defineConfig({
  tanstackStart: { server: { entry: "server" } },
  nitro: { preset: "node-server" },
});
```
Catatan: proyek saat ini target Cloudflare Worker. Setelah perubahan ini, deploy ke Lovable Cloud TIDAK akan terpengaruh selama publish flow Lovable masih membaca config-nya sendiri — tapi ini perlu diverifikasi. **Risiko**: kalau publish Lovable juga ikut pakai preset `node-server`, deploy ke Lovable Cloud bisa rusak. Mitigasi: pakai env var `BUILD_TARGET=node` untuk switch preset secara kondisional.

### 3. `.env.example` (baru)
Hanya variabel yang benar-benar dipakai sekarang:
```
# Supabase (publik — aman di-bundle ke client)
VITE_SUPABASE_URL=
VITE_SUPABASE_PUBLISHABLE_KEY=
VITE_SUPABASE_PROJECT_ID=

# Supabase (server-only — JANGAN beri prefix VITE_)
SUPABASE_URL=
SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Lovable AI Gateway (opsional, kalau pakai)
LOVABLE_API_KEY=
```
Twilio/Resend/Stripe **tidak dimasukkan** karena belum terintegrasi (sesuai jawaban Anda). Tambahkan nanti saat fitur dibangun, tanpa prefix `VITE_`.

### 4. `README.md` (ubah/buat)
Panduan deploy ke Hyperlift:
- Prasyarat: GitHub repo terhubung.
- Set env vars di Hyperlift sesuai `.env.example`.
- Hyperlift baca `Dockerfile`, container listen di port 3000.
- Catatan SSR (bukan static), database via Lovable Cloud Supabase.

### 5. `.gitignore` (verifikasi)
Pastikan minimal: `node_modules/`, `.output/`, `dist/`, `.env`, `.env.local`, `.DS_Store`. (Saat ini kemungkinan sudah ada — hanya tambah `.output/` jika belum.)

### 6. `package.json` (verifikasi, kemungkinan tidak diubah)
Script `dev`/`build`/`preview` standar TanStack Start sudah ada. Tidak diubah kecuali perlu.

### 7. Verifikasi rebrand SUKUN → MITAN
Jalankan `rg -i "sukun"` untuk pastikan tidak ada sisa string di kode frontend. Berdasarkan ringkasan sebelumnya ini sudah selesai, tapi akan saya cek ulang dan perbaiki kalau ada yang tertinggal.

### 8. Validasi build
Jalankan `bun run build` (Lovable pakai bun, bukan npm) untuk memastikan output Node terbentuk tanpa error.

## Yang TIDAK akan dilakukan (penting)
- **Tidak** ganti React Router / pakai `BrowserRouter` — proyek pakai TanStack Router file-based, sudah benar untuk SPA-style navigation + SSR.
- **Tidak** hardcode secret di kode atau di `.env.example`.
- **Tidak** push ke GitHub (itu langkah manual Anda lewat tombol GitHub di Lovable; Lovable tidak punya tool untuk push otomatis ke external GitHub).
- **Tidak** buat `hyperlift.json` — Hyperlift baca `Dockerfile` saja.
- **Tidak** ubah skema database, tabel, atau komentar sejarah rebranding.

## Catatan penting yang harus Anda tahu
1. **Database tetap di Lovable Cloud (Supabase).** Container Hyperlift hanya host frontend + SSR. Semua data, auth, storage tetap di Lovable Cloud — Hyperlift terhubung via env vars `VITE_SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY`. Anda perlu **copy `SUPABASE_SERVICE_ROLE_KEY` dari Lovable Cloud** (tidak otomatis tersedia di Hyperlift).
2. **Lovable Cloud tidak expose service role key ke user** secara default. Anda perlu memintanya lewat dukungan / Project Settings, atau menggantinya dengan flow yang tidak butuh admin client. Beri tahu saya kalau ini jadi blocker.
3. **GitHub push** harus Anda lakukan manual lewat tombol GitHub di Lovable (Plus menu → GitHub → Connect). Saya tidak bisa berikan URL repo.
4. **`bun run build` di Lovable sandbox** akan saya jalankan untuk verifikasi. Kalau preset `node-server` butuh dependency tambahan (mis. `nitropack` preset), akan saya install.
