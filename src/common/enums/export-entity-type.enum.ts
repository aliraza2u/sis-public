import { EntityType } from './entity-type.enum';

export const ExportEntityType = {
  ...EntityType,
} as const;

export type ExportEntityType = (typeof ExportEntityType)[keyof typeof ExportEntityType];
