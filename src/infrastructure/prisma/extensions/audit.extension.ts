import { Prisma } from '../client/client';
import { ClsService } from 'nestjs-cls';

export function auditExtension(cls: ClsService) {
  return Prisma.defineExtension({
    name: 'audit',
    query: {
      user: {
        async create({ args, query }) {
          const userId = cls.get('userId');
          if (userId) {
            args.data = { ...args.data, createdBy: userId, updatedBy: userId };
          }
          return query(args);
        },
        async update({ args, query }) {
          const userId = cls.get('userId');
          if (userId) {
            args.data = { ...args.data, updatedBy: userId };
          }
          return query(args);
        },
        async updateMany({ args, query }) {
          const userId = cls.get('userId');
          if (userId) {
            args.data = { ...args.data, updatedBy: userId };
          }
          return query(args);
        },
      },
      tenant: {
        async create({ args, query }) {
          const userId = cls.get('userId');
          if (userId) {
            args.data = { ...args.data, createdBy: userId, updatedBy: userId };
          }
          return query(args);
        },
        async update({ args, query }) {
          const userId = cls.get('userId');
          if (userId) {
            args.data = { ...args.data, updatedBy: userId };
          }
          return query(args);
        },
        async updateMany({ args, query }) {
          const userId = cls.get('userId');
          if (userId) {
            args.data = { ...args.data, updatedBy: userId };
          }
          return query(args);
        },
      },
      course: {
        async create({ args, query }) {
          const userId = cls.get('userId');
          if (userId) {
            args.data = { ...args.data, createdBy: userId, updatedBy: userId };
          }
          return query(args);
        },
        async update({ args, query }) {
          const userId = cls.get('userId');
          if (userId) {
            args.data = { ...args.data, updatedBy: userId };
          }
          return query(args);
        },
        async updateMany({ args, query }) {
          const userId = cls.get('userId');
          if (userId) {
            args.data = { ...args.data, updatedBy: userId };
          }
          return query(args);
        },
      },
    },
  });
}
