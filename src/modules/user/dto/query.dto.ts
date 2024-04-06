import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsNumberString, IsOptional, IsString } from 'class-validator';

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
  @IsIn(['role', 'status', 'account', 'email'])
  @ApiProperty()
  readonly field: string;

  @IsOptional()
  @IsIn(['=', '>', '<', '%'])
  readonly searchType: string;

  @IsOptional()
  @IsString()
  @ApiProperty()
  readonly keyword: string;
}
