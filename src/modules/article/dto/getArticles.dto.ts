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
}
