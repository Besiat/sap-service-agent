import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { toMs } from 'ms-typescript';
import { UserRepository } from '../repositories/user.repository';
import { UserTenantRepository } from '../repositories/user-tenant.repository';
import { TenantRepository } from '../repositories/tenant.repository';
import { CreateUserDto } from '../dto/create-user.dto';
import { UserEntity } from '../entities/user.entity';
import { AuthResponseDto } from '../dto/auth-response.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly userTenantRepository: UserTenantRepository,
    private readonly tenantRepository: TenantRepository,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(createUserDto: CreateUserDto): Promise<AuthResponseDto> {
    const { username, password, tenantId } = createUserDto;

    const existingUser = await this.userRepository.findByUsername(username);
    if (existingUser) {
      throw new ConflictException('Username already exists');
    }

    const tenant = await this.tenantRepository.findById(tenantId);
    if (!tenant) {
      throw new BadRequestException('Invalid tenant ID');
    }

    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const user = await this.userRepository.create({
      username,
      password: hashedPassword,
    });

    await this.userTenantRepository.create({
      userId: user.id,
      tenantId,
    });

    return await this.generateAuthResponse(user, tenantId);
  }

  async login(
    username: string,
    password: string,
    tenantId: string,
  ): Promise<AuthResponseDto> {
    const user = await this.validateUser(username, password);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const tenant = await this.tenantRepository.findById(tenantId);
    if (!tenant) {
      throw new BadRequestException('Invalid tenant ID');
    }

    const hasAccess = await this.verifyUserTenantAccess(user.id, tenantId);
    if (!hasAccess) {
      throw new UnauthorizedException(
        'User does not have access to this tenant',
      );
    }

    return await this.generateAuthResponse(user, tenantId);
  }

  async validateUser(
    username: string,
    password: string,
  ): Promise<UserEntity | null> {
    const user = await this.userRepository.findByUsername(username);

    if (!user) {
      return null;
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return null;
    }

    return user;
  }

  async findUserById(id: string): Promise<UserEntity | null> {
    return this.userRepository.findById(id);
  }

  async verifyUserTenantAccess(
    userId: string,
    tenantId: string,
  ): Promise<boolean> {
    const userTenant = await this.userTenantRepository.findByUserIdAndTenantId(
      userId,
      tenantId,
    );
    return !!userTenant;
  }

  async getUserTenants(
    userId: string,
  ): Promise<{ id: string; name: string }[]> {
    return this.userTenantRepository.findTenantsWithDetailsByUserId(userId);
  }

  async getAllTenants(): Promise<{ id: string; name: string }[]> {
    const tenants = await this.tenantRepository.findAll();
    return tenants.map((tenant) => ({
      id: tenant.id,
      name: tenant.name,
    }));
  }

  async addUserToTenant(userId: string, tenantId: string): Promise<void> {
    const tenant = await this.tenantRepository.findById(tenantId);
    if (!tenant) {
      throw new BadRequestException('Invalid tenant ID');
    }

    const existingMapping =
      await this.userTenantRepository.findByUserIdAndTenantId(userId, tenantId);
    if (existingMapping) {
      throw new ConflictException('User already has access to this tenant');
    }

    await this.userTenantRepository.create({ userId, tenantId });
  }

  async createTenant(
    name: string,
    id?: string,
  ): Promise<{ id: string; name: string }> {
    const existingTenant = await this.tenantRepository.findByName(name);
    if (existingTenant) {
      throw new ConflictException('Tenant name already exists');
    }

    if (id) {
      const existingTenantById = await this.tenantRepository.findById(id);
      if (existingTenantById) {
        throw new ConflictException('Tenant ID already exists');
      }
    }

    const tenant = await this.tenantRepository.create({ id, name });
    return {
      id: tenant.id,
      name: tenant.name,
    };
  }

  async generateAuthResponse(
    user: UserEntity,
    tenantId: string,
  ): Promise<AuthResponseDto> {
    const payload = {
      sub: user.id,
      username: user.username,
      tenantId,
    };

    const accessToken = this.jwtService.sign(payload);

    const jwtExpiresIn =
      this.configService.get<string>('JWT_EXPIRES_IN') || '1h';
    const expiresInSeconds = Math.floor(toMs(jwtExpiresIn) / 1000);

    const selectedTenant = await this.tenantRepository.findById(tenantId);

    return {
      access_token: accessToken,
      token_type: 'Bearer',
      expires_in: expiresInSeconds,
      user: {
        id: user.id,
        username: user.username,
      },
      selectedTenant: selectedTenant
        ? {
            id: selectedTenant.id,
            name: selectedTenant.name,
          }
        : undefined,
    };
  }
}
