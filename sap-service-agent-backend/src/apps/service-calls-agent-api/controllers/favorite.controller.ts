import {
  Controller,
  Post,
  Delete,
  Get,
  Param,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { FavoriteService } from '@sap-service-agent/service-calls';
import { CurrentUser, AuthenticatedUser } from '@sap-service-agent/auth';
import {
  AddToFavoritesDto,
  UserFavoritesDto,
} from '@sap-service-agent/service-calls';

@ApiTags('favorites')
@ApiBearerAuth()
@Controller('favorites')
export class FavoriteController {
  constructor(private readonly favoriteService: FavoriteService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Add a service call to favorites' })
  @ApiBody({ type: AddToFavoritesDto })
  @ApiResponse({
    status: 201,
    description: 'Service call added to favorites successfully',
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Service call not found' })
  @ApiResponse({ status: 409, description: 'Already in favorites' })
  async addToFavorites(
    @CurrentUser() user: AuthenticatedUser,
    @Body() addToFavoritesDto: AddToFavoritesDto,
  ): Promise<void> {
    await this.favoriteService.addToFavorites(
      user.tenantId,
      user.id,
      addToFavoritesDto.serviceCallId,
    );
  }

  @Delete(':serviceCallId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove a service call from favorites' })
  @ApiParam({
    name: 'serviceCallId',
    description: 'The ID of the service call to remove from favorites',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 204,
    description: 'Service call removed from favorites successfully',
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Service call not in favorites' })
  async removeFromFavorites(
    @CurrentUser() user: AuthenticatedUser,
    @Param('serviceCallId') serviceCallId: string,
  ): Promise<void> {
    await this.favoriteService.removeFromFavorites(
      user.tenantId,
      user.id,
      serviceCallId,
    );
  }

  @Get()
  @ApiOperation({ summary: 'Get user favorites' })
  @ApiResponse({
    status: 200,
    description: 'User favorites retrieved successfully',
    type: UserFavoritesDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getUserFavorites(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<UserFavoritesDto> {
    const favoriteServiceCallIds =
      await this.favoriteService.getUserFavoriteServiceCalls(
        user.tenantId,
        user.id,
      );
    return { favoriteServiceCallIds };
  }
}
