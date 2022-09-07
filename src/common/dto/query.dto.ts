import { IsNumberString, IsOptional, IsString } from 'class-validator';

export class QueryDTO {
  @IsOptional()
  @IsNumberString()
  readonly page: string | number;

  @IsOptional()
  @IsNumberString()
  readonly offset: string | number;

  @IsOptional()
  @IsString()
  readonly keyword: string;
}
