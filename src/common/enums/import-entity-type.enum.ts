import { EntityType } from './entity-type.enum';

export const ImportEntityType = {
  ...EntityType,
} as const;

export type ImportEntityType = (typeof ImportEntityType)[keyof typeof ImportEntityType];
