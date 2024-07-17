import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity()
export class GameSetting {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'decimal' })
  max_bet_limit: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
