'use client'

import React from 'react'
import Link from 'next/link'

export default function Header() {
  return (
    <header className="w-full border-b py-4">
      <div className="mx-auto max-w-4xl px-4 flex items-center justify-between">
        <Link href="/" className="text-lg font-semibold">
          SUKUN
        </Link>
        <nav>
          <Link href="/" className="text-sm text-gray-600 hover:text-gray-900">
            Home
          </Link>
        </nav>
      </div>
    </header>
  )
}
