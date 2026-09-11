import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { Icon, LogoMark } from './ui.jsx';

function initials(name = '') {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'IS';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

const LINKS = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/interview/setup', label: 'New Interview' },
  { to: '/profile', label: 'Profile' },
];

export default function Navbar() {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const closeMenu = () => setOpen(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const links = isAdmin ? [...LINKS, { to: '/admin', label: 'Admin' }] : LINKS;

  return (
    <nav className="nav">
      <div className="nav-inner">
        <Link to={user ? '/dashboard' : '/'} className="brand" onClick={closeMenu}>
          <LogoMark />
          <span>
            Interview<span className="grad-text">Sense</span>
          </span>
        </Link>

        {user && (
          <>
            <div className="nav-links">
              {links.map((l) => (
                <NavLink
                  key={l.to}
                  to={l.to}
                  className={({ isActive }) => `nav-link${isActive ? ' is-active' : ''}`}
                  end={l.to === '/admin'}
                >
                  {l.label}
                </NavLink>
              ))}
            </div>

            <div className="nav-right">
              <div className="nav-user">
                <span className="avatar">{initials(user.name)}</span>
                <span className="nav-user-meta">
                  <span className="nav-user-name truncate">{user.name}</span>
                  <span className="nav-user-role">{user.role}</span>
                </span>
              </div>
              <button type="button" className="btn btn--outline btn--sm" onClick={handleLogout}>
                <Icon name="logout" size={15} />
                <span className="nowrap">Logout</span>
              </button>
              <button
                type="button"
                className="nav-toggle"
                aria-label="Toggle navigation"
                aria-expanded={open}
                onClick={() => setOpen((o) => !o)}
              >
                <span />
                <span />
                <span />
              </button>
            </div>
          </>
        )}

        {!user && (
          <div className="nav-right">
            <Link to="/login" className="btn btn--ghost btn--sm">
              Sign in
            </Link>
            <Link to="/register" className="btn btn--primary btn--sm">
              Get started
              <Icon name="arrow" size={15} />
            </Link>
          </div>
        )}
      </div>

      {user && (
        <div className={`mobile-menu${open ? ' open' : ''}`}>
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              className={({ isActive }) => `nav-link${isActive ? ' is-active' : ''}`}
              end={l.to === '/admin'}
              onClick={closeMenu}
            >
              {l.label}
            </NavLink>
          ))}
        </div>
      )}
    </nav>
  );
}
