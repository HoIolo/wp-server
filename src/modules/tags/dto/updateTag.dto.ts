import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length } from 'class-validator';

export class UpdateTagDto {
  @IsString()
  @ApiProperty()
  @Length(1, 15)
  tagName: string;
}
