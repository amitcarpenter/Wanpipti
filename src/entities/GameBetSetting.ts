import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Game } from './Game';

@Entity()
export class GameBetSetting {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  bet_number: number;

  @Column({ nullable: true })
  max_bet_limit: number;

  @Column()
  set_date: Date;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
