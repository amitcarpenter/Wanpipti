import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne } from 'typeorm';
import { Game } from './Game';
import { Bet } from './Bet';
import { User } from './User';

@Entity()
export class Result {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => Game)
    game: Game;

    @ManyToOne(() => Bet)
    bet: Bet;

    @ManyToOne(() => User)
    user: User;

    @Column({ type: 'boolean' })
    is_winning: boolean;

    @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
    winning_amount: number;

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;
}
