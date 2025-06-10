import { ApiProperty } from '@nestjs/swagger';
import { IsOptional } from 'class-validator';

export class GetArticleByIdDto {
  @ApiProperty({
    description: '是否编辑',
    default: 0,
  })
  @IsOptional()
  isEdit?: 0 | 1; // 0-否，1-是
}
