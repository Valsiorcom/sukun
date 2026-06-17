# MITAN

Platform perkenalan untuk Muslim yang serius menikah. Stack: TanStack Start (React 19 + SSR) di atas Lovable Cloud (Supabase).

---

## Menjalankan secara lokal

```bash
npm install
cp .env.example .env   # isi nilainya
npm run dev
```

Aplikasi tersedia di `http://localhost:8080` (atau port yang ditampilkan Vite).

---

## Deployment ke Spaceship Starlight Hyperlift

Proyek ini sudah punya `Dockerfile` multi-stage yang membangun aplikasi
sebagai **Node SSR server** (bukan static site). Server functions, SSR
loader, dan endpoint `/api/public/*` semuanya tetap aktif di container.

### Prasyarat
1. Repository GitHub berisi kode ini (push lewat tombol GitHub di Lovable).
2. Akun Spaceship dengan akses Starlight Hyperlift.
3. Project Supabase / Lovable Cloud yang sudah berjalan (URL + keys).

### Langkah deploy
1. Login ke Spaceship → buka **Starlight Hyperlift Manager**.
2. **Create New Application** → pilih repository GitHub MITAN.
3. Di halaman konfigurasi:
   - **Build method**: Dockerfile (otomatis terdeteksi).
   - **Port**: `3000`.
   - **Environment Variables**: salin semua variabel dari `.env.example`
     dan isi nilainya. **Wajib**: `VITE_SUPABASE_URL`,
     `VITE_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_URL`,
     `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SERVICE_ROLE_KEY`.
4. Klik **Deploy**. Hyperlift akan menjalankan `npm ci` → `npm run build`
   (dengan `BUILD_TARGET=node`) → start container `node .output/server/index.mjs`.
5. Setelah build hijau, aplikasi live di URL yang diberikan Hyperlift.

### Custom domain
Atur DNS sesuai instruksi Hyperlift Manager, lalu tambahkan domain di
Application Settings → Domains.

### Catatan teknis
- **Container** adalah Node 20 Alpine; tidak ada Nginx, tidak ada static fallback.
  TanStack Router menangani routing di server saat SSR dan di browser setelah hydrate,
  jadi refresh deep link bekerja tanpa konfigurasi rewrite tambahan.
- **Database** tetap di Supabase / Lovable Cloud. Container hanya host frontend + SSR.
- **`SUPABASE_SERVICE_ROLE_KEY`** wajib di-set di Hyperlift. Tanpa ini,
  fitur admin (mis. hapus akun) akan gagal saat dipanggil.
- File `.output/` dihasilkan saat build di dalam container — jangan
  di-commit ke git.

---

## Struktur penting

```
src/
  routes/        — TanStack Router file-based routing
  components/    — UI components (shadcn/ui + custom)
  lib/           — utilities + server functions (*.functions.ts)
  integrations/  — Supabase client (browser, server, middleware)
  locales/       — i18n (id, en)
Dockerfile       — multi-stage build untuk Hyperlift / Node host
.env.example     — daftar env var yang dibutuhkan
```

---

## Tech stack

- React 19 + TanStack Start (SSR + server functions)
- Vite 7 + Tailwind v4
- Supabase (Auth, Postgres, RLS, Storage)
- shadcn/ui + Radix
- i18next (Bahasa Indonesia default)
