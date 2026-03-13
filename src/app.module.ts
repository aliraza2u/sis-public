import { Module, MiddlewareConsumer, NestModule, RequestMethod } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import * as Joi from 'joi';
import { APP_FILTER, APP_INTERCEPTOR, APP_GUARD } from '@nestjs/core';
import { ThrottlerModule } from '@nestjs/throttler';
import { LoggerModule } from 'nestjs-pino';
import { I18nModule, AcceptLanguageResolver, I18nJsonLoader } from 'nestjs-i18n';
import * as path from 'path';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './modules/auth/auth.module';
import {
  AppConfig,
  DatabaseConfig,
  SwaggerConfig,
  JwtConfig,
  HashingConfig,
  AuthConfig,
  DataTransferConfig,
} from './config';
import { PrismaModule } from './infrastructure/prisma/prisma.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { I18nExceptionFilter } from './common/filters/i18n-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { I18nResponseInterceptor } from './common/interceptors/i18n-response.interceptor';
import { JwtAuthGuard } from './modules/auth/guards/jwt-auth.guard';
import { UserModule } from './modules/user/user.module';
import { CourseModule } from './modules/course/course.module';
import { CategoryModule } from './modules/category/category.module';
import { CommonModule } from './common/common.module';
import { ClsModule } from 'nestjs-cls';
import { UserContextInterceptor } from './common/interceptors/user-context.interceptor';
import { TenantMiddleware } from './common/middleware/tenant.middleware';
import { QueueModule } from './modules/queue/queue.module';
import { DataTransferModule } from './modules/data-transfer/data-transfer.module';
import { SystemModule } from './modules/system/system.module';
import { SYSTEM_ROUTES } from './common/constants/routes';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env'],
      load: [
        AppConfig,
        DatabaseConfig,
        SwaggerConfig,
        JwtConfig,
        HashingConfig,
        AuthConfig,
        DataTransferConfig,
      ],
      validationSchema: Joi.object({
        NODE_ENV: Joi.string()
          .valid('development', 'production', 'test', 'provision')
          .default('development'),
        APP_PORT: Joi.number().default(3000),
        APP_PREFIX: Joi.string().default('api'),
        APP_SALT_ROUNDS: Joi.number().default(12),
        AUTH_EMAIL_VERIFICATION_EXPIRY: Joi.number().default(24),
        AUTH_PASSWORD_RESET_EXPIRY: Joi.number().default(1),
        AUTH_REFRESH_TOKEN_EXPIRY_DAYS: Joi.number().default(7),
        DATABASE_URL: Joi.string().required(),
        SWAGGER_ENABLED: Joi.boolean().default(true),
        SWAGGER_PATH: Joi.string().default('api/docs'),
        FRONTEND_URL: Joi.string().required(),
        SENDGRID_API_KEY: Joi.string().required(),
        SENDGRID_FROM_EMAIL: Joi.string().optional(),
        FROM_EMAIL: Joi.string().optional(),
        ADMIN_EMAIL: Joi.string().email().optional(),
        ADMIN_PASSWORD: Joi.string().optional(),
        ADMIN_FIRST_NAME: Joi.string().optional(),
        ADMIN_LAST_NAME: Joi.string().optional(),
        DEFAULT_TENANT_SLUG: Joi.string().default('al-mkki'),
        BOOTSTRAP_SECRET: Joi.string().required(),
      }),
    }),
    LoggerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        pinoHttp: {
          transport:
            config.get<string>('nodeEnv') !== 'production'
              ? {
                  target: 'pino-pretty',
                  options: {
                    singleLine: true,
                    ignore: 'req,res',
                  },
                }
              : undefined,
          autoLogging: true,
        },
      }),
    }),
    PrismaModule,
    AuthModule,
    UserModule,
    CategoryModule,
    CourseModule,
    CommonModule,
    QueueModule,
    DataTransferModule,
    SystemModule,
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 100,
      },
    ]),
    ClsModule.forRoot({
      global: true,
      middleware: { mount: true },
    }),
    I18nModule.forRoot({
      fallbackLanguage: 'en',
      loaderOptions: {
        path: path.join(__dirname, '/i18n/'),
        watch: false, // Disable watch mode for production
      },
      resolvers: [AcceptLanguageResolver],
      loader: I18nJsonLoader,
    }),
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
    {
      provide: APP_FILTER,
      useClass: I18nExceptionFilter,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: I18nResponseInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: TransformInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: UserContextInterceptor,
    },
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(TenantMiddleware)
      .exclude({ path: SYSTEM_ROUTES.BOOTSTRAP_IMPORT, method: RequestMethod.POST })
      .forRoutes('*');
  }
}
