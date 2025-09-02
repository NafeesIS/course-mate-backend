import UserRoles from 'supertokens-node/recipe/userroles';

export async function addRoleToUser(userId: string, role: string) {
  const response = await UserRoles.addRoleToUser('public', userId, role);

  if (response.status === 'UNKNOWN_ROLE_ERROR') {
    return;
  }

  if (response.didUserAlreadyHaveRole === true) {
    // The user already had the role
    console.log('User already had the role');
    return;
  }
}

export async function getRolesForUser(userId: string) {
  const response = await UserRoles.getRolesForUser('public', userId);
  const roles: string[] = response.roles;

  return roles;
}
