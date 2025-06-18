import { CreateDateColumn, DeleteDateColumn, UpdateDateColumn } from 'typeorm';

export class BaseEntity {
  @CreateDateColumn({
    type: 'timestamptz',
  })
  createdAt?: string;

  @UpdateDateColumn({
    type: 'timestamptz',
  })
  updatedAt?: string;

  @DeleteDateColumn({
    type: 'timestamptz',
  })
  deletedAt?: string;
}
