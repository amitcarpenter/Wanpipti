import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Game } from './Game';

@Entity()
export class GameSetting {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  max_bet_limit: number;

  @Column()
  game_id: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
