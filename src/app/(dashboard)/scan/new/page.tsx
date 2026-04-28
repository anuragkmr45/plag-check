import Link from "next/link";
import { QuickTextScanForm } from "../../../../components/scanning/quick-text-scan-form";
import { SubmissionCreateUploadForm } from "../../../../components/submissions/submission-create-upload-form";
import { listSubmissionCreateTenantOptions } from "../../../../features/tenants/tenant-options.service";
import { getRequiredSession } from "../../../../lib/auth/server";

const checkTypes = [
  "Full Originality Report",
  "Plagiarism",
  "AI Detector",
  "Grammar"
] as const;

export default async function NewScanPage(): Promise<React.JSX.Element> {
  const session = await getRequiredSession();
  const tenantOptions = await listSubmissionCreateTenantOptions(session.user);

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-600">New check</p>
          <h1 className="mt-1 text-2xl font-semibold text-slate-950">
            Start originality analysis
          </h1>
          <p className="mt-1 max-w-3xl text-sm text-slate-600">
            Queue a full scan that separates similarity evidence, AI-writing
            indicators, academic metadata, and grammar findings.
          </p>
        </div>
        <Link
          className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-800 transition hover:bg-slate-50"
          href="/submissions"
        >
          View submissions
        </Link>
      </div>

      <ol className="grid gap-3 md:grid-cols-4">
        {checkTypes.map((type, index) => (
          <li
            className="rounded-lg border border-slate-200 bg-white p-4"
            key={type}
          >
            <p className="text-xs font-medium uppercase text-slate-500">
              Step {index + 1}
            </p>
            <h2 className="mt-2 text-sm font-semibold text-slate-950">
              {type}
            </h2>
          </li>
        ))}
      </ol>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_420px]">
        <section className="rounded-lg border border-slate-200 bg-white p-5">
          <div className="mb-5">
            <h2 className="text-base font-semibold text-slate-950">
              Paste text
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              The scan is queued after text extraction and preprocessing.
            </p>
          </div>
          <QuickTextScanForm
            defaultTitle="Demo originality check"
            modeLabel="full scan"
            tenantOptions={tenantOptions}
          />
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-5">
          <div className="mb-5">
            <h2 className="text-base font-semibold text-slate-950">
              Upload file
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              PDF, DOC, DOCX, and TXT are supported.
            </p>
          </div>
          <SubmissionCreateUploadForm tenantOptions={tenantOptions} />
        </section>
      </div>
    </section>
  );
}
