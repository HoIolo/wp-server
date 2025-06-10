import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNumber, IsOptional, IsString } from 'class-validator';

export class UpdateArticleDTO {
  @ApiProperty({ description: '文章标题', required: false })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiProperty({ description: '文章内容', required: false })
  @IsString()
  @IsOptional()
  content?: string;

  @ApiProperty({ description: '文章描述', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: '文章类型ID', required: false })
  @IsNumber()
  @IsOptional()
  type_id?: number;

  @ApiProperty({ description: '文章标签', required: false })
  @IsArray()
  @IsOptional()
  tags?: string[];
}
