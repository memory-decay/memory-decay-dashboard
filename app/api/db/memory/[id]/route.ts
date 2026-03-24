import { NextRequest, NextResponse } from "next/server"
import { loadMemoryDb } from "@/lib/data/load-memory-db"

export const runtime = "nodejs"

type RouteContext = {
  params: Promise<{ id: string }>
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params
    const body = (await request.json()) as { path?: string }

    if (!body.path) {
      return NextResponse.json({ error: "Database path is required" }, { status: 400 })
    }

    const payload = await loadMemoryDb(body.path)
    const detail = payload.byId[id]

    if (!detail) {
      return NextResponse.json({ error: `Memory ${id} not found` }, { status: 404 })
    }

    return NextResponse.json({
      meta: payload.meta,
      detail,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load memory detail"
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
