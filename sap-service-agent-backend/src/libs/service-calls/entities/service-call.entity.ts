import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ServiceCallStatus } from '../enums/service-call-status';
import { RequestDetails } from '../types/service-call-details.interface';
import { ResponseDetails } from '../types/response-details.interface';

@Entity({ name: 'service_calls' })
export class ServiceCallEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 50 })
  status: ServiceCallStatus;

  @Column({ type: 'timestamp' })
  scheduledAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  executedAt: Date | null;

  @Column({ type: 'jsonb' })
  requestDetails: RequestDetails;

  @Column({ type: 'jsonb', nullable: true })
  responseDetails?: ResponseDetails;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
