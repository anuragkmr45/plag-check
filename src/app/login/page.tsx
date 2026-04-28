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
    <main className="min-h-screen bg-slate-50 px-4 py-10 text-slate-950">
      <section className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-md flex-col justify-center">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold">Plagcheck</h1>
          <p className="mt-2 text-sm text-slate-600">
            Sign in with your institutional account.
          </p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <LoginForm />
        </div>
      </section>
    </main>
  );
}
