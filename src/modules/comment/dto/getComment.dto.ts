import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { PageDTO } from 'src/common/dto/page.dto';

export class GetCommentDto extends PageDTO {
  @IsString()
  @IsOptional()
  @ApiProperty()
  sorted: 'DESC' | 'ASC';
}
