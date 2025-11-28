import { Link } from 'react-router-dom';
import { teamSlugFromName } from '../utils/teamUtils';

type TeamLinkProps = {
  name?: string;
  className?: string;
};

export function TeamLink({ name, className }: TeamLinkProps) {
  if (!name) {
    return <span className={className}>—</span>;
  }
  const slug = teamSlugFromName(name);
  if (!slug) {
    return <span className={className}>{name}</span>;
  }
  return (
    <Link to={`/teams/${slug}`} className={`text-primary font-semibold hover:underline ${className ?? ''}`}>
      {name}
    </Link>
  );
}




