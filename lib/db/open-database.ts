import Database from "better-sqlite3"

export function openDatabase(path: string) {
  return new Database(path, {
    readonly: true,
    fileMustExist: true,
  })
}
