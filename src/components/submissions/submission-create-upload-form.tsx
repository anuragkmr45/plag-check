"use client";

import { useRouter } from "next/navigation";
import {
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
  type FormEvent
} from "react";

type CreateSubmissionResponse = {
  submission?: {
    id: string;
  };
  error?: string;
};

type UploadResponse = {
  error?: string;
};

type TenantOption = {
  id: string;
  name: string;
  slug: string;
};

type SubmissionCreateUploadFormProps = {
  tenantOptions?: TenantOption[];
};

const acceptedFileTypes = [
  ".pdf",
  ".doc",
  ".docx",
  ".txt",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain"
].join(",");

export function SubmissionCreateUploadForm({
  tenantOptions = []
}: SubmissionCreateUploadFormProps): React.JSX.Element {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    setFile(event.target.files?.[0] ?? null);
  }

  function handleDragOver(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    setIsDragging(true);
  }

  function handleDragLeave() {
    setIsDragging(false);
  }

  function handleDrop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    setIsDragging(false);

    const droppedFile = event.dataTransfer.files.item(0);
    setFile(droppedFile);

    if (fileInputRef.current) {
      fileInputRef.current.files = event.dataTransfer.files;
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!file) {
      setError("Choose a PDF, DOC, DOCX, or TXT file.");
      return;
    }

    const formData = new FormData(event.currentTarget);
    const title = String(formData.get("title") ?? "").trim();
    const tenantId = String(formData.get("tenantId") ?? "").trim();

    if (!title) {
      setError("Enter a submission title.");
      return;
    }

    if (tenantOptions.length > 0 && !tenantId) {
      setError("Choose the institution workspace for this submission.");
      return;
    }

    setIsSubmitting(true);

    try {
      const createBody =
        tenantOptions.length > 0
          ? {
              tenantId,
              title
            }
          : {
              title
            };
      const createResponse = await fetch("/api/submissions", {
        body: JSON.stringify(createBody),
        headers: {
          "content-type": "application/json"
        },
        method: "POST"
      });
      const created = (await createResponse.json().catch(() => ({}))) as
        | CreateSubmissionResponse
        | Record<string, never>;

      if (!createResponse.ok || !created.submission?.id) {
        setError(created.error ?? "Could not create the submission.");
        return;
      }

      const uploadForm = new FormData();
      uploadForm.append("file", file);

      const uploadResponse = await fetch(
        `/api/submissions/${created.submission.id}/upload`,
        {
          body: uploadForm,
          method: "POST"
        }
      );
      const uploaded = (await uploadResponse.json().catch(() => ({}))) as
        | UploadResponse
        | Record<string, never>;

      if (!uploadResponse.ok) {
        setError(uploaded.error ?? "Could not upload the file.");
        return;
      }

      router.push(`/submissions/${created.submission.id}`);
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form
      aria-describedby={error ? "submission-form-error" : undefined}
      className="space-y-6"
      onSubmit={handleSubmit}
    >
      <div className="space-y-2">
        <label
          className="block text-sm font-medium text-slate-800"
          htmlFor="title"
        >
          Submission title
        </label>
        <input
          className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-200"
          id="title"
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
            htmlFor="tenantId"
          >
            Institution / Tenant
          </label>
          <select
            className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-200"
            id="tenantId"
            name="tenantId"
            required
          >
            <option value="">Choose institution / tenant</option>
            {tenantOptions.map((tenant) => (
              <option key={tenant.id} value={tenant.id}>
                {tenant.name} ({tenant.slug})
              </option>
            ))}
          </select>
          <p className="text-xs text-slate-600">
            Super admins choose the institution workspace; tenant admins and
            users use their own institution automatically.
          </p>
        </div>
      ) : null}

      <div className="space-y-2">
        <label
          className={`block rounded-lg border border-dashed px-5 py-8 text-center transition ${
            isDragging
              ? "border-slate-900 bg-slate-100"
              : "border-slate-300 bg-white hover:border-slate-500"
          }`}
          htmlFor="file"
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          <span className="block text-sm font-medium text-slate-900">
            Upload document
          </span>
          <span className="mt-2 block text-sm text-slate-600">
            Drop a PDF, DOC, DOCX, or TXT file here, or open the file picker.
          </span>
          <span className="mt-3 block text-sm font-medium text-slate-800">
            {file ? file.name : "No file selected"}
          </span>
        </label>
        <input
          accept={acceptedFileTypes}
          className="sr-only"
          id="file"
          name="file"
          onChange={handleFileChange}
          ref={fileInputRef}
          required
          type="file"
        />
      </div>

      {error ? (
        <p
          className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
          id="submission-form-error"
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
        {isSubmitting ? "Creating submission" : "Create and upload"}
      </button>
    </form>
  );
}
