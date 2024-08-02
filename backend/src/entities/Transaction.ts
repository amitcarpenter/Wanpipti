import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { User } from './User';

@Entity()
export class Transaction {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User)
  user: User;

  @Column()
  transaction_type: string; // "deposit", "betPlace" , "betWin"or "withdraw"

  @Column({ type: 'decimal' })
  amount: number;

  @Column()
  status: string; // "pending", "completed", "failed" 

  @Column({ type: 'decimal', nullable: true })
  closing_balance: number; // New field for closing balance

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
