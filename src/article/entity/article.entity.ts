import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Article {
  @PrimaryGeneratedColumn()
  id: number;

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

  @Column({ type: 'int' })
  watch_num: number;

  @Column('int')
  comment_num: number;

  @Column('datetime')
  publish_date: string;
}
