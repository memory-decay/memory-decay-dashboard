import { NextRequest, NextResponse } from "next/server"
import { loadMemoryDb } from "@/lib/data/load-memory-db"

export const runtime = "nodejs"

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { path?: string }

    if (!body.path) {
      return NextResponse.json({ error: "Database path is required" }, { status: 400 })
    }

    const payload = await loadMemoryDb(body.path)
    return NextResponse.json(payload)
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load database"
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
