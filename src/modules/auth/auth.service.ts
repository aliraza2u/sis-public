import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '@/infrastructure/prisma/prisma.service';
import { RegisterRequestDto } from './dto/register.dto';
import { LoginRequestDto } from './dto/login.dto';
import * as bcrypt from 'bcrypt';
import { User, Prisma } from '@/infrastructure/prisma/client/client';
import { UserEntity } from './entities/user.entity';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async register(dto: RegisterRequestDto) {
    const existingUser = await this.prisma.user.findFirst({
      where: { email: dto.email },
    });

    if (existingUser) {
      throw new ConflictException('User already exists');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    // Fetch the first existing tenant (Default Tenant)
    const tenant = await this.prisma.tenant.findFirst();

    if (!tenant) {
      throw new ConflictException('No tenant found. Please contact support.');
    }

    try {
      const user = await this.prisma.user.create({
        data: {
          email: dto.email,
          passwordHash: hashedPassword,
          firstName: { en: dto.name },
          lastName: {},
          tenantId: tenant.id,
          role: 'applicant', // Default role for new registrations
        },
      });

      return new UserEntity({
        ...user,
        tenant,
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        // Handle conflicts
        throw new ConflictException('User or Organization already exists');
      }
      throw error;
    }
  }

  async login(dto: LoginRequestDto) {
    const user = await this.prisma.user.findFirst({
      where: { email: dto.email }, // Should ideally filter by tenant (subdomain) too if we had it in headers
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = { sub: user.id, email: user.email, tenantId: user.tenantId };

    return {
      access_token: this.jwtService.sign(payload),
      user: new UserEntity(user),
    };
  }

  async validateUser(userId: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { id: userId } });
  }
}
