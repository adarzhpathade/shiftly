"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { loginAction } from "@/server/auth/actions";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setFieldErrors({});
    setLoading(true);

    try {
      const result = await loginAction({ email, password });
      if (!result.ok) {
        setError(result.error);
        if (result.fieldErrors) {
          setFieldErrors(result.fieldErrors);
        }
        setLoading(false);
        return;
      }

      router.push("/");
      router.refresh();
    } catch {
      setError("An unexpected error occurred. Please try again.");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {error && (
        <div className="rounded-card bg-muted p-3 text-[14px] font-bold text-red">
          {error}
        </div>
      )}

      <div>
        <label
          htmlFor="email"
          className="mb-1.5 block text-[13px] font-bold text-ink"
        >
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
          className="w-full rounded-card border border-muted bg-paper px-4 py-3 text-ink placeholder:text-ink-soft focus:outline-none focus:ring-2 focus:ring-lav-ink"
          placeholder="name@company.com"
        />
        {fieldErrors.email && (
          <p className="mt-1 text-[13px] font-bold text-red">
            {fieldErrors.email}
          </p>
        )}
      </div>

      <div>
        <label
          htmlFor="password"
          className="mb-1.5 block text-[13px] font-bold text-ink"
        >
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="current-password"
          className="w-full rounded-card border border-muted bg-paper px-4 py-3 text-ink placeholder:text-ink-soft focus:outline-none focus:ring-2 focus:ring-lav-ink"
          placeholder="••••••••"
        />
        {fieldErrors.password && (
          <p className="mt-1 text-[13px] font-bold text-red">
            {fieldErrors.password}
          </p>
        )}
      </div>

      <Button
        type="submit"
        variant="ink"
        size="md"
        fullWidth
        disabled={loading}
        className="mt-2"
      >
        {loading ? "Signing in..." : "Sign In"}
      </Button>

      <p className="mt-2 text-center text-[14px] text-ink-soft">
        Don&apos;t have an account?{" "}
        <Link
          href="/register"
          className="font-extrabold text-lav-ink hover:underline"
        >
          Register
        </Link>
      </p>
    </form>
  );
}
