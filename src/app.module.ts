import { Module } from '@nestjs/common';
import { CompanyModule } from './company/company.module.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { UserModule } from './user/user.module.js';
import { AuthModule } from './auth/auth.module.js';

@Module({
  imports: [PrismaModule, CompanyModule, UserModule, AuthModule],
})
export class AppModule {}