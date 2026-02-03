import { Injectable } from '@nestjs/common';
import { nanoid } from 'nanoid';
import { DateUtil } from '../utils/date.util';

@Injectable()
export class TokenService {
  /**
   * Generates a secure, URL-safe token.
   * @param length The length of the token (default: 32)
   * @returns A string token
   */
  generate(length: number = 32): string {
    return nanoid(length);
  }

  /**
   * Generates an expiration date based on the number of hours from now.
   * @param hours Number of hours (default: 24)
   * @returns Date object
   */
  getExpirationDate(hours: number = 24): Date {
    return DateUtil.getExpirationDate(hours);
  }
}
