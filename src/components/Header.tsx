import { Link } from 'react-router-dom';

export function Header() {
  return (
    <header className="bg-primary text-white shadow-md">
      <div className="container mx-auto px-4 py-3 sm:py-4">
        <Link to="/" className="text-lg sm:text-xl lg:text-2xl font-bold hover:opacity-90 transition-opacity block">
          <span className="hidden sm:inline">NCAA Men's Basketball Data Explorer</span>
          <span className="sm:hidden">NCAA Basketball Data</span>
        </Link>
      </div>
    </header>
  );
}

