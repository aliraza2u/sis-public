export abstract class BaseAuditEntity {
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string | null;
  updatedBy?: string | null;
}

export abstract class BaseSoftDeleteEntity extends BaseAuditEntity {
  deletedAt?: Date | null;
  deletedBy?: string | null;
}
