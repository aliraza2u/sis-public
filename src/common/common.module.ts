import { Module, Global } from '@nestjs/common';
import { TokenService } from './services/token.service';
import { HashingService } from './services/hashing.service';
import { TranslationHelperService } from './services/translation-helper.service';
import { FileStorageService } from './services/file-storage.service';

@Global()
@Module({
  providers: [TokenService, HashingService, TranslationHelperService, FileStorageService],
  exports: [TokenService, HashingService, TranslationHelperService, FileStorageService],
})
export class CommonModule {}
