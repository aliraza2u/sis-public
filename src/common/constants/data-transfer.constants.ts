export const DataTransferConstants = {
  // Queue name - must remain stable to avoid breaking existing jobs
  IMPORT_QUEUE_NAME: 'import-jobs',
  // Standard CSV MIME types - technical specification, not configurable
  VALID_MIME_TYPES: ['text/csv', 'application/csv', 'text/plain', 'application/vnd.ms-excel'],
};
