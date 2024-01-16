import { IsBoolean } from 'class-validator';

export class BanUserDto {
  @IsBoolean()
  isBan: boolean;
}
