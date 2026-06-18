/**
 * Detect circular import cycles in src/ (no external deps).
 * Run: npm run audit:circular
 */
import fs from 'fs';
import path from 'path';

const SRC = 'src';
const EXT = new Set(['.ts', '.tsx']);

/** @type {Map<string, Set<string>>} */
const graph = new Map();

function normalize(filePath) {
  return filePath.replace(/\\/g, '/');
}

function resolveImport(fromFile, spec) {
  if (spec.startsWith('@/')) {
    return normalize(path.join(SRC, spec.slice(2)));
  }
  if (spec.startsWith('@modules/')) {
    return normalize(path.join(SRC, 'modules', spec.slice('@modules/'.length)));
  }
  if (spec.startsWith('@shared/')) {
    return normalize(path.join(SRC, 'modules/shared', spec.slice('@shared/'.length)));
  }
  if (!spec.startsWith('.')) return null;

  const base = path.resolve(path.dirname(fromFile), spec);
  const candidates = [
    base,
    `${base}.ts`,
    `${base}.tsx`,
    path.join(base, 'index.ts'),
    path.join(base, 'index.tsx'),
  ];
  for (const c of candidates) {
    if (fs.existsSync(c) && fs.statSync(c).isFile()) {
      return normalize(c);
    }
  }
  return null;
}

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules') continue;
      walk(full);
    } else if (EXT.has(path.extname(entry.name))) {
      indexFile(full);
    }
  }
}

function indexFile(filePath) {
  const normalized = normalize(filePath);
  if (!graph.has(normalized)) graph.set(normalized, new Set());

  const source = fs.readFileSync(filePath, 'utf8');
  const importRe = /(?:import|export)\s+(?:type\s+)?(?:[^'";]+\s+from\s+)?['"]([^'"]+)['"]/g;
  for (const match of source.matchAll(importRe)) {
    const target = resolveImport(normalized, match[1]);
    if (target?.startsWith(`${SRC}/`)) {
      graph.get(normalized).add(target);
    }
  }
}

function findCycles() {
  /** @type {string[][]} */
  const cycles = [];
  /** @type {Set<string>} */
  const seen = new Set();
  /** @type {Map<string, string>} */
  const stack = new Map();

  function dfs(node, trail) {
    if (stack.has(node)) {
      const start = trail.indexOf(node);
      if (start >= 0) cycles.push(trail.slice(start).concat(node));
      return;
    }
    if (seen.has(node)) return;

    seen.add(node);
    stack.set(node, node);
    trail.push(node);

    for (const next of graph.get(node) ?? []) {
      dfs(next, trail);
    }

    trail.pop();
    stack.delete(node);
  }

  for (const node of graph.keys()) {
    dfs(node, []);
  }

  const unique = new Map();
  for (const cycle of cycles) {
    const key = [...cycle].sort().join('->');
    if (!unique.has(key)) unique.set(key, cycle);
  }
  return [...unique.values()];
}

walk(SRC);

const cycles = findCycles();
if (cycles.length === 0) {
  console.log('No circular dependencies found in src/');
  process.exit(0);
}

console.error(`Found ${cycles.length} circular dependency chain(s):\n`);
for (const cycle of cycles) {
  console.error(cycle.map((f) => f.replace(/^src\//, '')).join(' → '));
  console.error('');
}

process.exit(1);
