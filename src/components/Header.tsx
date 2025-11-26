import { Link } from 'react-router-dom';

type HeaderProps = {
  showMenuButton?: boolean;
  onMenuClick?: () => void;
};

export function Header({ showMenuButton = false, onMenuClick }: HeaderProps) {
  return (
    <header className="bg-primary text-white shadow-md">
      <div className="container mx-auto flex items-center gap-3 sm:gap-4 px-4 py-3 sm:py-4">
        {showMenuButton && (
          <button
            type="button"
            onClick={onMenuClick}
            className="md:hidden inline-flex items-center justify-center rounded-xl border border-white/30 bg-white/10 p-2 text-white transition hover:bg-white/15 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            aria-label="Toggle navigation"
          >
            <svg
              className="h-5 w-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="4" y1="6" x2="20" y2="6" />
              <line x1="4" y1="12" x2="20" y2="12" />
              <line x1="4" y1="18" x2="20" y2="18" />
            </svg>
          </button>
        )}
        <Link
          to="/dashboard"
          className="text-lg sm:text-xl lg:text-2xl font-bold hover:opacity-90 transition-opacity block"
        >
          <span className="hidden sm:inline">NCAA Men's Basketball Data Explorer</span>
          <span className="sm:hidden">NCAA Basketball Data</span>
        </Link>
      </div>
    </header>
  );
}

