import { createFileRoute, Link } from "@tanstack/react-router";
import { ShieldCheck, Lock, Server, Trash2, Mail } from "lucide-react";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Kebijakan Privasi — MITAN" },
      {
        name: "description",
        content:
          "Kebijakan privasi MITAN: bagaimana kami mengelola data pribadi, proses KYC, dan menjaga keamanan informasi Anda.",
      },
      { property: "og:title", content: "Kebijakan Privasi — MITAN" },
      {
        property: "og:description",
        content:
          "Kebijakan privasi MITAN: bagaimana kami mengelola data pribadi, proses KYC, dan menjaga keamanan informasi Anda.",
      },
    ],
  }),
  component: PrivacyPage,
});

function SimpleNav() {
  return (
    <header className="fixed top-0 inset-x-0 z-50 bg-background/85 backdrop-blur-md border-b border-border/50">
      <div className="mx-auto max-w-6xl px-5 h-16 flex items-center justify-between">
        <Link
          to="/"
          className="font-display text-lg tracking-[0.18em] uppercase text-primary font-semibold"
        >
          Mitan
        </Link>
        <Link
          to="/"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          Kembali ke Beranda
        </Link>
      </div>
    </header>
  );
}

function Footer() {
  return (
    <footer className="bg-primary text-primary-foreground/65 py-10 px-5 border-t border-primary-foreground/10">
      <div className="mx-auto max-w-6xl flex flex-col items-center gap-5 text-center">
        <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm">
          <Link to="/privacy" className="hover:text-primary-foreground transition-colors">
            Kebijakan Privasi
          </Link>
          <span className="opacity-40">·</span>
          <Link to="/terms" className="hover:text-primary-foreground transition-colors">
            Syarat &amp; Ketentuan
          </Link>
          <span className="opacity-40">·</span>
          <Link to="/contact" className="hover:text-primary-foreground transition-colors">
            Hubungi Kami
          </Link>
        </nav>
        <p className="text-xs">
          © 2026 MITAN · Server Indonesia · Data tidak dibagikan ke pihak ketiga
        </p>
      </div>
    </footer>
  );
}

const sections = [
  {
    icon: ShieldCheck,
    title: "Data yang Kami Kumpulkan",
    body: (
      <>
        <p className="mb-3">
          Kami hanya mengumpulkan data yang diperlukan untuk verifikasi dan proses taaruf:
        </p>
        <ul className="list-disc pl-5 space-y-1.5">
          <li>Informasi akun: nama, alamat email, nomor telepon</li>
          <li>Data profil: usia, kota, pendidikan, pekerjaan, esai reflektif</li>
          <li>Dokumen KYC: foto KTP dan selfie untuk verifikasi identitas</li>
          <li>Foto profil yang Anda unggah (disimpan terenkripsi)</li>
          <li>Data percakapan antara anggota yang saling cocok</li>
        </ul>
      </>
    ),
  },
  {
    icon: Lock,
    title: "Proses KYC & Verifikasi Identitas",
    body: (
      <>
        <p className="mb-3">
          Setiap anggota melewati verifikasi identitas manual (Know Your Customer):
        </p>
        <ul className="list-disc pl-5 space-y-1.5">
          <li>Dokumen KTP dan selfie diperiksa oleh tim internal MITAN</li>
          <li>Verifikasi biasanya selesai dalam 1–2 hari kerja</li>
          <li>Dokumen KYC tidak dibagikan ke anggota lain atau pihak ketiga</li>
          <li>Data disimpan dengan enkripsi dan akses terbatas</li>
        </ul>
        <p className="mt-3">
          KYC bertujuan memastikan setiap profil adalah orang nyata, bukan akun palsu atau bot.
        </p>
      </>
    ),
  },
  {
    icon: Server,
    title: "Penyimpanan & Keamanan Data",
    body: (
      <>
        <p className="mb-3">
          Kami mengambil langkah teknis dan organisasional untuk melindungi data Anda:
        </p>
        <ul className="list-disc pl-5 space-y-1.5">
          <li>Server berlokasi di Indonesia — data tidak dikirim ke luar negeri</li>
          <li>Foto profil dienkripsi dan tidak dapat diakses publik</li>
          <li>Akses data internal dibatasi hanya untuk personel yang berwenang</li>
          <li>Komunikasi antara aplikasi dan server menggunakan enkripsi TLS</li>
        </ul>
      </>
    ),
  },
  {
    icon: Trash2,
    title: "Hak Anda atas Data",
    body: (
      <>
        <p className="mb-3">Anda memiliki kendali penuh atas data pribadi Anda:</p>
        <ul className="list-disc pl-5 space-y-1.5">
          <li>Melihat dan memperbarui profil kapan saja melalui pengaturan akun</li>
          <li>Menonaktifkan profil sementara tanpa menghapus akun</li>
          <li>Menghapus akun dan seluruh data secara permanen kapan saja</li>
          <li>Penghapusan akun berlaku segera dan tidak dapat dibatalkan</li>
        </ul>
      </>
    ),
  },
];

