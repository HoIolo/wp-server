import { QueryDTO } from './../common/dto/query.dto';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entity/user.entity';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User) private readonly usersRepository: Repository<User>,
  ) {}

  find(queryDTO: QueryDTO) {
    let { page = 1, offset = 10 } = queryDTO;
    if (isNaN(Number(page))) page = Number(page);
    if (isNaN(Number(offset))) offset = Number(offset);
    const skip = ((page as number) - (offset as number)) * Number(offset);
    return this.usersRepository
      .createQueryBuilder()
      .skip(skip)
      .limit(offset as number)
      .getManyAndCount();
  }
}
