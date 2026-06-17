import '@/styles/globals.css'
import type { ReactNode } from 'react'
import Header from '@/components/Header'

export const metadata = {
  title: 'SUKUN',
  description: 'SUKUN — Refactored Next.js app'
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Header />
        <main className="min-h-[80vh]">{children}</main>
        <footer className="w-full border-t py-6 text-center text-sm text-gray-500">© SUKUN</footer>
      </body>
    </html>
  )
}
