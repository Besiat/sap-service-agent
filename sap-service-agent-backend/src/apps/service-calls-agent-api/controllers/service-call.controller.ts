import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import {
  CreateServiceCallDto,
  ServiceCallResponseDto,
  ServiceCallService,
  UpdateServiceCallDto,
} from '@sap-service-agent/service-calls';
import { PaginatedResponseDto } from '@sap-service-agent/service-calls';
import { CurrentUser, AuthenticatedUser } from '@sap-service-agent/auth';

@ApiTags('service-calls')
@ApiBearerAuth()
@Controller('service-call')
export class ServiceCallController {
  constructor(private readonly serviceCallService: ServiceCallService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new service call' })
  @ApiBody({ type: CreateServiceCallDto })
  @ApiResponse({
    status: 201,
    description: 'Service call created successfully',
    type: ServiceCallResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async createServiceCall(
    @CurrentUser() user: AuthenticatedUser,
    @Body() createServiceCallDto: CreateServiceCallDto,
  ): Promise<ServiceCallResponseDto> {
    return this.serviceCallService.createServiceCall(
      user.tenantId,
      createServiceCallDto,
    );
  }

  @Get()
  @ApiOperation({
    summary: 'Get paginated service calls for the current tenant',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number (default: 1)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Items per page (default: 10)',
  })
  @ApiQuery({
    name: 'favoritesOnly',
    required: false,
    type: Boolean,
    description: 'Filter to show only favorite service calls (default: false)',
  })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    type: String,
    description: 'Field to sort by (id, name, scheduledAt, createdAt, status)',
  })
  @ApiQuery({
    name: 'sortOrder',
    required: false,
    enum: ['asc', 'desc'],
    description: 'Sort order (default: desc)',
  })
  @ApiResponse({
    status: 200,
    description: 'Paginated list of service calls',
    type: PaginatedResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getServiceCalls(
    @CurrentUser() user: AuthenticatedUser,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('favoritesOnly') favoritesOnly: boolean = false,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder: 'asc' | 'desc' = 'desc',
  ): Promise<PaginatedResponseDto<ServiceCallResponseDto>> {
    const pageNum = Math.max(1, page);
    const limitNum = Math.min(Math.max(1, limit), 100);

    return this.serviceCallService.getAllServiceCallsPaginated(user.tenantId, {
      page: pageNum,
      limit: limitNum,
      favoritesOnly,
      userId: user.id,
      sortBy,
      sortOrder,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a service call by ID' })
  @ApiParam({ name: 'id', description: 'Service call ID' })
  @ApiResponse({
    status: 200,
    description: 'Service call details',
    type: ServiceCallResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Service call not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getServiceCallById(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<ServiceCallResponseDto> {
    return this.serviceCallService.getServiceCallById(id, user.tenantId);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a service call' })
  @ApiParam({ name: 'id', description: 'Service call ID' })
  @ApiBody({ type: UpdateServiceCallDto })
  @ApiResponse({
    status: 200,
    description: 'Service call updated successfully',
    type: ServiceCallResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Service call not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async updateServiceCall(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() updateServiceCallDto: UpdateServiceCallDto,
  ): Promise<ServiceCallResponseDto> {
    return this.serviceCallService.updateServiceCall(
      id,
      user.tenantId,
      updateServiceCallDto,
    );
  }
}
