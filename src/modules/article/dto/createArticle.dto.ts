import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsNotEmpty,
  IsNumberString,
  IsString,
  IsUrl,
  MaxLength,
  MinLength,
} from 'class-validator';
import { createArticleRules } from '../constant';

export class CreateArticleDTO {
  @IsNotEmpty()
  @ApiProperty()
  author_id: string | number;

  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  @MinLength(createArticleRules.title.MIN_LENGTH)
  @MaxLength(createArticleRules.title.MAX_LENGTH)
  title: string;

  @IsNumberString()
  @IsNotEmpty()
  @ApiProperty()
  type_id: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  @MaxLength(createArticleRules.description.MAX_LENGTH)
  description: string;

  @IsString()
  @IsUrl()
  @IsNotEmpty()
  @ApiProperty()
  pic: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  content: string;

  @IsArray()
  @IsNotEmpty()
  @ApiProperty()
  tags: string[];
}
