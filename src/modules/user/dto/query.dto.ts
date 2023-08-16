import { ApiProperty } from '@nestjs/swagger';
import { IsNumberString, IsOptional, IsString } from 'class-validator';

export class QueryDTO {
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
}
