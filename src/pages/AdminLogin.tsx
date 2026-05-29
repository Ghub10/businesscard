import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { Button } from "../components/Button";
import { TextField } from "../components/TextField";
import { ConfigError } from "../components/ConfigError";
import { setAdminPasswordInSession, useAdminPassword } from "../hooks/useAdminSession";
import { verifyAdminPassword } from "../lib/adminApi";
import { isSupabaseConfigured } from "../lib/env";

export function AdminLogin() {
  const navigate = useNavigate();
  const location = useLocation();
  const existing = useAdminPassword();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const from = (location.state as { from?: string } | null)?.from ?? "/admin/edit";

  const login = useMutation({
    mutationFn: () => verifyAdminPassword(password),
    onSuccess: (ok) => {
      if (!ok) {
        setError("That password is not correct.");
        return;
      }
      setAdminPasswordInSession(password);
      navigate(from, { replace: true });
    },
    onError: () => setError("Could not sign in. Check connection and try again."),
  });

  if (!isSupabaseConfigured()) return <ConfigError />;
  if (existing) return <Navigate to="/admin/edit" replace />;

  return (
    <main className="mx-auto max-w-md px-4 py-16">
      <h1 className="text-ink text-xl font-semibold">Owner sign-in</h1>
      <p className="text-muted mt-2 text-sm">Enter your admin password.</p>
      <form
        className="mt-8 flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          setError(null);
          login.mutate();
        }}
      >
        <TextField
          label="Password"
          name="password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        {error ? (
          <p className="text-danger text-sm" role="alert">
            {error}
          </p>
        ) : null}
        <Button type="submit" className="w-full" disabled={login.isPending}>
          {login.isPending ? "Continuing…" : "Continue"}
        </Button>
      </form>
    </main>
  );
}
