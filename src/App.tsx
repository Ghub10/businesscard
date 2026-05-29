import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { PUBLIC_SLUG, publicPagePath } from "./lib/publicSlug";
import { AdminLogin } from "./pages/AdminLogin";
import { PublicPage } from "./pages/PublicPage";
import { RequireAdmin } from "./pages/RequireAdmin";

const AdminEdit = lazy(async () => {
  const m = await import("./pages/AdminEdit");
  return { default: m.AdminEdit };
});
const AdminShare = lazy(async () => {
  const m = await import("./pages/AdminShare");
  return { default: m.AdminShare };
});
const AdminStats = lazy(async () => {
  const m = await import("./pages/AdminStats");
  return { default: m.AdminStats };
});

function AdminFallback() {
  return (
    <div className="text-muted mx-auto max-w-lg px-4 py-10 text-sm" role="status">
      Loading…
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to={publicPagePath(PUBLIC_SLUG)} replace />} />
      <Route path="/p/:slug" element={<PublicPage />} />
      <Route path="/admin" element={<AdminLogin />} />
      <Route
        path="/admin/edit"
        element={
          <RequireAdmin>
            <Suspense fallback={<AdminFallback />}>
              <AdminEdit />
            </Suspense>
          </RequireAdmin>
        }
      />
      <Route
        path="/admin/share"
        element={
          <RequireAdmin>
            <Suspense fallback={<AdminFallback />}>
              <AdminShare />
            </Suspense>
          </RequireAdmin>
        }
      />
      <Route
        path="/admin/stats"
        element={
          <RequireAdmin>
            <Suspense fallback={<AdminFallback />}>
              <AdminStats />
            </Suspense>
          </RequireAdmin>
        }
      />
      <Route path="*" element={<Navigate to={publicPagePath(PUBLIC_SLUG)} replace />} />
    </Routes>
  );
}
