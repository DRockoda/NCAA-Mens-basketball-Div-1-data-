import { Link } from 'react-router-dom';

export function Home() {
  return (
    <div className="min-h-screen bg-cream">
      <div className="container mx-auto px-4 py-12">
        {/* Hero Section */}
        <div className="text-center mb-8 sm:mb-12">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-text-main mb-3 sm:mb-4 px-4">
            NCAA Men's Basketball Data Explorer
          </h1>
          <p className="text-base sm:text-lg lg:text-xl text-gray-600 px-4">
            Explore team, player, and transfer data with powerful filters.
          </p>
        </div>

        {/* Navigation Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 max-w-5xl mx-auto px-4">
          <Link
            to="/teams"
            className="bg-white rounded-2xl shadow-md p-8 hover:shadow-xl hover:scale-105 transition-all duration-200 border-t-4 border-primary"
          >
            <div className="text-center">
              <div className="text-4xl mb-4">🏀</div>
              <h2 className="text-2xl font-bold text-text-main mb-2">Team Data</h2>
              <p className="text-gray-600">
                Explore team statistics, records, and performance metrics
              </p>
            </div>
          </Link>

          <Link
            to="/players"
            className="bg-white rounded-2xl shadow-md p-8 hover:shadow-xl hover:scale-105 transition-all duration-200 border-t-4 border-primary"
          >
            <div className="text-center">
              <div className="text-4xl mb-4">👤</div>
              <h2 className="text-2xl font-bold text-text-main mb-2">Player Data</h2>
              <p className="text-gray-600">
                Browse individual player statistics and achievements
              </p>
            </div>
          </Link>

          <Link
            to="/transfers"
            className="bg-white rounded-2xl shadow-md p-8 hover:shadow-xl hover:scale-105 transition-all duration-200 border-t-4 border-primary"
          >
            <div className="text-center">
              <div className="text-4xl mb-4">🔄</div>
              <h2 className="text-2xl font-bold text-text-main mb-2">Transfer Data</h2>
              <p className="text-gray-600">
                Track player transfers between schools and seasons
              </p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}

