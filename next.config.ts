import createNextIntlPlugin from 'next-intl/plugin';
import path from "node:path"
import { fileURLToPath } from "node:url"
import type { NextConfig } from "next"

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const withNextIntl = createNextIntlPlugin('./lib/i18n.ts');

const nextConfig: NextConfig = {
  output: "standalone",
  reactStrictMode: true,
  outputFileTracingRoot: __dirname,
}

export default withNextIntl(nextConfig);
