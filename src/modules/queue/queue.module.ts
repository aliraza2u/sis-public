import { Global, Module } from '@nestjs/common';
import { QueueService } from '@/modules/queue/queue.service';

@Global()
@Module({
  providers: [QueueService],
  exports: [QueueService],
})
export class QueueModule {}
