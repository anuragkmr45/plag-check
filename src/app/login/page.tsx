import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { LoginForm } from "../../components/auth/login-form";
import { getCurrentUserFromRequest } from "../../server/services/auth.service";

export default async function LoginPage(): Promise<React.JSX.Element> {
  const session = await getCurrentUserFromRequest({
    headers: await headers()
  });

  if (session) {
    redirect("/dashboard");
  }

  return (
    <main className="pc-app-bg min-h-screen px-4 py-10 text-slate-950">
      <section className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-md flex-col justify-center">
        <div className="mb-8 rounded-lg border border-teal-900/10 bg-white/45 p-5 shadow-sm">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-md bg-teal-900 text-sm font-semibold text-white">
            P
          </span>
          <h1 className="mt-4 text-2xl font-semibold text-teal-950">
            Plagcheck
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Sign in with your institutional account.
          </p>
        </div>
        <div className="pc-panel rounded-lg border p-6">
          <LoginForm />
        </div>
      </section>
    </main>
  );
}
