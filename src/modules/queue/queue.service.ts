import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PgBoss, Job, SendOptions, WorkOptions, WorkHandler } from 'pg-boss';

export interface JobHandler<T = unknown> {
  (job: Job<T>): Promise<void>;
}

@Injectable()
export class QueueService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(QueueService.name);
  private boss: PgBoss;

  constructor(private readonly configService: ConfigService) {
    const connectionString = this.configService.get<string>('database.url');
    if (!connectionString) {
      throw new Error('DATABASE_URL is required for pg-boss');
    }
    this.boss = new PgBoss(connectionString);
  }

  async onModuleInit() {
    this.boss.on('error', (error) => {
      this.logger.error('pg-boss error:', error);
    });

    await this.boss.start();
    this.logger.log('pg-boss queue started');
  }

  async onModuleDestroy() {
    await this.boss.stop({ graceful: true, timeout: 30000 });
    this.logger.log('pg-boss queue stopped');
  }

  /**
   * Add a job to the queue
   */
  async enqueue<T>(queueName: string, data: T, options?: SendOptions): Promise<string | null> {
    const jobId = await this.boss.send(queueName, data as object, options);
    this.logger.debug(`Enqueued job ${jobId} to queue ${queueName}`);
    return jobId;
  }

  /**
   * Create a queue if it doesn't exist
   * pg-boss v12 requires explicit queue creation
   */
  async createQueue(queueName: string): Promise<void> {
    try {
      // pg-boss v12 has a createQueue method
      await this.boss.createQueue(queueName);
      this.logger.debug(`Queue ${queueName} created/verified`);
    } catch (error) {
      // Queue may already exist, which is fine
      this.logger.debug(`Queue ${queueName} already exists or created`);
    }
  }

  /**
   * Subscribe to a queue and process jobs
   * pg-boss v12 work() handler receives array of jobs
   */
  async subscribe<T>(
    queueName: string,
    handler: JobHandler<T>,
    options?: WorkOptions,
  ): Promise<string> {
    // Ensure queue exists before subscribing
    await this.createQueue(queueName);

    const workHandler: WorkHandler<T> = async (jobs: Job<T>[]) => {
      // Process each job in the batch
      for (const job of jobs) {
        this.logger.debug(`Processing job ${job.id} from queue ${queueName}`);
        try {
          await handler(job);
          this.logger.debug(`Completed job ${job.id}`);
        } catch (error) {
          this.logger.error(`Failed job ${job.id}:`, error);
          throw error;
        }
      }
    };

    const workerId = await this.boss.work<T>(queueName, options || {}, workHandler);
    this.logger.log(`Subscribed to queue ${queueName} with worker ${workerId}`);
    return workerId;
  }

  /**
   * Get a job by ID
   */
  async getJob<T>(queueName: string, jobId: string): Promise<Job<T> | null> {
    const job = await this.boss.getJobById<T>(queueName, jobId);
    return job as Job<T> | null;
  }

  /**
   * Cancel a job
   */
  async cancelJob(queueName: string, jobId: string): Promise<void> {
    await this.boss.cancel(queueName, jobId);
    this.logger.debug(`Cancelled job ${jobId}`);
  }

  /**
   * Complete a job manually
   */
  async completeJob(queueName: string, jobId: string, data?: object): Promise<void> {
    await this.boss.complete(queueName, jobId, data);
  }

  /**
   * Fail a job manually
   */
  async failJob(queueName: string, jobId: string, error?: object): Promise<void> {
    await this.boss.fail(queueName, jobId, error);
  }

  /**
   * Get the pg-boss instance for advanced operations
   */
  getBoss(): PgBoss {
    return this.boss;
  }
}
