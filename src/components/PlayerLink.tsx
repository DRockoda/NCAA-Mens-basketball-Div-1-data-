import { Link } from 'react-router-dom';
import { getPlayerNameFromRow, playerSlugFromName, playerSlugFromRow } from '../utils/playerUtils';

type PlayerLinkProps = {
  name?: string;
  slug?: string;
  row?: Record<string, any>;
  className?: string;
};

export function PlayerLink({ name, slug, row, className }: PlayerLinkProps) {
  const displayName = (name ?? (row ? getPlayerNameFromRow(row) : '') ?? '').trim();
  const computedSlug =
    slug ??
    (row
      ? playerSlugFromRow(row)
      : name
      ? playerSlugFromName(name)
      : '');

  if (!displayName) {
    return <span className={className}>—</span>;
  }

  if (!computedSlug) {
    return <span className={className}>{displayName}</span>;
  }

  return (
    <Link to={`/players/${computedSlug}`} className={`text-primary font-semibold hover:underline ${className ?? ''}`}>
      {displayName}
    </Link>
  );
}



