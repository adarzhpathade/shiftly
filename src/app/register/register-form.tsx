"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { registerAction } from "@/server/auth/actions";

export interface RegisterFormProps {
  teams: { id: string; name: string }[];
}

export function RegisterForm({ teams }: RegisterFormProps) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [teamId, setTeamId] = useState(teams[0]?.id ?? "");
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setFieldErrors({});
    setLoading(true);

    try {
      const result = await registerAction({ name, email, password, teamId });
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
          htmlFor="name"
          className="mb-1.5 block text-[13px] font-bold text-ink"
        >
          Full Name
        </label>
        <input
          id="name"
          name="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          autoComplete="name"
          className="w-full rounded-card border border-muted bg-paper px-4 py-3 text-ink placeholder:text-ink-soft focus:outline-none focus:ring-2 focus:ring-lav-ink"
          placeholder="Aarohi Joshi"
        />
        {fieldErrors.name && (
          <p className="mt-1 text-[13px] font-bold text-red">
            {fieldErrors.name}
          </p>
        )}
      </div>

      <div>
        <label
          htmlFor="email"
          className="mb-1.5 block text-[13px] font-bold text-ink"
        >
          Work Email
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
          placeholder="aarohi@shiftly.demo"
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
          Password (min 8 chars)
        </label>
        <input
          id="password"
          name="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="new-password"
          className="w-full rounded-card border border-muted bg-paper px-4 py-3 text-ink placeholder:text-ink-soft focus:outline-none focus:ring-2 focus:ring-lav-ink"
          placeholder="••••••••"
        />
        {fieldErrors.password && (
          <p className="mt-1 text-[13px] font-bold text-red">
            {fieldErrors.password}
          </p>
        )}
      </div>

      <div>
        <label
          htmlFor="teamId"
          className="mb-1.5 block text-[13px] font-bold text-ink"
        >
          Team
        </label>
        <select
          id="teamId"
          name="teamId"
          value={teamId}
          onChange={(e) => setTeamId(e.target.value)}
          required
          className="w-full rounded-card border border-muted bg-paper px-4 py-3 text-ink focus:outline-none focus:ring-2 focus:ring-lav-ink"
        >
          {teams.length === 0 && <option value="">No teams available</option>}
          {teams.map((team) => (
            <option key={team.id} value={team.id}>
              {team.name}
            </option>
          ))}
        </select>
        {fieldErrors.teamId && (
          <p className="mt-1 text-[13px] font-bold text-red">
            {fieldErrors.teamId}
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
        {loading ? "Creating account..." : "Register"}
      </Button>

      <p className="mt-2 text-center text-[14px] text-ink-soft">
        Already have an account?{" "}
        <Link
          href="/login"
          className="font-extrabold text-lav-ink hover:underline"
        >
          Sign In
        </Link>
      </p>
    </form>
  );
}
