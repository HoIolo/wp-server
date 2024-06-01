import { Injectable } from '@nestjs/common';
import { WebsiteSetting } from './entity/websiteSetting.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GetSettingDto } from './dto/getSetting.dto';
import { CommonService } from 'src/common/service/common.service';
import { UpdateSettingDto } from './dto/updateSetting.dto';

@Injectable()
export class WebsiteService {
  constructor(
    @InjectRepository(WebsiteSetting)
    private readonly websiteSettingRepository: Repository<WebsiteSetting>,
    private readonly commonService: CommonService,
  ) {}

  /**
   * 获取网站设置
   * @param getSettingDto
   * @returns
   */
  findSetting(
    getSettingDto: GetSettingDto,
  ): Promise<[WebsiteSetting[], number]> {
    const queryBuilder = this.commonService.pager(
      getSettingDto,
      this.websiteSettingRepository,
    );

    return queryBuilder.getManyAndCount();
  }

  /**
   * 新增网站设置
   * @param websiteSetting
   * @returns
   */
  create(websiteSetting: WebsiteSetting): Promise<WebsiteSetting> {
    return this.websiteSettingRepository.save(websiteSetting);
  }

  /**
   * 更新网站设置
   * @param updateSettingDto
   * @param id
   * @returns
   */
  update(updateSettingDto: UpdateSettingDto, id: number) {
    return this.websiteSettingRepository.update({ id: id }, updateSettingDto);
  }

  /**
   * 删除（软删除）
   * @param id
   * @returns
   */
  delete(id: number) {
    return this.websiteSettingRepository
      .createQueryBuilder()
      .softDelete()
      .where('id = :id', { id })
      .execute();
  }
}
