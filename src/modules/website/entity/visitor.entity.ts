import { BaseEntity } from 'src/common/entity/base.entity';
import { Column, Entity, Index } from 'typeorm';

@Entity()
export class DailyVisitor extends BaseEntity {
  @Column({ type: 'date' })
  @Index()
  date: string;

  @Column({ type: 'int', default: 0 })
  count: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  remark: string;
}
