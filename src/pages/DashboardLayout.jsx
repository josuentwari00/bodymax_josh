import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { cn } from '../utils/cn.js'

function SidebarLink({ to, label, icon, end }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        cn(
          'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition',
          isActive ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
        )
      }
    >
      <span className="shrink-0">{icon}</span>
      {label}
    </NavLink>
  )
}

function BottomNavItem({ to, label, icon, end }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        cn(
          'flex flex-col items-center justify-center gap-1 py-2 text-[11px] font-medium transition',
          isActive ? 'text-brand-700' : 'text-slate-500 hover:text-slate-900'
        )
      }
    >
      <span className="h-6 w-6">{icon}</span>
      {label}
    </NavLink>
  )
}

const icons = {
  dashboard: (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z" />
    </svg>
  ),
  events: (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  ),
  register: (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2m-6 9l2 2 4-4m-3-7V3m4 2h6" />
    </svg>
  ),
  clubs: (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m6-2.13a4 4 0 10-6 0M16 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  ),
  boxers: (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  ),
  records: (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2m-6 10l-2 2m0 0l4 0m-4 0V15m2-7h6M9 9V7m4 2h2" />
    </svg>
  ),
  settings: (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  logout: (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
    </svg>
  ),
}

function NavItem({ to, label, icon, end }) {
  return { to, label, icon, end }
}

export default function DashboardLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const isPromoter = user?.role === 'promoter'
  const isClub = user?.role === 'club'
  const isOfficial = user?.role === 'official'
  const title = isPromoter ? 'Promoter' : isClub ? 'Club Portal' : 'Officials'

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const mobileNav = isClub
    ? [
        NavItem('/app', 'Home', icons.dashboard, true),
        NavItem('/app/events', 'Events', icons.events),
        NavItem('/app/club/register', 'Register', icons.register),
        NavItem('/app/club/boxers', 'Boxers', icons.boxers),
        NavItem('/app/settings', 'Settings', icons.settings),
      ]
    : isPromoter
      ? [
          NavItem('/app', 'Home', icons.dashboard, true),
          NavItem('/app/events', 'Events', icons.events),
          NavItem('/app/clubs', 'Clubs', icons.clubs),
          NavItem('/app/boxers', 'Boxers', icons.boxers),
          NavItem('/app/settings', 'Settings', icons.settings),
        ]
      : [
          NavItem('/app', 'Home', icons.dashboard, true),
          NavItem('/app/events', 'Events', icons.events),
          NavItem('/app/registrations', 'Records', icons.records),
          NavItem('/app/settings', 'Settings', icons.settings),
        ]

  return (
    <div className="min-h-screen bg-slate-100">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 bg-slate-900 text-slate-300 md:block">
        <div className="flex h-16 items-center border-b border-slate-800 px-5">
          <span className="text-lg font-bold text-white">Bodymax</span>
          <span className="ml-2 rounded bg-brand-600 px-1.5 py-0.5 text-xs font-semibold text-white">{title}</span>
        </div>
        <nav className="flex flex-col gap-1 p-3">
          <SidebarLink to="/app" label="Dashboard" icon={icons.dashboard} end />

          {isPromoter && (
            <>
              <SidebarLink to="/app/events" label="Events" icon={icons.events} />
              <SidebarLink to="/app/clubs" label="Clubs" icon={icons.clubs} />
              <SidebarLink to="/app/boxers" label="Boxers" icon={icons.boxers} />
              <SidebarLink to="/app/registrations" label="Registrations" icon={icons.records} />
            </>
          )}

          {isClub && (
            <>
              <SidebarLink to="/app/events" label="Available Events" icon={icons.events} />
              <SidebarLink to="/app/club/register" label="Register Boxers" icon={icons.register} />
              <SidebarLink to="/app/club/boxers" label="My Boxers" icon={icons.boxers} />
            </>
          )}

          {isOfficial && (
            <>
              <SidebarLink to="/app/events" label="Events" icon={icons.events} />
              <SidebarLink to="/app/registrations" label="Records" icon={icons.records} />
            </>
          )}

          <SidebarLink to="/app/settings" label="Settings" icon={icons.settings} />
        </nav>
        <div className="absolute bottom-0 left-0 right-0 border-t border-slate-800 p-3">
          <div className="mb-2 px-3">
            <p className="truncate text-sm font-medium text-white">{user?.name}</p>
            <p className="truncate text-xs text-slate-400">{user?.email}</p>
          </div>
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-300 transition hover:bg-slate-800 hover:text-white"
          >
            {icons.logout}
            Sign out
          </button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-slate-200 bg-white px-4 md:hidden">
        <div className="flex items-center gap-2">
          <span className="text-base font-bold text-slate-900">Bodymax</span>
          <span className="rounded bg-brand-600 px-1.5 py-0.5 text-[10px] font-semibold text-white">{title}</span>
        </div>
        <div className="flex items-center gap-3">
          <p className="max-w-[140px] truncate text-xs text-slate-500">{user?.name}</p>
          <button
            aria-label="Sign out"
            onClick={handleLogout}
            className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
          >
            {icons.logout}
          </button>
        </div>
      </header>

      {/* Main content */}
      <main className="mx-auto w-full max-w-6xl flex-1 p-4 pb-24 md:ml-64 md:p-8 md:pb-8 lg:pb-8">
        <Outlet />
      </main>

      {/* Mobile bottom nav */}
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 backdrop-blur md:hidden">
        <div className="grid" style={{ gridTemplateColumns: `repeat(${mobileNav.length}, minmax(0, 1fr))` }}>
          {mobileNav.map((it) => (
            <BottomNavItem key={it.label} to={it.to} label={it.label} icon={it.icon} end={it.end} />
          ))}
        </div>
      </nav>
    </div>
  )
}