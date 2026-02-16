import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class BootstrapAuthGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const token = request.headers['x-migration-token'];
    const secret = this.configService.get<string>('BOOTSTRAP_SECRET');

    if (!token || token !== secret) {
      throw new ForbiddenException('Invalid migration token');
    }

    return true;
  }
}
