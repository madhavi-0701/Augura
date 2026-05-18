import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Augura - Binary Prediction Market',
  description: 'Predict anything. Settle on-chain.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <nav className="border-b p-4">
          <div className="container mx-auto flex justify-between items-center">
            <a href="/" className="text-xl font-bold">Augura</a>
            <div className="space-x-4">
              <a href="/markets" className="hover:underline">Markets</a>
              <a href="/create" className="hover:underline">Create</a>
            </div>
          </div>
        </nav>
        <main className="container mx-auto p-4">
          {children}
        </main>
      </body>
    </html>
  )
}