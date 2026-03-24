import type Database from "better-sqlite3"

export function hasTable(db: Database.Database, tableName: string) {
  const row = db
    .prepare(
      `
        SELECT name
        FROM sqlite_master
        WHERE type = 'table' AND name = ?
      `,
    )
    .get(tableName)

  return Boolean(row)
}

export function assertCompatibleMemoryDb(db: Database.Database) {
  if (!hasTable(db, "memories")) {
    throw new Error("Incompatible database: missing memories table")
  }
}
