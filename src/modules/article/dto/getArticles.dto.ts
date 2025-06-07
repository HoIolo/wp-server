import { ApiProperty } from '@nestjs/swagger';
import { IsOptional } from 'class-validator';
import { PageDTO } from 'src/common/dto/page.dto';

export class GetArticleDTO extends PageDTO {
  @ApiProperty()
  @IsOptional()
  field: string;

  @ApiProperty()
  @IsOptional()
  sorted: 'DESC' | 'ASC';

  @ApiProperty({ description: '审核状态：0-待审核，1-审核中，2-审核通过' })
  @IsOptional()
  is_approved?: number;
}
