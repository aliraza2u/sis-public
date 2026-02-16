import { HttpException, HttpStatus } from '@nestjs/common';

/**
 * Base exception class for i18n-enabled errors.
 * The translation key is stored and translated by the I18nExceptionFilter.
 */
export class I18nException extends HttpException {
  constructor(
    public readonly translationKey: string,
    public readonly translationArgs?: Record<string, any>,
    status: HttpStatus = HttpStatus.INTERNAL_SERVER_ERROR,
  ) {
    // Pass the key as the message temporarily (will be translated in filter)
    super(translationKey, status);
  }
}

/**
 * 400 Bad Request with i18n translation
 */
export class I18nBadRequestException extends I18nException {
  constructor(translationKey: string, translationArgs?: Record<string, any>) {
    super(translationKey, translationArgs, HttpStatus.BAD_REQUEST);
  }
}

/**
 * 401 Unauthorized with i18n translation
 */
export class I18nUnauthorizedException extends I18nException {
  constructor(translationKey: string, translationArgs?: Record<string, any>) {
    super(translationKey, translationArgs, HttpStatus.UNAUTHORIZED);
  }
}

/**
 * 404 Not Found with i18n translation
 */
export class I18nNotFoundException extends I18nException {
  constructor(translationKey: string, translationArgs?: Record<string, any>) {
    super(translationKey, translationArgs, HttpStatus.NOT_FOUND);
  }
}

/**
 * 409 Conflict with i18n translation
 */
export class I18nConflictException extends I18nException {
  constructor(translationKey: string, translationArgs?: Record<string, any>) {
    super(translationKey, translationArgs, HttpStatus.CONFLICT);
  }
}

/**
 * 500 Internal Server Error with i18n translation
 */
export class I18nInternalServerErrorException extends I18nException {
  constructor(translationKey: string, translationArgs?: Record<string, any>) {
    super(translationKey, translationArgs, HttpStatus.INTERNAL_SERVER_ERROR);
  }
}

/**
 * 403 Forbidden with i18n translation
 */
export class I18nForbiddenException extends I18nException {
  constructor(translationKey: string, translationArgs?: Record<string, any>) {
    super(translationKey, translationArgs, HttpStatus.FORBIDDEN);
  }
}
