import { PrismaClient, Rider, RiderPermission, ProjectPermission } from '@prisma/client';

const prisma = new PrismaClient();

export const checkRiderPermission = async (
  rider: Rider & { permissions?: RiderPermission[] },
  userEmail: string,
  requiredPermissions: string[]
): Promise<boolean> => {
  // Owner has full access
  const owner = await prisma.user.findUnique({
    where: { id: rider.ownerId }
  });
  
  if (owner && owner.email === userEmail) {
    return true;
  }

  // Check rider-level permissions
  const riderPerms = rider.permissions || await prisma.riderPermission.findMany({
    where: { riderId: rider.id, email: userEmail }
  });

  for (const perm of riderPerms) {
    if (requiredPermissions.includes(perm.permission)) {
      return true;
    }
  }

  // Check project-level permissions (if rider belongs to a project)
  if (rider.projectId) {
    const projectPerms = await prisma.projectPermission.findMany({
      where: { projectId: rider.projectId, email: userEmail }
    });

    for (const perm of projectPerms) {
      if (requiredPermissions.includes(perm.permission)) {
        return true;
      }
      // 'edit' project permission grants 'comment' on riders
      if (perm.permission === 'edit' && requiredPermissions.includes('comment')) {
        return true;
      }
    }
  }

  return false;
};

