import {
    Body,
    Controller,
    Get,
    Post,
    UseGuards,
} from '@nestjs/common';
import { CompanyService } from './company.service.js';
import { CreateCompanyDto } from './dto/create-company.dto.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { PermissionGuard } from '../auth/guards/permission.guard.js';
import { RequirePermission } from '../auth/decorators/require-permission.decorator.js';

@Controller('companies')
export class CompanyController {
    constructor(private readonly companyService: CompanyService) { }

    @Get()
    @UseGuards(JwtAuthGuard, PermissionGuard)
    @RequirePermission('COMPANY_VIEW')
    findAll() {
        return this.companyService.findAll();
    }

    @Post()
    create(@Body() dto: CreateCompanyDto) {
        return this.companyService.createCompany(dto);
    }
}