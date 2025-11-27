import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { Header } from './Header';

const NAV_ITEMS = [
  { label: 'Dashboard', path: '/dashboard', icon: '/Icons/Dashboard.svg' },
  { label: 'Player Data', path: '/players', icon: '/Icons/Player.svg' },
  { label: 'Team Data', path: '/teams', icon: '/Icons/Team.svg' },
  { label: 'Transfer Data', path: '/transfers', icon: '/Icons/Transfer.svg' },
  { label: 'Compare', path: '/compare', icon: '/Icons/Compare.svg' },
];

export function SidebarLayout() {
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    [
      'block rounded-xl px-4 py-3 font-semibold transition-colors',
      isActive
        ? 'bg-primary text-white shadow-md'
        : 'text-text-main hover:bg-cream/70 hover:text-primary-light',
    ].join(' ');

  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div className="flex min-h-screen bg-cream">
      <div
        className={`fixed inset-0 z-30 bg-black/30 transition-opacity duration-200 md:hidden ${
          isSidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={closeSidebar}
      />
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-cream/60 bg-white shadow-xl transition-transform duration-200 ease-in-out ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        } md:translate-x-0`}
      >
        <div className="px-6 py-5 border-b border-cream/60">
          <div className="text-xl font-bold text-text-main">IU Data Hub</div>
          <p className="mt-1 text-sm text-gray-500">NCAA Men's Basketball</p>
        </div>
        <nav className="flex-1 space-y-1 px-3 py-4" aria-label="Primary navigation">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => navLinkClass({ isActive })}
              onClick={closeSidebar}
            >
              {({ isActive }) => (
                <div className="flex items-center gap-3">
                  <img
                    src={item.icon}
                    alt=""
                    className="w-5 h-5 transition-all"
                    style={{
                      filter: isActive
                        ? 'brightness(0) invert(1)'
                        : 'invert(13%) sepia(96%) saturate(5450%) hue-rotate(351deg) brightness(91%) contrast(108%)',
                    }}
                  />
                  <span>{item.label}</span>
                </div>
              )}
            </NavLink>
          ))}
        </nav>
        <div className="px-3 py-4 border-t border-cream/60 space-y-1">
          <NavLink
            to="/glossary"
            className={({ isActive }) => navLinkClass({ isActive })}
            onClick={closeSidebar}
          >
            {({ isActive }) => (
              <div className="flex items-center gap-3">
                <img
                  src="/Icons/Glossary.svg"
                  alt=""
                  className="w-5 h-5 transition-all"
                  style={{
                    filter: isActive
                      ? 'brightness(0) invert(1)'
                      : 'invert(13%) sepia(96%) saturate(5450%) hue-rotate(351deg) brightness(91%) contrast(108%)',
                  }}
                />
                <span>Glossary</span>
              </div>
            )}
          </NavLink>
          <p className="text-xs text-gray-500 px-3">Indiana University · Data Explorer</p>
        </div>
      </aside>
      <div className="flex min-h-screen flex-1 flex-col md:ml-64">
        <Header showMenuButton onMenuClick={() => setSidebarOpen((prev) => !prev)} />
        <main className="flex-1 w-full">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

