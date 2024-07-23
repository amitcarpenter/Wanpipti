import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity()
export class Game {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  game_time: string; // "2pm", "5pm", "9pm"

  @Column()
  status: string; // "completed", "active", "cancelled"

  @Column({ nullable: true })
  winning_number: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
