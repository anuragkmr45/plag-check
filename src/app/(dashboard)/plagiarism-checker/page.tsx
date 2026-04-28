import Link from "next/link";
import { QuickTextScanForm } from "../../../components/scanning/quick-text-scan-form";
import { SubmissionCreateUploadForm } from "../../../components/submissions/submission-create-upload-form";
import { listSubmissionCreateTenantOptions } from "../../../features/tenants/tenant-options.service";
import { getRequiredSession } from "../../../lib/auth/server";

export default async function PlagiarismCheckerPage(): Promise<React.JSX.Element> {
  const session = await getRequiredSession();
  const tenantOptions = await listSubmissionCreateTenantOptions(session.user);

  return (
    <CheckerPage
      accentClassName="border-l-emerald-500"
      defaultTitle="Demo plagiarism check"
      modeLabel="plagiarism check"
      secondaryHref="/ai-detector"
      secondaryLabel="AI detector"
      summary={[
        "Web-source matching through Tavily when configured.",
        "OpenAlex academic metadata discovery in the final report.",
        "Mock and heuristic fallback keep the report available."
      ]}
      title="Plagiarism checker"
      tenantOptions={tenantOptions}
    />
  );
}

function CheckerPage({
  accentClassName,
  defaultTitle,
  modeLabel,
  secondaryHref,
  secondaryLabel,
  summary,
  tenantOptions,
  title
}: {
  accentClassName: string;
  defaultTitle: string;
  modeLabel: string;
  secondaryHref: string;
  secondaryLabel: string;
  summary: string[];
  tenantOptions: Array<{
    id: string;
    name: string;
    slug: string;
  }>;
  title: string;
}): React.JSX.Element {
  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-600">Demo checker</p>
          <h1 className="mt-1 text-2xl font-semibold text-slate-950">
            {title}
          </h1>
          <p className="mt-1 max-w-3xl text-sm text-slate-600">
            Results are review-support indicators and remain separate from AI
            and grammar evidence.
          </p>
        </div>
        <Link
          className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-800 transition hover:bg-slate-50"
          href={secondaryHref}
        >
          {secondaryLabel}
        </Link>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_420px]">
        <section
          className={`rounded-lg border border-l-4 border-slate-200 bg-white p-5 ${accentClassName}`}
        >
          <div className="mb-5">
            <h2 className="text-base font-semibold text-slate-950">
              Paste text
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              The scan queues the full report pipeline for this focused view.
            </p>
          </div>
          <QuickTextScanForm
            defaultTitle={defaultTitle}
            modeLabel={modeLabel}
            tenantOptions={tenantOptions}
          />
        </section>

        <aside className="space-y-4">
          <section className="rounded-lg border border-slate-200 bg-white p-5">
            <h2 className="text-base font-semibold text-slate-950">
              Demo signals
            </h2>
            <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-slate-600">
              {summary.map((item) => (
                <li key={item}>{item}</li>
              ))}
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
