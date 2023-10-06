import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNumber, IsOptional } from 'class-validator';

export class LikesDTO {
  @ApiProperty()
  @IsBoolean()
  @IsOptional()
  flag: boolean;

  @ApiProperty()
  @IsBoolean()
  @IsOptional()
  isReply: boolean;

  @ApiProperty()
  @IsNumber()
  userId: number;
}
