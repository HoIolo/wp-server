import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsOptional } from 'class-validator';
import { PageDTO } from 'src/common/dto/page.dto';

export class GetArticleByUidDto extends PageDTO {
  @ApiProperty()
  @IsOptional()
  @IsIn(['ASC', 'DESC'])
  order: 'DESC' | 'ASC' = 'DESC';
}
