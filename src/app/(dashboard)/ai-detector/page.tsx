import Link from "next/link";
import { QuickTextScanForm } from "../../../components/scanning/quick-text-scan-form";
import { SubmissionCreateUploadForm } from "../../../components/submissions/submission-create-upload-form";
import { listSubmissionCreateTenantOptions } from "../../../features/tenants/tenant-options.service";
import { getRequiredSession } from "../../../lib/auth/server";

export default async function AiDetectorPage(): Promise<React.JSX.Element> {
  const session = await getRequiredSession();
  const tenantOptions = await listSubmissionCreateTenantOptions(session.user);

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-600">Demo checker</p>
          <h1 className="mt-1 text-2xl font-semibold text-slate-950">
            AI detector
          </h1>
          <p className="mt-1 max-w-3xl text-sm text-slate-600">
            AI-content likelihood is reported separately from similarity
            evidence and must be reviewed by a person.
          </p>
        </div>
        <Link
          className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-800 transition hover:bg-slate-50"
          href="/grammar-checker"
        >
          Grammar checker
        </Link>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_420px]">
        <section className="rounded-lg border border-l-4 border-sky-500 bg-white p-5">
          <div className="mb-5">
            <h2 className="text-base font-semibold text-slate-950">
              Paste text
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Gemini is used when configured; otherwise the heuristic fallback
              records fallback metadata.
            </p>
          </div>
          <QuickTextScanForm
            defaultTitle="Demo AI detector check"
            modeLabel="AI check"
            tenantOptions={tenantOptions}
          />
        </section>

        <aside className="space-y-4">
          <section className="rounded-lg border border-slate-200 bg-white p-5">
            <h2 className="text-base font-semibold text-slate-950">
              AI evidence shown
            </h2>
            <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-slate-600">
              <li>AI probability and confidence band.</li>
              <li>Sentence-level assessments and writing pattern notes.</li>
              <li>Fallback indicators if Gemini is unavailable.</li>
            </ul>
          </section>
          <section className="rounded-lg border border-slate-200 bg-white p-5">
            <h2 className="text-base font-semibold text-slate-950">
              Upload document
            </h2>
            <div className="mt-4">
              <SubmissionCreateUploadForm tenantOptions={tenantOptions} />
            </div>
          </section>
        </aside>
      </div>
    </section>
  );
}
