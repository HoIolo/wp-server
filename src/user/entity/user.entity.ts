import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class User {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Column({ type: 'varchar', length: 25 })
  account: string;

  @Column({ type: 'varchar', length: 25 })
  password: string;

  @Column({ type: 'varchar', length: 25 })
  email: string;

  @Column({ type: 'datetime' })
  sign_time: string;

  @Column({ type: 'int', default: 0 })
  role: number;
}
