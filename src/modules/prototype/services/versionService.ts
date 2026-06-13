import type { PrototypeBuild, PrototypeFile, PrototypeRecord, PrototypeVersion } from '../types/prototype.types';

function parseVersion(version: string): number[] {
  return version.split('.').map((n) => parseInt(n, 10) || 0);
}

export function bumpPatchVersion(version: string): string {
  const parts = parseVersion(version);
  while (parts.length < 3) parts.push(0);
  parts[2] += 1;
  return parts.join('.');
}

export function buildVersionHistory(
  prototype: PrototypeRecord,
  builds: PrototypeBuild[],
  files: PrototypeFile[]
): PrototypeVersion[] {
  const entries: PrototypeVersion[] = [
    {
      id: `v-${prototype.id}-base`,
      prototype_id: prototype.id,
      version: prototype.version,
      changelog: 'Current prototype version',
      file_url: prototype.file_url,
      created_at: prototype.updated_at,
    },
  ];

  for (const build of builds.slice(0, 5)) {
    entries.push({
      id: build.id,
      prototype_id: prototype.id,
      version: prototype.version,
      changelog: `Build ${build.status}${build.build_config ? `: ${build.build_config.slice(0, 60)}` : ''}`,
      file_url: build.output_url,
      created_at: build.completed_at ?? build.started_at,
    });
  }

  for (const file of files.slice(0, 5)) {
    entries.push({
      id: file.id,
      prototype_id: prototype.id,
      version: prototype.version,
      changelog: `Uploaded ${file.fileName}`,
      file_url: file.url ?? null,
      created_at: file.uploadedAt,
    });
  }

  return entries.sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
}

export const versionService = {
  bumpPatchVersion,
  buildVersionHistory,
};
