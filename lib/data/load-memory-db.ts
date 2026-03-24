import { existsSync } from "node:fs"
import path from "node:path"
import { deriveDashboardState } from "@/lib/insights/derive-state"
import { openDatabase } from "@/lib/db/open-database"
import { assertCompatibleMemoryDb, hasTable } from "@/lib/db/introspect"
import type { AssociationRecord, MemoryRecord } from "@/lib/types"

function toNumber(value: unknown, fallback = 0) {
  const numeric = Number(value)
  return Number.isFinite(numeric) ? numeric : fallback
}

function deriveFallbackCurrentTick(memories: MemoryRecord[]) {
  return memories.reduce((maxTick, memory) => {
    return Math.max(
      maxTick,
      memory.created_tick,
      memory.last_activated_tick,
      memory.last_reinforced_tick,
    )
  }, 0)
}

export function resolveDatabasePath(inputPath: string, baseDir = process.cwd()) {
  if (path.isAbsolute(inputPath)) {
    return inputPath
  }

  const appRelative = path.resolve(baseDir, inputPath)
  if (existsSync(appRelative)) {
    return appRelative
  }

  const workspaceRelative = path.resolve(baseDir, "..", inputPath)
  if (existsSync(workspaceRelative)) {
    return workspaceRelative
  }

  return appRelative
}

export async function loadMemoryDb(inputPath: string, options?: { baseDir?: string }) {
  const resolvedPath = resolveDatabasePath(inputPath, options?.baseDir)
  const db = openDatabase(resolvedPath)

  try {
    assertCompatibleMemoryDb(db)

    const memories = db
      .prepare(
        `
          SELECT
            id,
            content,
            COALESCE(mtype, 'episode') as mtype,
            COALESCE(importance, 0.7) as importance,
            COALESCE(speaker, '') as speaker,
            COALESCE(created_tick, 0) as created_tick,
            COALESCE(storage_score, 1.0) as storage_score,
            COALESCE(retrieval_score, 1.0) as retrieval_score,
            COALESCE(stability_score, 0.0) as stability_score,
            COALESCE(last_activated_tick, created_tick, 0) as last_activated_tick,
            COALESCE(last_reinforced_tick, created_tick, 0) as last_reinforced_tick,
            COALESCE(retrieval_count, 0) as retrieval_count
          FROM memories
        `,
      )
      .all() as MemoryRecord[]

    const metadata = hasTable(db, "metadata")
      ? (db.prepare(`SELECT key, value FROM metadata`).all() as Array<{ key: string; value: string }>)
      : []

    const metadataMap = Object.fromEntries(metadata.map((row) => [row.key, row.value]))

    const associations = hasTable(db, "associations")
      ? (db
          .prepare(
            `
              SELECT
                source_id,
                target_id,
                COALESCE(weight, 0.5) as weight,
                COALESCE(created_tick, 0) as created_tick
              FROM associations
            `,
          )
          .all() as AssociationRecord[])
      : []

    const derivedTick =
      metadataMap.current_tick !== undefined
        ? toNumber(metadataMap.current_tick, deriveFallbackCurrentTick(memories))
        : deriveFallbackCurrentTick(memories)

    const dashboard = deriveDashboardState({
      currentTick: derivedTick,
      memories,
      associations,
    })

    return {
      path: resolvedPath,
      meta: {
        currentTick: derivedTick,
        memoryCount: memories.length,
        associationCount: associations.length,
        metadata: metadataMap,
      },
      ...dashboard,
    }
  } finally {
    db.close()
  }
}
