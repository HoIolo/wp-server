import {
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
} from 'typeorm';

export abstract class BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @CreateDateColumn({ name: 'create_time' })
  createTime: Date | null;

  @UpdateDateColumn({ name: 'update_time' })
  updatedTime: Date | null;

  @DeleteDateColumn({
    name: 'delete_at',
    nullable: true,
  })
  deleteAt: Date | null;
}
