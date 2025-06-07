import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsOptional } from 'class-validator';
import { PageDTO } from 'src/common/dto/page.dto';

export class GetArticleByUidDto extends PageDTO {
  @ApiProperty()
  @IsOptional()
  @IsIn(['ASC', 'DESC'])
  order: 'DESC' | 'ASC' = 'DESC';

  @ApiProperty({ description: '审核状态：0-待审核，1-审核中，2-审核通过' })
  @IsOptional()
  is_approved?: number;
}
