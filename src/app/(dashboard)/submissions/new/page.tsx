import Link from "next/link";
import { SubmissionCreateUploadForm } from "../../../../components/submissions/submission-create-upload-form";
import { listSubmissionCreateTenantOptions } from "../../../../features/tenants/tenant-options.service";
import { getRequiredSession } from "../../../../lib/auth/server";

export default async function NewSubmissionPage(): Promise<React.JSX.Element> {
  const session = await getRequiredSession();
  const tenantOptions = await listSubmissionCreateTenantOptions(session.user);

  return (
    <section className="mx-auto max-w-3xl space-y-6">
      <div className="space-y-2">
        <Link
          className="text-sm font-medium text-slate-700 underline-offset-4 hover:text-slate-950 hover:underline"
          href="/submissions"
        >
          Back to submissions
        </Link>
        <h1 className="text-2xl font-semibold text-slate-950">
          New submission
        </h1>
        <p className="text-sm text-slate-600">
          Add a title and upload one supported document.
        </p>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-5">
        <SubmissionCreateUploadForm tenantOptions={tenantOptions} />
      </div>
    </section>
  );
}
