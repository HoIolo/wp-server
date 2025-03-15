import { BaseEntity } from 'src/common/entity/base.entity';
import { Profile } from 'src/modules/user/entity/profile.entity';
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';

@Entity()
export class ChatMessage extends BaseEntity {
  @ManyToOne(() => Profile, { nullable: false })
  @JoinColumn({ name: 'user_id' })
  user: Profile;

  @Column({ type: 'varchar', length: 500 })
  msg: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  socketId: string;
}
