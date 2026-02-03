import { Module, Global } from '@nestjs/common';
import { TokenService } from './services/token.service';
import { HashingService } from './services/hashing.service';
import { TranslationHelperService } from './services/translation-helper.service';

@Global()
@Module({
  providers: [TokenService, HashingService, TranslationHelperService],
  exports: [TokenService, HashingService, TranslationHelperService],
})
export class CommonModule {}
