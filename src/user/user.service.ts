import { QueryDTO } from './../common/dto/query.dto';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entity/user.entity';
import { Profile } from './entity/profile.entity';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User) private readonly usersRepository: Repository<User>,
    @InjectRepository(Profile)
    private readonly profilesRepository: Repository<Profile>,
  ) {}

  /**
   * 查询用户，支持分页
   * @param queryDTO
   * @returns
   */
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

  /**
   * 按用户名查询
   * @param account
   * @returns
   */
  findOne(account: string) {
    return this.usersRepository
      .createQueryBuilder('user')
      .where('user.account = :account', {
        account,
      })
      .getOne();
  }

  /**
   * 按照uid查询用户资料
   * @param uid
   * @returns
   */
  findProfileByUid(uid: number) {
    return this.profilesRepository.findOneBy({
      uid,
    });
  }
}
