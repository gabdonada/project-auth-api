import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/client.js';

const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({ adapter });

async function main() {
    const permissions = [
        'COMPANY_VIEW',
        'COMPANY_EDIT',
        'COMPANY_CREATE',
        'USER_CREATE',
        'USER_EDIT',
        'USER_DISABLE',
        'WORKFLOW_VIEW',
        'WORKFLOW_EDIT',
    ];

    for (const permissionName of permissions) {
        await prisma.permission.upsert({
            where: { permissionName },
            update: {},
            create: { permissionName },
        });
    }

    console.log('Permissions seeded successfully.');

    let platformAdminRole = await prisma.role.findFirst({
        where: {
            roleName: 'PLATFORM_ADMIN',
            companyKey: null,
        },
    });

    if (!platformAdminRole) {
        platformAdminRole = await prisma.role.create({
            data: {
                roleName: 'PLATFORM_ADMIN',
            },
        });
    }

    console.log('Roles seeded successfully.');

    console.log('Roles seeded successfully.');

    const allPermissions = await prisma.permission.findMany();

    for (const permission of allPermissions) {
        await prisma.rolePermission.upsert({
            where: {
                roleKey_permissionKey: {
                    roleKey: platformAdminRole.roleKey,
                    permissionKey: permission.permissionKey,
                },
            },
            update: {},
            create: {
                roleKey: platformAdminRole.roleKey,
                permissionKey: permission.permissionKey,
            },
        });
    }

}

main()
    .catch((error) => {
        console.error(error);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());