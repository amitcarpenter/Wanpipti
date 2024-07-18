import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity()
export class User {
    @PrimaryGeneratedColumn()
    id: number ;

    @Column({ unique: true })
    email: string;

    @Column({ unique: true, nullable: true })
    username: string;

    @Column({ nullable: true })
    password: string;

    @Column({ nullable: true })
    full_name: string;

    @Column({ default: "user" })
    role: string;

    @Column({ type: 'decimal', default: 0 })
    wallet_balance: number;

    @Column({ nullable: true })
    profile_image: string;

    @Column({ type: 'decimal', default: 0 })
    today_earning: number;

    @Column({ type: 'decimal', default: 0 })
    total_earning: number;

    @Column({ nullable: true })
    jwt_token: string;

    @Column({ nullable: true })
    google_signup_token: string;

    @Column({ nullable: true, type: 'varchar', length: 64 })
    reset_password_token: string | null;

    @Column({ type: 'timestamp', nullable: true, default: null })
    reset_password_token_expiry: Date | null;

    @Column({ default: "traditional" })
    signup_method: string; // "google" or "traditional"

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;
}
