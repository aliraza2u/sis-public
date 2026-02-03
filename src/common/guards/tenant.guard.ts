import { CanActivate, ExecutionContext, Injectable, NotFoundException } from '@nestjs/common';
import { ClsService } from 'nestjs-cls';
import { I18nService } from 'nestjs-i18n';
import { I18nNotFoundException } from '../exceptions/i18n.exception';

@Injectable()
export class TenantGuard implements CanActivate {
  constructor(
    private readonly cls: ClsService,
    private readonly i18n: I18nService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const tenant = this.cls.get('tenant');
    if (!tenant) {
      throw new I18nNotFoundException('messages.tenant.contextRequired');
    }
    return true;
  }
}
