import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsNumberString, IsString, IsIn } from 'class-validator';

export class PageDTO {
  @IsOptional()
  @IsNumberString()
  @ApiProperty()
  readonly page: string | number;

  @IsOptional()
  @IsNumberString()
  @ApiProperty()
  readonly offset: string | number;

  @IsOptional()
  @IsString()
  @ApiProperty()
  readonly keyword: string;

  @IsOptional()
  @IsString()
  @ApiProperty()
  readonly field: string;

  @IsOptional()
  @IsIn(['DESC', 'ASC'])
  @ApiProperty()
  readonly sorted: 'DESC' | 'ASC';
}
