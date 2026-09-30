import { Body, Controller, Get, Param, Patch, Post, Request, UseGuards } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto.js';
import { UserService } from './user.service.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { PermissionGuard } from '../auth/guards/permission.guard.js';
import { RequirePermission } from '../auth/decorators/require-permission.decorator.js';
import { CurrentUser } from '../auth/interfaces/current-user.interface.js';
import { UpdateUserDto } from './dto/update-user.dto.js';
import { UpdateUserRoleDto } from './dto/update-user-role.dto.js';

@Controller('users')
export class UserController {
    constructor(private readonly userService: UserService) { }

    @Post()
    @UseGuards(JwtAuthGuard, PermissionGuard)
    @RequirePermission('USER_CREATE')
    createUser(
        @Body() dto: CreateUserDto,
        @Request() request: Request & { user: CurrentUser },
    ) {
        return this.userService.createUser(dto, request.user);
    }

    @Get()
    @UseGuards(JwtAuthGuard, PermissionGuard)
    @RequirePermission('USER_VIEW')
    findAll(@Request() request: Request & { user: CurrentUser }) {
        return this.userService.findAll(request.user);
    }

    @Get('roles')
    @UseGuards(JwtAuthGuard, PermissionGuard)
    @RequirePermission('USER_ROLE_EDIT')
    findAvailableRoles(
        @Request() request: Request & { user: CurrentUser },
    ) {
        return this.userService.findAvailableRoles(request.user);
    }

    @Get(':userKey/roles')
    @UseGuards(JwtAuthGuard, PermissionGuard)
    @RequirePermission('USER_ROLE_EDIT')
    findRoles(
        @Param('userKey') userKey: string,
        @Request() request: Request & { user: CurrentUser },
    ) {
        return this.userService.findRoles(userKey, request.user);
    }

    @Get(':userKey')
    @UseGuards(JwtAuthGuard, PermissionGuard)
    @RequirePermission('USER_VIEW')
    findOne(@Param('userKey') userKey: string, @Request() request: Request & { user: CurrentUser }) {
        return this.userService.findOne(userKey, request.user);
    }

    @Patch(':userKey')
    @UseGuards(JwtAuthGuard, PermissionGuard)
    @RequirePermission('USER_EDIT')
    updateUser(@Param('userKey') userKey: string, @Body() dto: UpdateUserDto, @Request() request: Request & { user: CurrentUser }) {
        return this.userService.updateUser(userKey, dto, request.user);
    }

    @Patch(':userKey/disable')
    @UseGuards(JwtAuthGuard, PermissionGuard)
    @RequirePermission('USER_DISABLE') disableUser(
        @Param('userKey') userKey: string,
        @Request() request: Request & { user: CurrentUser },
    ) {
        return this.userService.disableUser(userKey, request.user);
    }

    @Post(':userKey/roles')
    @UseGuards(JwtAuthGuard, PermissionGuard)
    @RequirePermission('USER_ROLE_EDIT')
    assignRole(
        @Param('userKey') userKey: string,
        @Body() dto: UpdateUserRoleDto,
        @Request() request: Request & { user: CurrentUser },
    ) {
        return this.userService.assignRole(userKey, dto, request.user);
    }
}