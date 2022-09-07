import { IsString } from 'class-validator';

export class LoginDTO {
  @IsString()
  account: string;

  @IsString()
  password: string;
}
