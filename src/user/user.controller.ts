import { UserService } from './user.service';
import { QueryDTO } from './../common/dto/query.dto';
import { Controller, Get, Post, Query } from '@nestjs/common';

@Controller()
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('/users')
  async getUsers(@Query() queryDTO: QueryDTO) {
    const [rows, count] = await this.userService.find(queryDTO);
    return {
      rows,
      count,
    };
  }

  @Post('/login')
  login() {
    return null;
  }
}
