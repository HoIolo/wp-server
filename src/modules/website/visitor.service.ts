import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
import { DailyVisitor } from './entity/visitor.entity';
import {
  CreateVisitorDTO,
  GetVisitorDTO,
  UpdateVisitorDTO,
} from './dto/visitor.dto';

@Injectable()
export class VisitorService {
  constructor(
    @InjectRepository(DailyVisitor)
    private readonly visitorRepository: Repository<DailyVisitor>,
  ) {}

  /**
   * 创建或更新访问记录
   * @param createVisitorDto 访问记录数据
   * @returns 创建或更新的访问记录
   */
  async createOrUpdate(createVisitorDto: CreateVisitorDTO) {
    const { date } = createVisitorDto;
    // 查找当天是否已有记录
    const existRecord = await this.visitorRepository.findOne({
      where: { date },
    });

    if (existRecord) {
      // 更新已有记录
      existRecord.count += createVisitorDto.count;
      if (createVisitorDto.remark) {
        existRecord.remark = createVisitorDto.remark;
      }
      return this.visitorRepository.save(existRecord);
    } else {
      // 创建新记录
      const newVisitor = this.visitorRepository.create(createVisitorDto);
      return this.visitorRepository.save(newVisitor);
    }
  }

  /**
   * 增加指定日期的访问量
   * @param date 日期字符串，格式为YYYY-MM-DD
   * @param count 增加的访问量，默认为1
   * @returns 更新后的访问记录
   */
  async incrementVisitor(date: string, count: number = 1) {
    // 查找当天是否已有记录
    let record = await this.visitorRepository.findOne({
      where: { date },
    });

    if (record) {
      // 更新已有记录
      record.count += count;
      return this.visitorRepository.save(record);
    } else {
      // 创建新记录
      record = this.visitorRepository.create({
        date,
        count,
      });
      return this.visitorRepository.save(record);
    }
  }

  /**
   * 获取指定日期范围内的访问记录
   * @param getVisitorDto 包含开始日期和结束日期的DTO
   * @returns 日期范围内的访问记录列表
   */
  async findByDateRange(getVisitorDto: GetVisitorDTO) {
    const { startDate, endDate } = getVisitorDto;
    return this.visitorRepository.find({
      where: {
        date: Between(startDate, endDate),
      },
      order: {
        date: 'ASC',
      },
    });
  }

  /**
   * 获取所有访问记录
   * @returns 所有访问记录列表
   */
  async findAll() {
    return this.visitorRepository.find({
      order: {
        date: 'DESC',
      },
    });
  }

  /**
   * 获取指定日期的访问记录
   * @param date 日期字符串，格式为YYYY-MM-DD
   * @returns 指定日期的访问记录
   */
  async findByDate(date: string) {
    return this.visitorRepository.findOne({
      where: { date },
    });
  }

  /**
   * 更新指定日期的访问记录
   * @param date 日期字符串，格式为YYYY-MM-DD
   * @param updateVisitorDto 更新的数据
   * @returns 更新后的访问记录
   */
  async update(date: string, updateVisitorDto: UpdateVisitorDTO) {
    const record = await this.visitorRepository.findOne({
      where: { date },
    });

    if (!record) {
      return null;
    }

    if (updateVisitorDto.count !== undefined) {
      record.count = updateVisitorDto.count;
    }

    if (updateVisitorDto.remark !== undefined) {
      record.remark = updateVisitorDto.remark;
    }

    return this.visitorRepository.save(record);
  }

  /**
   * 获取总访问量
   * @returns 所有记录的访问量总和
   */
  async getTotalVisits() {
    const result = await this.visitorRepository
      .createQueryBuilder('visitor')
      .select('SUM(visitor.count)', 'total')
      .getRawOne();

    return result?.total || 0;
  }
}
