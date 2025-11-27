const TEAM_NAME_KEYS = ['Team_Name', 'Team', 'School', 'TeamName', 'team'];

export function normalizeTeamName(value: unknown): string {
  return value ? String(value).trim() : '';
}

export function getTeamNameFromRow(row: Record<string, any>): string {
  for (const key of TEAM_NAME_KEYS) {
    if (row && row[key] != null && row[key] !== '') {
      return normalizeTeamName(row[key]);
    }
  }
  // Try to find any key that includes "team"
  const dynamicKey =
    row &&
    Object.keys(row).find((key) => key.toLowerCase().includes('team') && row[key]);
  if (dynamicKey) {
    return normalizeTeamName(row[dynamicKey]);
  }
  return 'Unknown Team';
}

export function teamSlugFromName(name: string): string {
  if (!name) return '';
  return name
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

export function teamSlugFromRow(row: Record<string, any>): string {
  return teamSlugFromName(getTeamNameFromRow(row));
}

export function matchesTeam(row: Record<string, any>, teamId: string): boolean {
  if (!teamId) return false;
  return teamSlugFromRow(row) === teamId;
}



