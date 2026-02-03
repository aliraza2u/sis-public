import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { PrismaModule } from '@/infrastructure/prisma/prisma.module';
import { JwtStrategy } from './strategies/jwt.strategy';
import { EmailModule } from '../email/email.module';
import { UserModule } from '../user/user.module';

@Module({
  imports: [
    PrismaModule,
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('jwt.secret'),
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        signOptions: { expiresIn: configService.get<string>('jwt.expiresIn') as any },
      }),
    }),
    EmailModule,
    UserModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService],
})
export class AuthModule {}
