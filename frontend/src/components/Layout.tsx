import { Link, Outlet, useLocation } from 'react-router-dom'

const navItems = [
  { label: 'Connect', to: '/connect' },
  { label: 'Dashboard', to: '/dashboard' },
  { label: 'Reports', to: '/reports' },
]

export default function Layout() {
  const location = useLocation()

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">LicenseIQ</div>
        <nav>
          {navItems.map((item) => (
            <Link key={item.to} to={item.to} className={location.pathname === item.to ? 'active' : ''}>
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="sidebar-footer">Secure license clean-up, simplified.</div>
      </aside>
      <main className="content">
        <header className="topbar">
          <div>
            <div className="page-title">{navItems.find((item) => item.to === location.pathname)?.label || 'LicenseIQ'}</div>
            <div className="page-subtitle">Operational governance for Azure licensing.</div>
          </div>
        </header>
        <section className="page-content">
          <Outlet />
        </section>
      </main>
    </div>
  )
}
