import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Game } from './Game';

@Entity()
export class GameBetSetting {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  bet_number: number;

  @Column()
  max_bet_limit: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
