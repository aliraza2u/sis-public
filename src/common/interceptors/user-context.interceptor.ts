import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { ClsService } from 'nestjs-cls';
import { Observable } from 'rxjs';
import { UserEntity } from '../../modules/user/entities/user.entity';

@Injectable()
export class UserContextInterceptor implements NestInterceptor {
  constructor(private readonly cls: ClsService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const user = request.user as UserEntity;

    if (user) {
      this.cls.set('user', user);
      // Also strictly define userId for easier access
      this.cls.set('userId', user.id);

      if (user.tenantId) {
        this.cls.set('tenantId', user.tenantId);
      }
    }

    return next.handle();
  }
}
