import { Link, NavLink } from "react-router-dom";

const link = (path, label) => (
  <NavLink
    to={path}
    className={({ isActive }) =>
      `px-2 py-1 rounded ${isActive ? "text-sky-200 bg-slate-800" : "text-slate-400"}`
    }
  >
    {label}
  </NavLink>
);

export default function Navbar() {
  return (
    <header className="flex items-center justify-between border-b border-slate-800/80 px-4 py-2 bg-slate-950/90 backdrop-blur">
      <Link to="/" className="text-sm font-semibold text-slate-200">
        Tsunami &amp; Tide Alert
      </Link>
      <nav className="flex gap-1 text-sm">
        {link("/", "Home")}
        {link("/admin", "Admin")}
        {link("/evac", "Evacuation")}
      </nav>
    </header>
  );
}
