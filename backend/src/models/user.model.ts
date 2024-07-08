import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from "typeorm";

@Entity('users')
export class User {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ unique: true })
    username!: string;

    @Column()
    password!: string;

    @Column({ unique: true })
    email!: string;

    @Column({ type: 'decimal', precision: 10, scale: 2, default: 0.00 })
    wallet_balance!: number;

    @Column()
    first_name!: string;

    @Column()
    last_name!: string;

    @Column()
    phone_number!: string;

    @Column()
    address!: string;

    @CreateDateColumn({ type: 'timestamp' })
    created_at!: Date;

    @UpdateDateColumn({ type: 'timestamp' })
    updated_at!: Date;
}
