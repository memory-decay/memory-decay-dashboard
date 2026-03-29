import test from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { join } from "node:path"

const root = process.cwd()

function read(relativePath: string) {
  return readFileSync(join(root, relativePath), "utf8")
}

test("light theme defines dedicated icon-button treatments", () => {
  const css = read("app/globals.css")

  assert.match(css, /\.icon-button\s*\{/)
  assert.match(css, /html\[data-theme="light"\]\s+\.icon-button\s*\{/)
  assert.match(css, /\.nav-icon-shell\s*\{/)
  assert.match(css, /html\[data-theme="light"\]\s+\.nav-icon-shell\s*\{/)
})

test("theme toggle and sidebar use the dedicated icon button classes", () => {
  const themeToggle = read("components/theme-toggle.tsx")
  const sidebar = read("components/sidebar.tsx")

  assert.match(themeToggle, /className="icon-button"/)
  assert.match(sidebar, /nav-icon-shell/)
})
