import { Link } from 'react-router-dom';

export function Header() {
  return (
    <header className="bg-primary text-white shadow-md">
      <div className="container mx-auto px-4 py-4">
        <Link to="/" className="text-2xl font-bold hover:opacity-90 transition-opacity">
          NCAA Men's Basketball Data Explorer
        </Link>
      </div>
    </header>
  );
}