function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background text-foreground font-sans antialiased">
      <SimpleNav />

      <main className="pt-32 md:pt-40 pb-20 px-5">
        <div className="mx-auto max-w-3xl">
          <div className="text-center mb-14">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[oklch(0.55_0.10_75)] mb-3">
              Dokumen Resmi
            </p>
            <h1 className="font-display text-3xl md:text-4xl lg:text-[2.75rem] text-foreground leading-snug">
              Kebijakan Privasi
            </h1>
            <p className="mt-4 text-sm text-muted-foreground">
              Terakhir diperbarui: Juni 2026
            </p>
          </div>

          <article className="space-y-10">
            <p className="text-[15px] md:text-base text-muted-foreground leading-relaxed">
              MITAN berkomitmen melindungi privasi Anda. Dokumen ini menjelaskan
              bagaimana kami mengumpulkan, menggunakan, menyimpan, dan melindungi
              data pribadi Anda sebagai pengguna platform taaruf.
            </p>

            {sections.map(({ icon: Icon, title, body }) => (
              <section key={title} className="border-t border-border pt-8">
                <div className="flex items-start gap-4 mb-4">
                  <span className="shrink-0 mt-0.5 w-9 h-9 rounded-full bg-primary/5 flex items-center justify-center">
                    <Icon className="w-4 h-4 text-primary" strokeWidth={1.5} />
                  </span>
                  <h2 className="font-display text-xl text-foreground leading-snug mt-0.5">
                    {title}
                  </h2>
                </div>
                <div className="text-[15px] text-muted-foreground leading-relaxed pl-[52px]">
                  {body}
                </div>
              </section>
            ))}

            <section className="border-t border-border pt-8">
              <div className="flex items-start gap-4 mb-4">
                <span className="shrink-0 mt-0.5 w-9 h-9 rounded-full bg-primary/5 flex items-center justify-center">
                  <Mail className="w-4 h-4 text-primary" strokeWidth={1.5} />
                </span>
                <h2 className="font-display text-xl text-foreground leading-snug mt-0.5">
                  Kontak
                </h2>
              </div>
              <div className="text-[15px] text-muted-foreground leading-relaxed pl-[52px]">
                <p>
                  Jika Anda memiliki pertanyaan tentang kebijakan privasi ini atau
                  ingin mengajukan permohonan terkait data pribadi Anda, silakan
                  hubungi kami melalui halaman{" "}
                  <Link
                    to="/contact"
                    className="text-foreground underline underline-offset-4 hover:text-primary transition-colors"
                  >
                    Hubungi Kami
                  </Link>
                  .
                </p>
              </div>
            </section>
          </article>
        </div>
      </main>

      <Footer />
    </div>
  );
}
