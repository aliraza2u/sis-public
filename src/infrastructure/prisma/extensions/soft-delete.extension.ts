import { Prisma } from '../client/client';
import { ClsService } from 'nestjs-cls';

export function softDeleteExtension(cls: ClsService) {
  const softDeleteMethods = {
    async delete<M, A>(
      this: M,
      args: Prisma.Exact<A, Prisma.Args<M, 'delete'>>,
    ): Promise<Prisma.Result<M, A, 'delete'>> {
      const context = Prisma.getExtensionContext(this);
      const userId = cls.get('userId');

      return (context as any).update({
        ...(args as Prisma.Args<M, 'delete'>),
        data: {
          deletedAt: new Date(),
          deletedBy: userId,
          isActive: false, // Optional: if we want to deactivate
        },
      });
    },
    async deleteMany<M, A>(
      this: M,
      args: Prisma.Exact<A, Prisma.Args<M, 'deleteMany'>>,
    ): Promise<Prisma.Result<M, A, 'deleteMany'>> {
      const context = Prisma.getExtensionContext(this);
      const userId = cls.get('userId');

      return (context as any).updateMany({
        ...(args as Prisma.Args<M, 'deleteMany'>),
        data: {
          deletedAt: new Date(),
          deletedBy: userId,
          isActive: false,
        },
      });
    },
  };

  const softDeleteQueryMiddleware = {
    async findUnique({ args, query }) {
      args.where = { ...args.where, deletedAt: null };
      return query(args);
    },
    async findFirst({ args, query }) {
      args.where = { ...args.where, deletedAt: null };
      return query(args);
    },
    async findMany({ args, query }) {
      args.where = { ...args.where, deletedAt: null };
      return query(args);
    },
    async count({ args, query }) {
      args.where = { ...args.where, deletedAt: null };
      return query(args);
    },
  };

  return Prisma.defineExtension({
    name: 'softDelete',
    model: {
      user: softDeleteMethods,
      tenant: softDeleteMethods,
      course: softDeleteMethods,
    },
    query: {
      user: softDeleteQueryMiddleware,
      tenant: softDeleteQueryMiddleware,
      course: softDeleteQueryMiddleware,
    },
  });
}
