import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { User } from './User';
import { Game } from './Game';

@Entity()
export class Bet {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User)
  user: User;

  @ManyToOne(() => Game)
  game: Game;

  @Column()
  choosen_number: string;

  @Column({ type: 'decimal' })
  bet_amount: number;

  @Column({ default: false })
  is_winner: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
