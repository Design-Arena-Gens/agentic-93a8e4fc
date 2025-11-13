import type { Metadata } from 'next'
import './globals.css'
import { Poppins } from 'next/font/google'

const font = Poppins({ subsets: ['latin'], weight: ['400','500','600','700'] })

export const metadata: Metadata = {
  title: 'Jarvis Mini - Voice Agent',
  description: 'Friendly voice assistant with a cute robot avatar powered by Gemini',
  viewport: 'width=device-width, initial-scale=1, user-scalable=no, viewport-fit=cover',
  themeColor: '#0b0b12'
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={font.className}>{children}</body>
    </html>
  )
}
