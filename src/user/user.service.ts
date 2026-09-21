import { Injectable, NotFoundException } from '@nestjs/common';
import * as argon2 from 'argon2';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateUserDto } from './dto/create-user.dto.js';

@Injectable()
export class UserService {
    constructor(private readonly prisma: PrismaService) { }

    async createUser(dto: CreateUserDto) {
        const company = await this.prisma.company.findUnique({
            where: {
                companyUuid: dto.companyUuid,
            },
        });

        if (!company) {
            throw new NotFoundException('Company not found');
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
}