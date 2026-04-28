import { getRequiredSessionWithRole } from "../../../lib/auth/server";
import { REVIEW_ROLES } from "../../../lib/rbac/roles";

export default async function ReviewerLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>): Promise<React.JSX.Element> {
  await getRequiredSessionWithRole(REVIEW_ROLES);

  return <>{children}</>;
}
