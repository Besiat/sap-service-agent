import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
  Unique,
} from 'typeorm';

@Entity({ name: 'favorites' })
@Index(['userId'])
@Unique(['userId', 'serviceCallId'])
export class FavoriteEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  userId: string;

  @Column({ type: 'uuid' })
  serviceCallId: string;

  @CreateDateColumn()
  createdAt: Date;
}
