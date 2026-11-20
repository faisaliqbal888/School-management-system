/**
 * Prisma Client generator — no native engine download required.
 *
 * The Prisma CLI downloads ~20 MB native engine binaries from
 * binaries.prisma.sh at generate time. That host is unreachable in restricted
 * CI/sandbox environments, so this script drives the same code paths directly:
 *
 *   1. @prisma/prisma-schema-wasm  → DMMF (this *is* the real Prisma engine,
 *                                     compiled to WASM: parses + validates)
 *   2. @prisma/client/generator-build → the actual client generator,
 *                                       driven over its JSON-RPC protocol
 *
 * The schema uses `engineType = "client"`, so the generated client ships the
 * WASM query compiler instead of a native binary — it runs anywhere.
 *
 * Usage:  npm run prisma:generate
 */
global.PRISMA_WASM_PANIC_REGISTRY = {
  message: null,
  set_message(m) {
    this.message = m
  },
  take_message() {
    const m = this.message
    this.message = null
    return m
  },
}

const fs = require('node:fs')
const path = require('node:path')
const { spawnSync } = require('node:child_process')

const ROOT = path.resolve(__dirname, '../..')
const SCHEMA_PATH = path.join(ROOT, 'backend/prisma/schema.prisma')
const OUT_DIR = path.join(ROOT, 'node_modules/.prisma/client')
const WASM_MODULE = path.join(ROOT, 'node_modules/@prisma/prisma-schema-wasm/src/prisma_schema_build.js')
const GENERATOR = path.join(ROOT, 'node_modules/@prisma/client/generator-build/index.js')

function fail(msg) {
  console.error(`\n✗ ${msg}\n`)
  process.exit(1)
}

if (!fs.existsSync(WASM_MODULE)) {
  fail(
    '@prisma/prisma-schema-wasm is missing. Install it with:\n' +
      '  npm i -D @prisma/prisma-schema-wasm@' + '7.1.1-3.c2990dca591cba766e3b7ef5d9e8a84796e47ab7',
  )
}

// ── 1. build the DMMF (validates the schema with the real Prisma engine) ───
const schemaWasm = require(WASM_MODULE)
const datamodel = fs.readFileSync(SCHEMA_PATH, 'utf8')

let dmmf
try {
  dmmf = JSON.parse(schemaWasm.get_dmmf(JSON.stringify({ prismaSchema: datamodel })))
} catch (err) {
  // Validation failures come back as a JSON string in the error message.
  const raw = String(err.message ?? err)
  try {
    const parsed = JSON.parse(raw)
    fail(`Schema validation failed (${parsed.error_code}):\n\n${parsed.message}`)
  } catch {
    fail(`Schema could not be parsed:\n\n${raw}`)
  }
}

console.log(
  `✓ schema valid — ${dmmf.datamodel.models.length} models · ${dmmf.datamodel.enums.length} enums`,
)

// ── 2. feed the generator exactly what the CLI would send ──────────────────
const generatorConfig = { engineType: 'client' }
const previewFeatures = ['queryCompiler', 'driverAdapters']

const params = {
  generator: {
    name: 'client',
    provider: { fromEnvVar: null, value: 'prisma-client-js' },
    output: { fromEnvVar: null, value: OUT_DIR },
    config: generatorConfig,
    binaryTargets: [],
    previewFeatures,
    isCustomOutput: false,
    sourceFilePath: SCHEMA_PATH,
  },
  otherGenerators: [],
  schemaPath: SCHEMA_PATH,
  datamodel, // string — the generator hashes it
  dmmf, // external DMMF; the generator converts it internally
  datasources: [
    {
      name: 'db',
      provider: 'postgresql',
      activeProvider: 'postgresql',
      url: { fromEnvVar: 'DATABASE_URL', value: null },
      sourceFilePath: SCHEMA_PATH,
    },
  ],
  version: require(path.join(ROOT, 'node_modules/@prisma/client/package.json')).version,
  binaryPaths: {},
  dataProxy: false,
  envPaths: { rootEnvPath: null, schemaEnvPath: null },
  typedSql: [],
}

// ── 3. run the generator (JSON-RPC over stdin/stdout) ──────────────────────
// NOTE: generator-build's JSON-RPC `respond()` writes to **stderr**, not stdout.
const result = spawnSync(process.execPath, [GENERATOR], {
  cwd: ROOT,
  input: JSON.stringify({ jsonrpc: '2.0', id: 2, method: 'generate', params }) + '\n',
  timeout: 120_000,
  encoding: 'utf8',
})

const raw = `${result.stderr ?? ''}\n${result.stdout ?? ''}`
if (result.error) fail(`Could not start the generator: ${result.error.message}`)
if (!raw.includes('jsonrpc')) {
  fail(`Generator produced no JSON-RPC response (exit ${result.status}):\n${raw.slice(0, 2000)}`)
}

const response = raw
  .split('\n')
  .filter((l) => l.trim().startsWith('{'))
  .map((l) => {
    try {
      return JSON.parse(l)
    } catch {
      return null
    }
  })
  .find((r) => r && r.id === 2)

if (!response) fail(`Generator returned no JSON-RPC response:\n${raw.slice(0, 2000)}`)
if (response.error) {
  fail(`Generator error: ${response.error.message}\n\n${response.error.data?.stack ?? ''}`)
}

// ── 4. verify the artefacts ────────────────────────────────────────────────
const required = ['index.js', 'index.d.ts', 'default.js', 'default.d.ts']
for (const file of required) {
  const p = path.join(OUT_DIR, file)
  if (!fs.existsSync(p)) fail(`Generator did not produce ${file}`)
}

const dts = fs.readFileSync(path.join(OUT_DIR, 'index.d.ts'), 'utf8')
const models = (dts.match(/^  get [a-zA-Z]+\(\):/gm) ?? []).length

console.log(`✓ client written to node_modules/.prisma/client`)
console.log(`  index.d.ts  ${(fs.statSync(path.join(OUT_DIR, 'index.d.ts')).size / 1024).toFixed(0)} KB · ${models} model delegates`)

const hasWasmCompiler = fs.existsSync(path.join(OUT_DIR, 'query_compiler_bg.wasm'))
console.log(`  engine      ${hasWasmCompiler ? 'WASM query compiler (no native binary)' : 'native — run prisma generate'}`)
