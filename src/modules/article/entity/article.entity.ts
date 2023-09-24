import { BaseEntity } from 'src/common/entity/base.entity';
import { Column, Entity, Index } from 'typeorm';

@Entity()
export class Article extends BaseEntity {
  @Column({ type: 'bigint' })
  @Index()
  author_id: number;

  @Column()
  title: string;

  @Column()
  type: string;

  @Column()
  description: string;

  @Column()
  pic: string;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'int', default: 0 })
  watch_num: number;

  @Column({ type: 'int', default: 0 })
  comment_num: number;

  @Column({ type: 'datetime' })
  publish_date: string;
}
