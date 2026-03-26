import type { Metadata } from "next"
import Sidebar from "@/components/sidebar"
import "./globals.css"

export const metadata: Metadata = {
  title: "Memory Decay 대시보드",
  description: "AI 에이전트 메모리 감쇠 관리 대시보드",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>
        <Sidebar />
        <main className="ml-56 min-h-screen p-6">
          {children}
        </main>
      </body>
    </html>
  )
}
