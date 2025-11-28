const PLAYER_NAME_KEYS = ['Name', 'Player', 'Player_Name', 'PlayerName'];
const PLAYER_ID_KEYS = ['Player_ID', 'PlayerID', 'PlayerId', 'ID', 'Id', 'player_id', 'id'];

export function normalizePlayerName(value: unknown): string {
  return value ? String(value).trim() : '';
}

export function getPlayerNameFromRow(row: Record<string, any>): string {
  for (const key of PLAYER_NAME_KEYS) {
    if (row && row[key] != null && row[key] !== '') {
      return normalizePlayerName(row[key]);
    }
  }
  if (!row) return '';
  const dynamicKey = Object.keys(row).find((key) => key.toLowerCase().includes('name') && row[key]);
  if (dynamicKey) {
    return normalizePlayerName(row[dynamicKey]);
  }
  return '';
}

export function getPlayerIdFromRow(row: Record<string, any>): string {
  for (const key of PLAYER_ID_KEYS) {
    if (row && row[key] != null && row[key] !== '') {
      return normalizePlayerName(row[key]);
    }
  }
  return '';
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

export function playerSlugFromName(name?: string, id?: string): string {
  if (!name) return '';
  const base = slugify(name);
  if (!base) return '';
  if (!id) {
    return base;
  }
  const idPart = slugify(id);
  return idPart ? `${base}-${idPart}` : base;
}

export function playerSlugFromRow(row: Record<string, any>): string {
  const name = getPlayerNameFromRow(row);
  if (!name) return '';
  const id = getPlayerIdFromRow(row);
  return playerSlugFromName(name, id);
}

export function matchesPlayer(row: Record<string, any>, slug: string): boolean {
  if (!slug) return false;
  return playerSlugFromRow(row) === slug;
}




