import { ApiProperty } from '@nestjs/swagger';

export class UserFavoritesDto {
  @ApiProperty({
    description: 'List of favorite service call IDs',
    example: [
      '123e4567-e89b-12d3-a456-426614174000',
      '123e4567-e89b-12d3-a456-426614174001',
    ],
    type: [String],
  })
  favoriteServiceCallIds: string[];
}
