import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import * as argon2 from 'argon2';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateUserDto } from './dto/create-user.dto.js';
import { UpdateUserDto } from './dto/update-user.dto.js';

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
}