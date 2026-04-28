"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

export function LoginForm(): React.JSX.Element {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const response = await fetch("/api/auth/login", {
      body: JSON.stringify({
        email: formData.get("email"),
        password: formData.get("password")
      }),
      headers: {
        "content-type": "application/json"
      },
      method: "POST"
    });

    setIsSubmitting(false);

    if (!response.ok) {
      setError("Invalid email or password");
      return;
    }

    router.replace("/dashboard");
    router.refresh();
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      <div className="space-y-2">
        <label className="block text-sm font-medium text-slate-800" htmlFor="email">
          Email
        </label>
        <input
          autoComplete="email"
          className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-200"
          id="email"
          name="email"
          required
          type="email"
        />
      </div>
      <div className="space-y-2">
        <label
          className="block text-sm font-medium text-slate-800"
          htmlFor="password"
        >
          Password
        </label>
        <input
          autoComplete="current-password"
          className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-200"
          id="password"
          name="password"
          required
          type="password"
        />
      </div>
      {error ? (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      ) : null}
      <button
        className="w-full rounded-md bg-slate-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
        disabled={isSubmitting}
        type="submit"
      >
        {isSubmitting ? "Signing in" : "Sign in"}
      </button>
    </form>
  );
}
