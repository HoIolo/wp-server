import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';
import { PageDTO } from 'src/common/dto/page.dto';

export class GetImageDto extends PageDTO {
  @IsString()
  @ApiProperty()
  local: 'true' | 'false';
}
