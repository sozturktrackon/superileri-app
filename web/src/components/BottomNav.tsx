import { NavLink } from 'react-router-dom';

const items = [
  { to: '/', icon: '🏋️', label: 'Today', end: true },
  { to: '/calendar', icon: '📅', label: 'Calendar', end: false },
  { to: '/nutrition', icon: '🥗', label: 'Eat', end: false },
  { to: '/progress', icon: '📈', label: 'Progress', end: false },
  { to: '/about', icon: 'ℹ️', label: 'About', end: false },
];

const BottomNav = () => (
  <nav className="bottom-nav">
    {items.map((it) => (
      <NavLink
        key={it.to}
        to={it.to}
        end={it.end}
        className={({ isActive }) => (isActive ? 'active' : '')}
      >
        <span className="nav-ic">{it.icon}</span>
        {it.label}
      </NavLink>
    ))}
  </nav>
);

export default BottomNav;
