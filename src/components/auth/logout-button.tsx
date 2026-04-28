"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function LogoutButton(): React.JSX.Element {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleLogout() {
    setIsSubmitting(true);
    await fetch("/api/auth/logout", {
      method: "POST"
    });
    router.replace("/login");
    router.refresh();
  }

  return (
    <button
      className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
      disabled={isSubmitting}
      onClick={handleLogout}
      type="button"
    >
      {isSubmitting ? "Signing out" : "Sign out"}
    </button>
  );
}
