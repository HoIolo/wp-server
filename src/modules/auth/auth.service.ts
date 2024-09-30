import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { COMMON_CONFIG } from 'src/config/common.config';
import { Profile } from 'src/modules/user/entity/profile.entity';
import { User } from 'src/modules/user/entity/user.entity';
import { UserService } from 'src/modules/user/user.service';
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
      const { password: hashedPassword, salt, status } = user;
      // 通过密码盐，加密传参，再与数据库里的比较，判断是否相等
      const hashPassword = encryptPassword(password, salt);
      if (hashedPassword === hashPassword) {
        // 密码正确
        if (status === 0) {
          // 账号被禁用
          return {
            code: 3,
            user: null,
          };
        }
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
      code: 4,
      user: null,
    };
  }

  async login(profile: Profile) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { ...payload } = profile;
    const access_token_expired = COMMON_CONFIG.TOKEN.ACCESS_TOKEN.EXPIRES_IN;
    const refresh_token_expired = COMMON_CONFIG.TOKEN.REFRESH_TOKEN.EXPIRES_IN;
    const { id, user } = payload;
    return {
      access_token: this.jwtService.sign(payload, {
        expiresIn: access_token_expired,
      }),
      refresh_token: this.jwtService.sign(
        { id, user_id: user.id },
        {
          expiresIn: refresh_token_expired,
        },
      ),
    };
  }

  async refresh(refresh_token: string) {
    let refreshPayload = null;
    try {
      refreshPayload = this.jwtService.verify(refresh_token);
    } catch (error) {
      return error;
    }

    const { user_id: uid } = refreshPayload;
    const user = await this.userService.findProfileByUid(uid);
    const { ...payload } = user;

    return {
      access_token: this.jwtService.sign(payload, {
        expiresIn: COMMON_CONFIG.TOKEN.ACCESS_TOKEN.EXPIRES_IN,
      }),
      refresh_token: this.jwtService.sign(
        { id: payload.id, user_id: uid },
        {
          expiresIn: COMMON_CONFIG.TOKEN.REFRESH_TOKEN.EXPIRES_IN,
        },
      ),
    };
  }
}
