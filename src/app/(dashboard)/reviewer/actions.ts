"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import {
  REVIEW_ACTION_STATUSES,
  addReviewCaseNote,
  assignReviewCaseToSelf,
  setReviewCaseStatus
} from "../../../features/review/review.service";
import { getRequiredSessionWithRole } from "../../../lib/auth/server";
import { REVIEW_ROLES } from "../../../lib/rbac/roles";

const caseIdSchema = z.string().uuid();
const noteFormSchema = z.object({
  caseId: caseIdSchema,
  comment: z.string().trim().min(1).max(2000)
});
const statusFormSchema = z.object({
  caseId: caseIdSchema,
  status: z.enum(REVIEW_ACTION_STATUSES)
});

export async function assignReviewCaseToSelfAction(
  formData: FormData
): Promise<void> {
  const session = await getRequiredSessionWithRole(REVIEW_ROLES);
  const caseId = parseCaseId(formData);

  await assignReviewCaseToSelf(session.user, caseId);
  revalidateReviewPaths(caseId);
  redirect(`/reviewer/cases/${caseId}`);
}

export async function addReviewCaseNoteAction(
  formData: FormData
): Promise<void> {
  const session = await getRequiredSessionWithRole(REVIEW_ROLES);
  const parsed = noteFormSchema.parse({
    caseId: stringField(formData, "caseId"),
    comment: stringField(formData, "comment")
  });

  await addReviewCaseNote(session.user, parsed.caseId, parsed.comment);
  revalidateReviewPaths(parsed.caseId);
  redirect(`/reviewer/cases/${parsed.caseId}`);
}

export async function setReviewCaseStatusAction(
  formData: FormData
): Promise<void> {
  const session = await getRequiredSessionWithRole(REVIEW_ROLES);
  const parsed = statusFormSchema.parse({
    caseId: stringField(formData, "caseId"),
    status: stringField(formData, "status")
  });

  await setReviewCaseStatus(session.user, parsed.caseId, parsed.status);
  revalidateReviewPaths(parsed.caseId);
  redirect(`/reviewer/cases/${parsed.caseId}`);
}

function parseCaseId(formData: FormData): string {
  return caseIdSchema.parse(stringField(formData, "caseId"));
}

function stringField(formData: FormData, name: string): string {
  const value = formData.get(name);

  return typeof value === "string" ? value : "";
}

function revalidateReviewPaths(caseId: string): void {
  revalidatePath("/reviewer/queue");
  revalidatePath(`/reviewer/cases/${caseId}`);
}
