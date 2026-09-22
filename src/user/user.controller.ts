import { Body, Controller, Post, Request, UseGuards } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto.js';
import { UserService } from './user.service.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { PermissionGuard } from '../auth/guards/permission.guard.js';
import { RequirePermission } from '../auth/decorators/require-permission.decorator.js';
import { CurrentUser } from '../auth/interfaces/current-user.interface.js';

@Controller('createUser')
export class UserController {
    constructor(private readonly userService: UserService) { }

    @Post('createUser')
    @UseGuards(JwtAuthGuard, PermissionGuard)
    @RequirePermission('USER_CREATE')
    createUser(
        @Body() dto: CreateUserDto,
        @Request() request: Request & { user: CurrentUser },
    ) {
        return this.userService.createUser(dto, request.user);
    }
}