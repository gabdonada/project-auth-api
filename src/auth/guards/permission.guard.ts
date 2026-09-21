import {
    CanActivate,
    ExecutionContext,
    ForbiddenException,
    Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../../prisma/prisma.service.js';
import { REQUIRED_PERMISSION_KEY } from '../decorators/require-permission.decorator.js';
import { CurrentUser } from '../interfaces/current-user.interface.js';

@Injectable()
export class PermissionGuard implements CanActivate {
    constructor(
        private readonly reflector: Reflector,
        private readonly prisma: PrismaService,
    ) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const requiredPermission = this.reflector.get<string>(
            REQUIRED_PERMISSION_KEY,
            context.getHandler(),
        );

        if (!requiredPermission) {
            return true;
        }

        const request = context.switchToHttp().getRequest<{
            user: CurrentUser;
        }>();

        const user = request.user;

        const permission = await this.prisma.permission.findFirst({
            where: {
                permissionName: requiredPermission,
                rolePermissions: {
                    some: {
                        role: {
                            companyKey: user.companyKey,
                            userRoles: {
                                some: {
                                    userKey: user.userKey,
                                },
                            },
                        },
                    },
                },
            },
        });

        if (!permission) {
            throw new ForbiddenException('Insufficient permissions');
        }

        return true;
    }
}