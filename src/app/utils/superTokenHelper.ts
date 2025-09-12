import UserRoles from "supertokens-node/recipe/userroles";

export async function addRoleToUser(userId: string, role: string) {
  const response = await UserRoles.addRoleToUser("public", userId, role);

  if (response.status === "UNKNOWN_ROLE_ERROR") {
    await UserRoles.createNewRoleOrAddPermissions(role, []);
    return addRoleToUser(userId, role); // retry after role creation
  }

  if (response.status === "OK") {
    if (response.didUserAlreadyHaveRole) {
      console.log("User already had the role");
      return true;
    }
    console.log("Role added successfully");
    return true;
  }

  return false;
}

export async function getRolesForUser(userId: string) {
  const response = await UserRoles.getRolesForUser("public", userId);
  return response.roles; // string[]
}

export async function removeRoleFromUser(userId: string, role: string) {
  const response = await UserRoles.removeUserRole("public", userId, role);

  if (response.status === "UNKNOWN_ROLE_ERROR") {
    console.log("Unknown role error");
    return false;
  }

  if (response.status === "OK" && !response.didUserHaveRole) {
    console.log("User did not have the role");
    return false;
  }

  console.log("Role removed successfully");
  return true;
}
