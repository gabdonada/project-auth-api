import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import * as argon2 from 'argon2';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateUserDto } from './dto/create-user.dto.js';
import { UpdateUserDto } from './dto/update-user.dto.js';
import { UpdateUserRoleDto } from './dto/update-user-role.dto.js';

@Injectable()
export class UserService {
    constructor(private readonly prisma: PrismaService) { }

    async createUser(dto: CreateUserDto, currentUser: { userKey: string; companyKey: number | null }) {
        const company = await this.prisma.company.findUnique({
            where: {
                companyUuid: dto.companyUuid,
            },
        });

        if (!company) {
            throw new NotFoundException('Company not found');
        }

        if (currentUser.companyKey !== null && currentUser.companyKey !== company.companyKey) {
            throw new ForbiddenException(
                'You cannot create users for another company',
            );
        }

        const existingUser = await this.prisma.user.findFirst({
            where: {
                companyKey: company.companyKey,
                email: dto.email,
            },
        });

        if (existingUser) {
            throw new ConflictException('A user with this email already exists in this company');
        }

        const passwordHash = await argon2.hash(dto.password);

        return this.prisma.$transaction(async (tx) => {
            const user = await tx.user.create({
                data: {
                    companyKey: company.companyKey,
                    email: dto.email,
                    passwordHash,
                },
                select: {
                    userKey: true,
                    companyKey: true,
                    email: true,
                    emailVerified: true,
                    userStatus: true,
                    createdAt: true,
                },
            });

            const userRole = await tx.role.findFirst({
                where: {
                    companyKey: company.companyKey,
                    roleName: 'USER',
                },
            });

            if (!userRole) {
                throw new Error('USER role was not found for company');
            }

            await tx.userRole.create({
                data: {
                    userKey: user.userKey,
                    roleKey: userRole.roleKey,
                },
            });

            return user;
        });
    }

    async findAll(currentUser: { userKey: string; companyKey: number | null }) {
        if (currentUser.companyKey === null) {
            return this.prisma.user.findMany({
                select: {
                    userKey: true,
                    companyKey: true,
                    email: true,
                    emailVerified: true,
                    userStatus: true,
                    createdAt: true,
                },
            });
        }

        return this.prisma.user.findMany({
            where: {
                companyKey: currentUser.companyKey,
            },
            select: {
                userKey: true,
                companyKey: true,
                email: true,
                emailVerified: true,
                userStatus: true,
                createdAt: true,
            },
        });
    }

    async findOne(userKey: string, currentUser: { userKey: string; companyKey: number | null }) {
        const user = await this.prisma.user.findUnique({
            where: {
                userKey,
            },
            select: {
                userKey: true,
                companyKey: true,
                email: true,
                emailVerified: true,
                userStatus: true,
                createdAt: true,
            },
        });

        if (!user) {
            throw new NotFoundException('User not found');
        }

        if (
            currentUser.companyKey !== null &&
            currentUser.companyKey !== user.companyKey
        ) {
            throw new ForbiddenException(
                'You cannot access users from another company',
            );
        }

        return user;
    }

    async updateUser(userKey: string, dto: UpdateUserDto, currentUser: { userKey: string; companyKey: number | null }) {
        const user = await this.prisma.user.findUnique({
            where: {
                userKey,
            },
        });

        if (!user) {
            throw new NotFoundException('User not found');
        }

        if (currentUser.companyKey !== null && currentUser.companyKey !== user.companyKey) {
            throw new ForbiddenException(
                'You cannot edit users from another company',
            );
        }

        return this.prisma.user.update({
            where: {
                userKey,
            },
            data: dto,
            select: {
                userKey: true,
                companyKey: true,
                email: true,
                emailVerified: true,
                userStatus: true,
                createdAt: true,
            },
        });
    }

    async disableUser(userKey: string, currentUser: { userKey: string; companyKey: number | null }) {
        const user = await this.prisma.user.findUnique({
            where: {
                userKey,
            },
        });

        if (!user) {
            throw new NotFoundException('User not found');
        }

        if (currentUser.companyKey !== null && currentUser.companyKey !== user.companyKey) {
            throw new ForbiddenException(
                'You cannot disable users from another company',
            );
        }

        return this.prisma.user.update({
            where: {
                userKey,
            },
            data: {
                userStatus: 'DISABLED',
            },
            select: {
                userKey: true,
                companyKey: true,
                email: true,
                emailVerified: true,
                userStatus: true,
                createdAt: true,
            },
        });
    }

    async assignRole(userKey: string, dto: UpdateUserRoleDto, currentUser: { userKey: string; companyKey: number | null }) {
        const user = await this.prisma.user.findUnique({
            where: {
                userKey,
            },
        });

        if (!user) {
            throw new NotFoundException('User not found');
        }

        if (currentUser.companyKey !== null && currentUser.companyKey !== user.companyKey) {
            throw new ForbiddenException(
                'You cannot manage roles for users from another company',
            );
        }

        const role = await this.prisma.role.findUnique({
            where: {
                roleKey: dto.roleKey,
            },
        });

        if (!role) {
            throw new NotFoundException('Role not found');
        }

        if (currentUser.companyKey !== null && role.companyKey !== currentUser.companyKey) {
            throw new ForbiddenException(
                'You cannot assign a role from another company',
            );
        }

        const existingUserRole = await this.prisma.userRole.findUnique({
            where: {
                userKey_roleKey: {
                    userKey,
                    roleKey: role.roleKey,
                },
            },
        });

        if (existingUserRole) {
            throw new ConflictException('User already has this role');
        }

        await this.prisma.userRole.create({
            data: {
                userKey,
                roleKey: role.roleKey,
            },
        });

        return {
            userKey,
            roleKey: role.roleKey,
        };
    }

    async findRoles(userKey: string, currentUser: { userKey: string; companyKey: number | null }) {
        const user = await this.prisma.user.findUnique({
            where: {
                userKey,
            },
        });

        if (!user) {
            throw new NotFoundException('User not found');
        }

        if (currentUser.companyKey !== null && currentUser.companyKey !== user.companyKey) {
            throw new ForbiddenException(
                'You cannot view roles for users from another company',
            );
        }

        return this.prisma.userRole.findMany({
            where: {
                userKey,
            },
            select: {
                role: {
                    select: {
                        roleKey: true,
                        roleName: true,
                        companyKey: true,
                    },
                },
            },
        });
    }

    async findAvailableRoles(currentUser: { userKey: string; companyKey: number | null }) {
        if (currentUser.companyKey === null) {
            return this.prisma.role.findMany({
                select: {
                    roleKey: true,
                    roleName: true,
                    companyKey: true,
                },
            });
        }

        return this.prisma.role.findMany({
            where: {
                companyKey: currentUser.companyKey,
            },
            select: {
                roleKey: true,
                roleName: true,
                companyKey: true,
            },
        });
    }
}