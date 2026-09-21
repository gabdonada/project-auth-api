import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service.js';
import { Request, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from './jwt-auth.guard.js';
import { CurrentUser } from './interfaces/current-user.interface.js';

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) {}

    @Post('login')
    login(@Body() body: { email: string; password: string }) {
        return this.authService.login(body.email, body.password);
    }
    
    // temporary endpoint to test JWT authentication
    @Get('me')
    @UseGuards(JwtAuthGuard)
    getMe(@Request() request: Request & { user: CurrentUser }) {
    return request.user;
    }
}