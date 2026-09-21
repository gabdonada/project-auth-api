import { AuthGuard } from '@nestjs/passport';

// This guard is used to protect routes that require authentication using JWT
export class JwtAuthGuard extends AuthGuard('jwt') {}