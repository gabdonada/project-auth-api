import {
    Body,
    Controller,
    Get,
    Post,
    UseGuards,
    Request,
} from '@nestjs/common';
import { CompanyService } from './company.service.js';
import { CreateCompanyDto } from './dto/create-company.dto.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { PermissionGuard } from '../auth/guards/permission.guard.js';
import { RequirePermission } from '../auth/decorators/require-permission.decorator.js';
import { CurrentUser } from '../auth/interfaces/current-user.interface.js';

@Controller('companies')
export class CompanyController {
    constructor(private readonly companyService: CompanyService) { }

    @Get()
    @UseGuards(JwtAuthGuard, PermissionGuard)
    @RequirePermission('COMPANY_VIEW')
    findAll(@Request() request: Request & { user: CurrentUser }) {
        return this.companyService.findAll(request.user);
    }

    @Post('createCompany')
    @UseGuards(JwtAuthGuard, PermissionGuard)
    @RequirePermission('COMPANY_CREATE')
    create(@Body() dto: CreateCompanyDto) {
        return this.companyService.createCompany(dto);
    }
}