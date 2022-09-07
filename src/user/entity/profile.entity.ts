import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Profile {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Column({ type: 'bigint' })
  uid: number;

  @Column()
  name: string;

  @Column()
  signature: string;

  @Column({
    default:
      'https://gw.alicdn.com/i4/710600684/O1CN01bNcLnV1GvJd3wK1k2_!!710600684.jpg_Q75.jpg_.webp',
  })
  avatar: string;

  @Column({ default: 0 })
  sex: number;

  @Column({ default: 0 })
  article_num: number;
}
