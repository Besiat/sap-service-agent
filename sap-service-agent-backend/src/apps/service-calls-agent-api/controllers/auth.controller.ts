import {
  Controller,
  Post,
  Get,
  Body,
  HttpCode,
  HttpStatus,
  Request,
  UnauthorizedException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import {
  AuthService,
  CreateUserDto,
  NoAuth as NoAuth,
  CurrentUser,
  AuthenticatedUser,
  TenantDto,
  TenantsResponseDto,
  CreateTenantDto,
  LoginDto,
  AddUserToTenantDto,
} from '@sap-service-agent/auth';
import { AuthResponseDto } from '@sap-service-agent/auth/dto/auth-response.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @NoAuth()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a new user' })
  @ApiBody({ type: CreateUserDto })
  @ApiResponse({
    status: 201,
    description: 'User registered successfully',
    type: AuthResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 409, description: 'Username already exists' })
  async register(
    @Body() createUserDto: CreateUserDto,
  ): Promise<AuthResponseDto> {
    return this.authService.register(createUserDto);
  }

  @NoAuth()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login user' })
  @ApiBody({ type: LoginDto })
  @ApiResponse({
    status: 200,
    description: 'User logged in successfully',
    type: AuthResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(@Body() loginDto: LoginDto): Promise<AuthResponseDto> {
    const { username, password, tenantId } = loginDto;
    return this.authService.login(username, password, tenantId);
  }

  @Get('me/tenants')
  @ApiOperation({ summary: 'Get user tenants' })
  @ApiBearerAuth()
  @ApiResponse({
    status: 200,
    description: 'User tenants retrieved successfully',
    type: TenantsResponseDto,
  })
  async getUserTenants(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<TenantsResponseDto> {
    const tenants = await this.authService.getUserTenants(user.id);
    return { tenants };
  }

  @NoAuth()
  @Get('tenants')
  @ApiOperation({ summary: 'Get all available tenants' })
  @ApiResponse({
    status: 200,
    description: 'Tenants retrieved successfully',
    type: TenantsResponseDto,
  })
  async getAllTenants(): Promise<TenantsResponseDto> {
    const tenants = await this.authService.getAllTenants();
    return { tenants };
  }

  @NoAuth()
  @Post('tenants')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new tenant' })
  @ApiBody({ type: CreateTenantDto })
  @ApiResponse({
    status: 201,
    description: 'Tenant created successfully',
    type: TenantDto,
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 409, description: 'Tenant name already exists' })
  async createTenant(
    @Body() createTenantDto: CreateTenantDto,
  ): Promise<TenantDto> {
    return this.authService.createTenant(
      createTenantDto.name,
      createTenantDto.id,
    );
  }

  @NoAuth()
  @Post('users/add-to-tenant')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Add an existing user to a tenant' })
  @ApiBody({ type: AddUserToTenantDto })
  @ApiResponse({
    status: 204,
    description: 'User added to tenant successfully',
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({
    status: 409,
    description: 'User already has access to this tenant',
  })
  async addUserToTenant(
    @Body() addUserToTenantDto: AddUserToTenantDto,
  ): Promise<void> {
    const { userId, tenantId } = addUserToTenantDto;
    return this.authService.addUserToTenant(userId, tenantId);
  }

  @Post('switch-tenant')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Switch to a different tenant' })
  @ApiBearerAuth()
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        tenantId: {
          type: 'string',
          description: 'ID of the tenant to switch to',
        },
      },
      required: ['tenantId'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Tenant switched successfully, new token generated',
    type: AuthResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid tenant ID' })
  @ApiResponse({
    status: 401,
    description: 'User does not have access to this tenant',
  })
  async switchTenant(
    @CurrentUser() user: AuthenticatedUser,
    @Body('tenantId') tenantId: string,
  ): Promise<AuthResponseDto> {
    const userEntity = await this.authService.findUserById(user.id);
    if (!userEntity) {
      throw new UnauthorizedException('User not found');
    }

    const hasAccess = await this.authService.verifyUserTenantAccess(
      user.id,
      tenantId,
    );
    if (!hasAccess) {
      throw new UnauthorizedException(
        'User does not have access to this tenant',
      );
    }

    return await this.authService.generateAuthResponse(userEntity, tenantId);
  }
}
