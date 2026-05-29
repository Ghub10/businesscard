import { NavLink } from "react-router-dom";

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `rounded-lg px-3 py-2 text-sm font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${
    isActive ? "bg-bg text-ink" : "text-muted hover:text-ink"
  }`;

export function AdminNav() {
  return (
    <nav className="border-line flex flex-wrap gap-1 border-b pb-3" aria-label="Admin sections">
      <NavLink to="/admin/edit" className={linkClass} end>
        Edit
      </NavLink>
      <NavLink to="/admin/share" className={linkClass}>
        Share / QR
      </NavLink>
      <NavLink to="/admin/stats" className={linkClass}>
        Stats
      </NavLink>
    </nav>
  );
}
