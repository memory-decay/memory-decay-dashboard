import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "memory-decay-dashboard",
  description: "Read-only dashboard for memory-decay SQLite databases",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
