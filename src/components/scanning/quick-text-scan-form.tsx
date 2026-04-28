"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import {
  ScanCostPreview,
  type UiScanMode
} from "../budgets/scan-cost-preview";

type QuickTextScanFormProps = {
  defaultTitle?: string;
  modeLabel: string;
  tenantOptions?: TenantOption[];
};

type TenantOption = {
  id: string;
  name: string;
  slug: string;
};

type CreateSubmissionResponse = {
  error?: string;
  submission?: {
    id: string;
  };
};

type ApiErrorResponse = {
  error?: string;
};

export function QuickTextScanForm({
  defaultTitle,
  modeLabel,
  tenantOptions = []
}: QuickTextScanFormProps): React.JSX.Element {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [scanMode, setScanMode] = useState<UiScanMode>("standard");
  const [text, setText] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const formData = new FormData(event.currentTarget);
    const title = String(formData.get("title") ?? "").trim();
    const text = String(formData.get("text") ?? "").trim();
    const tenantId = String(formData.get("tenantId") ?? "").trim();
    const selectedScanMode = parseScanMode(formData.get("scanMode"));

    if (!title || !text) {
      setError("Enter a title and text to scan.");
      return;
    }

    if (tenantOptions.length > 0 && !tenantId) {
      setError("Choose the tenant for this scan.");
      return;
    }

    setIsSubmitting(true);

    try {
      const created = await postJson<CreateSubmissionResponse>(
        "/api/submissions",
        tenantOptions.length > 0
          ? {
              tenantId,
              title
            }
          : {
              title
            }
      );

      if (!created.submission?.id) {
        setError(created.error ?? "Could not create the submission.");
        return;
      }

      const uploadForm = new FormData();
      uploadForm.append(
        "file",
        new File([text], `${buildSafeFilename(title)}.txt`, {
          type: "text/plain"
        })
      );

      await postForm(`/api/submissions/${created.submission.id}/upload`, uploadForm);
      await postJson<ApiErrorResponse>(
        `/api/submissions/${created.submission.id}/extract`,
        {}
      );
      await postJson<ApiErrorResponse>(
        `/api/submissions/${created.submission.id}/preprocess`,
        {}
      );
      await postJson<ApiErrorResponse>(
        `/api/submissions/${created.submission.id}/scan`,
        {
          scanMode: selectedScanMode
        }
      );

      router.push(`/submissions/${created.submission.id}`);
      router.refresh();
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Could not queue the scan."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label
            className="block text-sm font-medium text-slate-800"
            htmlFor={`${modeLabel}-title`}
          >
            Title
          </label>
          <input
            className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-200"
            defaultValue={defaultTitle}
            id={`${modeLabel}-title`}
            maxLength={200}
            name="title"
            required
            type="text"
          />
        </div>
        {tenantOptions.length > 0 ? (
          <div className="space-y-2">
            <label
              className="block text-sm font-medium text-slate-800"
              htmlFor={`${modeLabel}-tenant`}
            >
              Tenant
            </label>
            <select
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-200"
              id={`${modeLabel}-tenant`}
              name="tenantId"
              required
            >
              <option value="">Choose tenant</option>
              {tenantOptions.map((tenant) => (
                <option key={tenant.id} value={tenant.id}>
                  {tenant.name} ({tenant.slug})
                </option>
              ))}
            </select>
          </div>
        ) : null}
        <div className="grid grid-cols-3 gap-2 self-end">
          {["Bibliography", "Quotes", "Small matches"].map((label) => (
            <label
              className="flex min-h-10 items-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-xs font-medium text-slate-700"
              key={label}
            >
              <input
                className="h-4 w-4 rounded border-slate-300"
                defaultChecked
                name="exclusion"
                type="checkbox"
                value={label}
              />
              <span>{label}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <label
          className="block text-sm font-medium text-slate-800"
          htmlFor={`${modeLabel}-text`}
        >
          Paste text
        </label>
        <textarea
          className="min-h-56 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm leading-6 text-slate-950 outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-200"
          id={`${modeLabel}-text`}
          maxLength={12000}
          name="text"
          onChange={(event) => setText(event.currentTarget.value)}
          required
        />
      </div>

      <ScanModeSelector onChange={setScanMode} value={scanMode} />

      <ScanCostPreview
        charCount={text.length}
        scanMode={scanMode}
        wordCount={countWords(text)}
      />

      {error ? (
        <p
          className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
          role="alert"
        >
          {error}
        </p>
      ) : null}

      <button
        className="rounded-md bg-slate-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
        disabled={isSubmitting}
        type="submit"
      >
        {isSubmitting ? "Queuing scan" : `Start ${modeLabel}`}
      </button>
    </form>
  );
}

function ScanModeSelector({
  onChange,
  value
}: {
  onChange: (value: UiScanMode) => void;
  value: UiScanMode;
}): React.JSX.Element {
  return (
    <fieldset className="space-y-2">
      <legend className="text-sm font-medium text-slate-800">Scan mode</legend>
      <div className="grid gap-2 sm:grid-cols-3">
        {[
          ["standard", "Standard Check"],
          ["deep", "Deep Check"],
          ["fallback", "Local Fallback Check"]
        ].map(([mode, label]) => (
          <label
            className="flex items-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-700"
            key={mode}
          >
            <input
              checked={value === mode}
              className="h-4 w-4 border-slate-300"
              name="scanMode"
              onChange={() => onChange(mode as UiScanMode)}
              type="radio"
              value={mode}
            />
            <span>{label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

async function postJson<T>(
  url: string,
  body: Record<string, unknown>
): Promise<T> {
  const response = await fetch(url, {
    body: JSON.stringify(body),
    headers: {
      "content-type": "application/json"
    },
    method: "POST"
  });
  const parsed = (await response.json().catch(() => ({}))) as ApiErrorResponse;

  if (!response.ok) {
    throw new Error(parsed.error ?? "Request failed.");
  }

  return parsed as T;
}

async function postForm(url: string, body: FormData): Promise<void> {
  const response = await fetch(url, {
    body,
    method: "POST"
  });
  const parsed = (await response.json().catch(() => ({}))) as ApiErrorResponse;

  if (!response.ok) {
    throw new Error(parsed.error ?? "Request failed.");
  }
}

function buildSafeFilename(title: string): string {
  const safeTitle = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return safeTitle || "demo-text";
}

function countWords(value: string): number {
  return value.trim().split(/\s+/).filter(Boolean).length;
}

function parseScanMode(value: FormDataEntryValue | null): UiScanMode {
  return value === "deep" || value === "fallback" || value === "standard"
    ? value
    : "standard";
}
