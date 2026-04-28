"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  addSupportTicketComment,
  createSupportTicket,
  parseAddSupportTicketCommentFormData,
  parseCreateSupportTicketFormData,
  parseSetSupportTicketStatusFormData,
  setSupportTicketStatus
} from "../../../features/support/support.service";
import { getRequiredSession } from "../../../lib/auth/server";

export async function createSupportTicketAction(
  formData: FormData
): Promise<void> {
  const session = await getRequiredSession();
  const input = parseCreateSupportTicketFormData(formData);
  const ticket = await createSupportTicket(session.user, input);

  revalidatePath("/support");
  redirect(`/support/${ticket.id}?created=1`);
}

export async function addSupportTicketCommentAction(
  formData: FormData
): Promise<void> {
  const session = await getRequiredSession();
  const input = parseAddSupportTicketCommentFormData(formData);

  await addSupportTicketComment(session.user, input);
  revalidateSupportPaths(input.ticketId);
  redirect(`/support/${input.ticketId}?commented=1`);
}

export async function setSupportTicketStatusAction(
  formData: FormData
): Promise<void> {
  const session = await getRequiredSession();
  const input = parseSetSupportTicketStatusFormData(formData);

  await setSupportTicketStatus(session.user, input);
  revalidateSupportPaths(input.ticketId);
  redirect(`/support/${input.ticketId}?updated=1`);
}

function revalidateSupportPaths(ticketId: string): void {
  revalidatePath("/support");
  revalidatePath(`/support/${ticketId}`);
}
