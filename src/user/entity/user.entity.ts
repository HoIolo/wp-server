import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity()
export class User {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Column({ type: 'varchar', length: 25 })
  @Index()
  account: string;

  @Column({ type: 'varchar', length: 25 })
  password: string;

  @Column({ type: 'varchar', length: 25 })
  email: string;

  @CreateDateColumn()
  sign_time: string;

  @Column({ type: 'varchar', length: 25 })
  salt: string;

  @Column({ type: 'int', default: 1 })
  role: number;
}
