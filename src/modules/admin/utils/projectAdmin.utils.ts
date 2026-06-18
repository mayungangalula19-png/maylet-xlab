import type { ProjectStatus } from '../../projects/types/commandCenter.types';

const SECTOR_ICONS: Record<string, string> = {
  Agriculture: '🌾',
  Health: '🏥',
  Education: '📚',
  Blockchain: '🔗',
  Environment: '🌍',
  FinTech: '💰',
};

export function projectSectorIcon(sector: string | null | undefined) {
  if (!sector) return '💡';
  if (SECTOR_ICONS[sector]) return SECTOR_ICONS[sector];
  if (sector.includes('Agri')) return '🌾';
  if (sector.includes('Health')) return '🏥';
  if (sector.includes('Education')) return '📚';
  if (sector.includes('FinTech')) return '💰';
  if (sector.includes('Environment')) return '🌍';
  if (sector.includes('Blockchain')) return '🔗';
  if (sector.includes('AI') || sector.includes('ML')) return '🤖';
  if (sector.includes('IoT')) return '📡';
  return '💡';
}

export function projectStatusColor(status: ProjectStatus | string) {
  switch (status) {
    case 'Idea':
      return '#f6c90e';
    case 'Experiment':
      return '#2fd4ff';
    case 'Prototype':
      return '#7c5fe6';
    case 'Launched':
      return '#48bb78';
    default:
      return '#888';
  }
}

export function projectProgressColor(progress: number) {
  if (progress < 30) return '#fc8181';
  if (progress < 70) return '#f6c90e';
  return '#48bb78';
}

export function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function teamRoleIcon(role: string) {
  switch (role) {
    case 'admin':
    case 'owner':
      return '👑';
    case 'member':
      return '👤';
    case 'viewer':
      return '👁️';
    default:
      return '👤';
  }
}
