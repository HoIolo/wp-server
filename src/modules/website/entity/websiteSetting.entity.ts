import { BaseEntity } from 'src/common/entity/base.entity';
import { Column, Entity } from 'typeorm';

@Entity()
export class WebsiteSetting extends BaseEntity {
  @Column({ type: 'text' })
  logo_text: string;

  @Column({ type: 'text' })
  typed_text: string;

  @Column({ type: 'varchar', length: 255 })
  footer_text: string;
}
