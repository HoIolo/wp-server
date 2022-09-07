import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Profile } from 'src/user/entity/profile.entity';
import { User } from 'src/user/entity/user.entity';
import { UserService } from 'src/user/user.service';
import { encryptPassword } from 'src/utils/cryptogram';

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private jwtService: JwtService,
  ) {}

  async validateUser(
    account: string,
    password: string,
  ): Promise<{ code: number; user: User | null }> {
    const user = await this.userService.findOne(account);
    if (user) {
      const { password: hashedPassword, salt } = user;
      // 通过密码盐，加密传参，再与数据库里的比较，判断是否相等
      const hashPassword = encryptPassword(password, salt);
      if (hashedPassword === hashPassword) {
        // 密码正确
        return {
          code: 1,
          user,
        };
      } else {
        // 密码错误
        return {
          code: 2,
          user: null,
        };
      }
    }
    // 查无此人
    return {
      code: 3,
      user: null,
    };
  }

  async login(profile: Profile) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { uid, ...payload } = profile;
    return {
      access_token: this.jwtService.sign(payload),
    };
  }
}
