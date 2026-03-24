import Database from "better-sqlite3"
import { mkdirSync } from "node:fs"
import { dirname } from "node:path"

export type FixtureMemory = {
  id: string
  content: string
  mtype?: string
  importance?: number
  speaker?: string
  created_tick?: number
  storage_score?: number
  retrieval_score?: number
  stability_score?: number
  last_activated_tick?: number
  last_reinforced_tick?: number
  retrieval_count?: number
}

export type FixtureAssociation = {
  source_id: string
  target_id: string
  weight?: number
  created_tick?: number
}

export function createMemoryDb(
  path: string,
  {
    memories,
    metadata = {},
    associations = [],
  }: {
    memories: FixtureMemory[]
    metadata?: Record<string, string>
    associations?: FixtureAssociation[]
  },
) {
  mkdirSync(dirname(path), { recursive: true })
  const db = new Database(path)

  db.exec(`
    CREATE TABLE memories (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL DEFAULT '',
      content TEXT NOT NULL,
      mtype TEXT DEFAULT 'episode',
      importance REAL DEFAULT 0.7,
      speaker TEXT DEFAULT '',
      created_tick INTEGER DEFAULT 0,
      storage_score REAL DEFAULT 1.0,
      retrieval_score REAL DEFAULT 1.0,
      stability_score REAL DEFAULT 0.0,
      last_activated_tick INTEGER DEFAULT 0,
      last_reinforced_tick INTEGER DEFAULT 0,
      retrieval_count INTEGER DEFAULT 0
    );
    CREATE TABLE associations (
      source_id TEXT,
      target_id TEXT,
      weight REAL DEFAULT 0.5,
      created_tick INTEGER DEFAULT 0,
      PRIMARY KEY (source_id, target_id)
    );
    CREATE TABLE metadata (
      key TEXT PRIMARY KEY,
      value TEXT
    );
  `)

  const insertMemory = db.prepare(`
    INSERT INTO memories (
      id, user_id, content, mtype, importance, speaker, created_tick,
      storage_score, retrieval_score, stability_score, last_activated_tick,
      last_reinforced_tick, retrieval_count
    ) VALUES (
      @id, '', @content, @mtype, @importance, @speaker, @created_tick,
      @storage_score, @retrieval_score, @stability_score, @last_activated_tick,
      @last_reinforced_tick, @retrieval_count
    )
  `)

  for (const memory of memories) {
    insertMemory.run({
      id: memory.id,
      content: memory.content,
      mtype: memory.mtype ?? "episode",
      importance: memory.importance ?? 0.7,
      speaker: memory.speaker ?? "",
      created_tick: memory.created_tick ?? 0,
      storage_score: memory.storage_score ?? 1,
      retrieval_score: memory.retrieval_score ?? 1,
      stability_score: memory.stability_score ?? 0,
      last_activated_tick: memory.last_activated_tick ?? memory.created_tick ?? 0,
      last_reinforced_tick: memory.last_reinforced_tick ?? memory.created_tick ?? 0,
      retrieval_count: memory.retrieval_count ?? 0,
    })
  }

  const insertAssociation = db.prepare(`
    INSERT INTO associations (source_id, target_id, weight, created_tick)
    VALUES (@source_id, @target_id, @weight, @created_tick)
  `)

  for (const association of associations) {
    insertAssociation.run({
      source_id: association.source_id,
      target_id: association.target_id,
      weight: association.weight ?? 0.5,
      created_tick: association.created_tick ?? 0,
    })
  }

  const insertMetadata = db.prepare(`
    INSERT INTO metadata (key, value) VALUES (?, ?)
  `)

  for (const [key, value] of Object.entries(metadata)) {
    insertMetadata.run(key, value)
  }

  db.close()
}
