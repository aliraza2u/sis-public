import { Injectable, Inject } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import hashingConfig from '@/config/hashing.config';

@Injectable()
export class HashingService {
  private readonly SALT_ROUNDS: number;

  constructor(
    @Inject(hashingConfig.KEY)
    private readonly hashingConfiguration: ConfigType<typeof hashingConfig>,
  ) {
    this.SALT_ROUNDS = this.hashingConfiguration.saltRounds;
  }

  async hash(data: string): Promise<string> {
    return bcrypt.hash(data, this.SALT_ROUNDS);
  }

  async compare(data: string, encrypted: string): Promise<boolean> {
    return bcrypt.compare(data, encrypted);
  }
}
