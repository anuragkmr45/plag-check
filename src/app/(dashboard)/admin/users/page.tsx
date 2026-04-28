import {
  listManagedUsers,
  type ManagedUser,
  type ManagedUsersView,
  type ManagedUserRole
} from "../../../../features/users/user-management.service";
import { getRequiredSessionWithRole } from "../../../../lib/auth/server";
import { TENANT_ADMIN_ROLES } from "../../../../lib/rbac/roles";
import {
  createManagedUserAction,
  resetManagedUserPasswordAction,
  setManagedUserActiveAction,
  updateManagedUserRoleAction
} from "./actions";

type AdminUsersPageProps = {
  searchParams?: Promise<{
    created?: string;
    password_reset?: string;
    updated?: string;
  }>;
};

export default async function AdminUsersPage({
  searchParams
}: AdminUsersPageProps): Promise<React.JSX.Element> {
  const session = await getRequiredSessionWithRole(TENANT_ADMIN_ROLES);
  const managedUsers = await listManagedUsers(session.user);
  const params = searchParams ? await searchParams : {};
  const message = statusMessage(params);

  return (
    <section className="space-y-6">
      <div>
        <p className="text-sm font-medium text-slate-600">
          {managedUsers.scope.isGlobal ? "All tenants" : "Your tenant"}
        </p>
        <h1 className="mt-1 text-2xl font-semibold text-slate-950">
          User management
        </h1>
      </div>

      {message ? (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-900">
          {message}
        </div>
      ) : null}

      <CreateUserForm managedUsers={managedUsers} />
      <UserList users={managedUsers.users} />
    </section>
  );
}

function CreateUserForm({
  managedUsers
}: {
  managedUsers: ManagedUsersView;
}): React.JSX.Element {
  const canCreate = !managedUsers.scope.isGlobal || managedUsers.tenants.length > 0;

  return (
    <form
      action={createManagedUserAction}
      className="space-y-4 rounded-lg border border-slate-200 bg-white p-5"
    >
      <div>
        <h2 className="text-base font-semibold text-slate-950">Create user</h2>
      </div>
      <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-4">
        <Field label="Email" name="email">
          <input
            className={inputClassName}
            id="email"
            name="email"
            required
            type="email"
          />
        </Field>
        <Field label="Temporary password" name="password">
          <input
            className={inputClassName}
            id="password"
            minLength={8}
            name="password"
            required
            type="password"
          />
        </Field>
        <Field label="Role" name="role">
          <RoleSelect
            defaultRole="USER"
            id="role"
            name="role"
            roles={managedUsers.creatableRoles}
          />
        </Field>
        {managedUsers.scope.isGlobal ? (
          <Field label="Tenant" name="tenantId">
            <select
              className={inputClassName}
              disabled={!canCreate}
              id="tenantId"
              name="tenantId"
              required
            >
              <option value="">Select tenant</option>
              {managedUsers.tenants.map((tenant) => (
                <option key={tenant.id} value={tenant.id}>
                  {tenant.name}
                </option>
              ))}
            </select>
          </Field>
        ) : null}
      </div>
      <div className="flex justify-end">
        <button
          className="rounded-md bg-slate-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
          disabled={!canCreate}
          type="submit"
        >
          Create user
        </button>
      </div>
    </form>
  );
}

function UserList({ users }: { users: ManagedUser[] }): React.JSX.Element {
  if (users.length === 0) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-5">
        <p className="text-sm text-slate-600">No managed users are available.</p>
      </div>
    );
  }

  return (
    <section className="overflow-hidden rounded-lg border border-slate-200 bg-white">
      <div className="border-b border-slate-200 px-5 py-4">
        <h2 className="text-base font-semibold text-slate-950">Users</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-left text-xs font-semibold uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">User</th>
              <th className="px-4 py-3">Tenant</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Password</th>
              <th className="px-4 py-3">Active</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {users.map((user) => (
              <tr key={user.id}>
                <td className="px-4 py-4 align-top">
                  <p className="font-medium text-slate-950">{user.email}</p>
                  <p className="mt-1 text-xs text-slate-500">{user.id}</p>
                </td>
                <td className="px-4 py-4 align-top text-slate-600">
                  {user.tenantName}
                </td>
                <td className="px-4 py-4 align-top">
                  <form action={updateManagedUserRoleAction} className="flex gap-2">
                    <input name="userId" type="hidden" value={user.id} />
                    <RoleSelect
                      defaultRole={user.role}
                      id={`role-${user.id}`}
                      name="role"
                      roles={["INSTITUTION_ADMIN", "REVIEWER", "USER"]}
                    />
                    <button className={secondaryButtonClassName} type="submit">
                      Update
                    </button>
                  </form>
                </td>
                <td className="px-4 py-4 align-top">
                  <span
                    className={
                      user.isActive
                        ? "rounded-full bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700"
                        : "rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600"
                    }
                  >
                    {user.isActive ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="px-4 py-4 align-top">
                  <form
                    action={resetManagedUserPasswordAction}
                    className="flex min-w-72 gap-2"
                  >
                    <input name="userId" type="hidden" value={user.id} />
                    <input
                      aria-label={`New password for ${user.email}`}
                      className={inputClassName}
                      minLength={8}
                      name="password"
                      placeholder="New password"
                      required
                      type="password"
                    />
                    <button className={secondaryButtonClassName} type="submit">
                      Reset
                    </button>
                  </form>
                </td>
                <td className="px-4 py-4 align-top">
                  <form action={setManagedUserActiveAction}>
                    <input
                      name="isActive"
                      type="hidden"
                      value={String(!user.isActive)}
                    />
                    <input name="userId" type="hidden" value={user.id} />
                    <button className={secondaryButtonClassName} type="submit">
                      {user.isActive ? "Deactivate" : "Activate"}
                    </button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function Field({
  children,
  label,
  name
}: {
  children: React.ReactNode;
  label: string;
  name: string;
}): React.JSX.Element {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-slate-700" htmlFor={name}>
        {label}
      </label>
      {children}
    </div>
  );
}

function RoleSelect({
  defaultRole,
  id,
  name,
  roles
}: {
  defaultRole: ManagedUserRole;
  id: string;
  name: string;
  roles: readonly ManagedUserRole[];
}): React.JSX.Element {
  return (
    <select className={inputClassName} defaultValue={defaultRole} id={id} name={name}>
      {roles.map((role) => (
        <option key={role} value={role}>
          {formatRole(role)}
        </option>
      ))}
    </select>
  );
}

function formatRole(role: ManagedUserRole): string {
  return role
    .toLowerCase()
    .replaceAll("_", " ")
    .replace(/(^|\s)\S/g, (letter) => letter.toUpperCase());
}

function statusMessage(params: {
  created?: string;
  password_reset?: string;
  updated?: string;
}): string | null {
  if (params.created === "1") {
    return "User created.";
  }

  if (params.password_reset === "1") {
    return "Password reset.";
  }

  if (params.updated === "1") {
    return "User updated.";
  }

  return null;
}

const inputClassName =
  "w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200";

const secondaryButtonClassName =
  "rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50";
