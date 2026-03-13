import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentTenant = createParamDecorator((data: unknown, ctx: ExecutionContext) => {
  // Use ClsServiceManager to access the context statically
  const { ClsServiceManager } = require('nestjs-cls');
  const clsService = ClsServiceManager.getClsService();
  return clsService.get('tenant');
});
