import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class CreateSettingDto {
  @IsOptional()
  @IsString()
  @ApiProperty()
  logo_text: string;

  @IsOptional()
  @IsString()
  @ApiProperty()
  typed_text: string;

  @IsOptional()
  @IsString()
  @ApiProperty()
  footer_text: string;
}
