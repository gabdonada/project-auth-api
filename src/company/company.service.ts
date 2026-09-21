import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateCompanyDto } from './dto/create-company.dto.js';

@Injectable()
export class CompanyService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.company.findMany();
  }

  async createCompany(dto: CreateCompanyDto) {
    const companyUuid = crypto.randomUUID();

    return this.prisma.$transaction(async (tx) => {
      const company = await tx.company.create({
        data: {
          companyUuid,
          companyName: dto.companyName,
          databaseName: `company_${companyUuid}`,
        },
      });

      const roles = await tx.role.createManyAndReturn({
        data: [
          {
            roleName: 'COMPANY_ADMIN',
            companyKey: company.companyKey,
          },
          {
            roleName: 'USER',
            companyKey: company.companyKey,
          },
        ],
      });

      const companyAdminRole = roles.find(
        (role) => role.roleName === 'COMPANY_ADMIN',
      );

      if (!companyAdminRole) {
        throw new Error('COMPANY_ADMIN role was not created');
      }

      const permissions = await tx.permission.findMany();

      await tx.rolePermission.createMany({
        data: permissions.map((permission) => ({
          roleKey: companyAdminRole.roleKey,
          permissionKey: permission.permissionKey,
        })),
      });

      return company;
    });
  }
}