import { BadRequestException } from '@nestjs/common';
import { I18nBadRequestException } from '@/common/exceptions/i18n.exception';

/**
 * Creates a multer file filter that only accepts video/mp4 files.
 */
export function createVideoFileFilter() {
  return (
    _req: any,
    file: Express.Multer.File,
    callback: (error: Error | null, acceptFile: boolean) => void,
  ) => {
    if (file.mimetype !== 'video/mp4') {
      return callback(new I18nBadRequestException('upload.invalidVideoType'), false);
    }
    callback(null, true);
  };
}

/**
 * Allowed MIME types for resource materials.
 */
const ALLOWED_RESOURCE_MIMES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'audio/mpeg',
  'audio/wav',
  'audio/ogg',
  'audio/mp4',
  'audio/aac',
  'audio/webm',
];

/**
 * Creates a multer file filter that accepts PDF, DOC, DOCX, PPT, PPTX, and audio files.
 */
export function createResourceFileFilter() {
  return (
    _req: any,
    file: Express.Multer.File,
    callback: (error: Error | null, acceptFile: boolean) => void,
  ) => {
    if (!ALLOWED_RESOURCE_MIMES.includes(file.mimetype)) {
      return callback(new I18nBadRequestException('upload.invalidResourceType'), false);
    }
    callback(null, true);
  };
}

/**
 * Detects ResourceType from MIME type.
 */
export function detectResourceType(mimeType: string): 'pdf' | 'audio' | 'file' {
  if (mimeType === 'application/pdf') {
    return 'pdf';
  }
  if (mimeType.startsWith('audio/')) {
    return 'audio';
  }
  return 'file';
}

/**
 * MIME type map for allowed assignment file type tokens.
 */
export const ASSIGNMENT_TYPE_TO_MIMES: Record<string, string[]> = {
  pdf: ['application/pdf'],
  doc: [
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ],
  zip: ['application/zip', 'application/x-zip-compressed', 'application/octet-stream'],
};

/**
 * Builds a dynamic Multer file filter based on the assignment's allowedFileTypes config.
 * Accepts an array of type tokens like ["pdf", "doc", "zip"].
 */
export function createAssignmentFileFilter(allowedTypes: string[]) {
  const allowedMimes = allowedTypes.flatMap((t) => ASSIGNMENT_TYPE_TO_MIMES[t] ?? []);

  return (
    _req: any,
    file: Express.Multer.File,
    callback: (error: Error | null, acceptFile: boolean) => void,
  ) => {
    if (!allowedMimes.includes(file.mimetype)) {
      return callback(
        new I18nBadRequestException('upload.invalidAssignmentType', {
          allowedTypes: allowedTypes.join(', '),
        }),
        false,
      );
    }
    callback(null, true);
  };
}
