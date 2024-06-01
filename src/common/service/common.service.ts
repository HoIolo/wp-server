import { handlePage } from 'src/utils/common';
import { PageDTO } from '../dto/page.dto';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { Injectable } from '@nestjs/common';

@Injectable()
export class CommonService {
  /**
   * 通用分页服务
   * @description 分页
   * @param pageDto
   * @param repository
   * @param orderByField  默认ID
   */
  pager = (
    pageDto: PageDTO,
    repository: Repository<any>,
    orderByField = 'id',
  ): SelectQueryBuilder<any> => {
    const { field, keyword, sorted = 'DESC' } = pageDto;
    const { skip, offset } = handlePage(pageDto);

    const queryBuild = repository
      .createQueryBuilder()
      .skip(skip)
      .take(offset as number)
      .orderBy(orderByField, sorted);
    if (field && keyword) {
      queryBuild.andWhere(`${field} like :keyword`, {
        keyword: `%${keyword}%`,
      });
    }

    return queryBuild;
  };
}
