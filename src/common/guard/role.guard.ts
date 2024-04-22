import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { Observable } from 'rxjs';
import { Profile } from 'src/modules/user/entity/profile.entity';
import { UserService } from 'src/modules/user/user.service';
import { GUARD_RESPONSE, metadata, roles } from '../../constant';

@Injectable()
export class RoleGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
  ) {}

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest<Request>();

    const role =
      this.reflector.get<number>(metadata.ROLE, context.getHandler()) ||
      this.reflector.get<number>(metadata.ROLE, context.getClass());

    if (role === undefined) {
      return false;
    }
    let token = request.headers['authorization'];
    // 游客权限为0, 不需要登录
    if (role === roles.VISITOR) {
      return true;
    } else if (token === undefined || !token) {
      // 需要更高的权限，但是没有登陆
      throw new HttpException(
        GUARD_RESPONSE.NOT_LOGIN,
        HttpStatus.UNAUTHORIZED,
      );
    }
    if (token) {
      token = token.split(' ')[1];
    }
    let userProfile: Profile = null;
    try {
      userProfile =
        (request.user as Profile) || (this.jwtService.verify(token) as Profile);
    } catch (e) {
      throw new HttpException(e, HttpStatus.UNAUTHORIZED);
    }

    // 未登录，游客，放行
    if (!userProfile) return true;

    return this.userService.matchRole(role, userProfile.user?.id);
  }
}
