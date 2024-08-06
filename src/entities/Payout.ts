import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { User } from './User';
import { Bet } from './Bet';
import { Game } from './Game';

@Entity()
export class Payout {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User)
  user: User;

  @ManyToOne(() => Bet)
  bet: Bet;

  @ManyToOne(() => Game)
  game: Game;

  @Column({ type: 'decimal' })
  amount: number;

  @Column()
  status: string; // "deposit", "bet", "withdraw"

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
