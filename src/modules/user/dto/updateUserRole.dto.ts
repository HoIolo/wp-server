import { ApiProperty } from '@nestjs/swagger';
import { IsIn } from 'class-validator';

export class UpdateUserRoleDto {
  @IsIn([1, 2, 3])
  @ApiProperty({ description: '用户角色' })
  role: number;
}
