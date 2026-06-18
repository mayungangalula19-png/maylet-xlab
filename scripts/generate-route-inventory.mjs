/**
 * Generate docs/route-inventory.csv from the canonical Router.tsx registry.
 * Run: npm run audit:routes
 */
import fs from 'fs';
import path from 'path';

const ROUTER_PATH = 'src/app/Router.tsx';
const SIDEBAR_PATH = 'src/modules/dashboard/components/AppSidebar.tsx';
const ADMIN_NAV_PATH = 'src/modules/admin/config/adminNav.config.ts';
const OUTPUT_CSV = 'docs/route-inventory.csv';

const routerSource = fs.readFileSync(ROUTER_PATH, 'utf8');
const sidebarSource = fs.existsSync(SIDEBAR_PATH) ? fs.readFileSync(SIDEBAR_PATH, 'utf8') : '';
const adminNavSource = fs.existsSync(ADMIN_NAV_PATH) ? fs.readFileSync(ADMIN_NAV_PATH, 'utf8') : '';

/** @type {Map<string, string>} */
const componentImports = new Map();

const lazyImportRe =
  /const\s+(\w+)\s*=\s*lazy\(\(\)\s*=>\s*import\((['"])([^'"]+)\2\)(?:\.then\([^)]+\))?\)/g;

for (const match of routerSource.matchAll(lazyImportRe)) {
  const [, name, , importPath] = match;
  componentImports.set(name, importPath.replace(/^\.\.\//, 'src/'));
}

const layoutImportRe =
  /import\((['"])([^'"]+)\1\)\.then\(\(m\)\s*=>\s*\(\{\s*default:\s*m\.(\w+)\s*\}\)\)/g;
for (const match of routerSource.matchAll(layoutImportRe)) {
  const [, , importPath, exportName] = match;
  componentImports.set(exportName, importPath.replace(/^\.\.\//, 'src/'));
}

const routeRe = /<Route\s+path="([^"]+)"\s+element=\{<(\w+)\s*\/>\}\s*\/>/g;
/** @type {Array<{ path: string, component: string, modulePath: string, zone: string }>} */
const routes = [];

for (const match of routerSource.matchAll(routeRe)) {
  const [, routePath, component] = match;
  const modulePath = componentImports.get(component) ?? '(unknown)';
  let zone = 'public';
  if (routePath.startsWith('/admin')) zone = 'admin';
  else if (routePath === '/' || routePath.startsWith('/login') || routePath.startsWith('/register')) {
    zone = 'public';
  } else if (
    [
      '/features',
      '/pricing',
      '/about',
      '/blog',
      '/faq',
      '/contact',
      '/privacy',
      '/terms',
      '/demo',
      '/careers',
      '/press',
      '/cookies',
      '/status',
      '/community',
      '/security',
      '/help',
      '/ecosystem',
      '/resources',
    ].some((p) => routePath === p || routePath.startsWith(`${p}/`))
  ) {
    zone = 'public';
  } else if (routePath === '*') {
    zone = 'catch-all';
  } else {
    zone = 'protected';
  }

  routes.push({ path: routePath, component, modulePath, zone });
}

function inAppSidebar(routePath) {
  if (routePath === '/') return sidebarSource.includes("route: '/'");
  const base = routePath.split('/:')[0];
  return sidebarSource.includes(`route: '${base}'`) || sidebarSource.includes(`route: "${base}"`);
}

function inAdminNav(routePath) {
  const base = routePath.split('/:')[0];
  return adminNavSource.includes(`route: '${base}'`) || adminNavSource.includes(`route: "${base}"`);
}

function moduleCategory(modulePath) {
  if (modulePath.includes('/admin/')) return 'Enterprise';
  if (modulePath.includes('/auth/')) return 'Marketing';
  if (modulePath.includes('/billing/')) return 'Dashboard';
  if (modulePath.includes('/projects/')) return 'Projects';
  if (modulePath.includes('/research/')) return 'Research';
  if (modulePath.includes('/prototype/')) return 'Prototype';
  if (modulePath.includes('/experiment/')) return 'Experiment';
  if (modulePath.includes('/validation/')) return 'Validation';
  if (modulePath.includes('/funding/')) return 'Funding';
  if (modulePath.includes('/commercialization/')) return 'Commercialization';
  if (modulePath.includes('/documents/')) return 'Documents';
  if (modulePath.includes('/ecosystem/') || modulePath.includes('/teams/')) return 'Ecosystem';
  if (modulePath.includes('/enterprise/') || modulePath.includes('/vault/')) return 'Enterprise';
  if (modulePath.includes('/marketing/') || modulePath.includes('/careers/')) return 'Marketing';
  if (modulePath.includes('/messages/') || modulePath.includes('/account/')) return 'Dashboard';
  if (modulePath.includes('/maya/')) return 'Dashboard';
  if (modulePath.includes('/tools/')) return 'Dashboard';
  return 'Marketing';
}

function shimForModule(modulePath) {
  if (!modulePath.startsWith('src/modules/')) return '(none)';
  const rel = modulePath.replace(/^src\/modules\//, '');
  const candidates = walkTsx('src/app/routes');
  for (const shim of candidates) {
    try {
      const content = fs.readFileSync(shim, 'utf8');
      if (content.includes(rel.split('/').pop()?.replace('.tsx', '') ?? '___')) {
        if (content.includes(rel.replace(/\.tsx$/, '').split('/').slice(-2).join('/'))) {
          return shim.replace(/\\/g, '/');
        }
      }
    } catch {
      // skip
    }
  }
  return '(no shim — Router imports module directly)';
}

function walkTsx(dir) {
  if (!fs.existsSync(dir)) return [];
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walkTsx(full));
    else if (entry.name.endsWith('.tsx')) out.push(full);
  }
  return out;
}

const esc = (v) => `"${String(v).replace(/"/g, '""')}"`;

const header = [
  'Route',
  'Component',
  'Zone',
  'Module Category',
  'Canonical Module Path',
  'Legacy Shim',
  'In AppSidebar',
  'In AdminNav',
  'Source',
];

const rows = routes.map((r) => [
  r.path,
  r.component,
  r.zone,
  moduleCategory(r.modulePath),
  r.modulePath,
  shimForModule(r.modulePath),
  r.zone === 'protected' ? (inAppSidebar(r.path) ? 'Yes' : 'No') : 'N/A',
  r.zone === 'admin' ? (inAdminNav(r.path) ? 'Yes' : 'No') : 'N/A',
  'Router.tsx',
]);

fs.mkdirSync('docs', { recursive: true });
const csv = [header.map(esc).join(',')].concat(rows.map((r) => r.map(esc).join(','))).join('\n');
fs.writeFileSync(OUTPUT_CSV, csv);

const aliasGroups = new Map();
for (const r of routes) {
  const key = r.component;
  if (!aliasGroups.has(key)) aliasGroups.set(key, []);
  aliasGroups.get(key).push(r.path);
}
const duplicateAliases = [...aliasGroups.entries()].filter(([, paths]) => paths.length > 1);

console.log(`Wrote ${rows.length} routes to ${OUTPUT_CSV}`);
console.log(`Lazy imports resolved: ${componentImports.size}`);
if (duplicateAliases.length) {
  console.log('\nAlias routes (same component, multiple paths):');
  for (const [component, paths] of duplicateAliases) {
    console.log(`  ${component}: ${paths.join(', ')}`);
  }
}
