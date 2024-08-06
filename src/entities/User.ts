import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Role } from './Role';

@Entity()
export class User {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ unique: true })
    email: string;

    @Column({ unique: true, nullable: true })
    username: string;

    @Column({ nullable: true })
    password: string;

    @Column({ nullable: true })
    full_name: string;

    @ManyToOne(() => Role, { eager: true })
    @JoinColumn({ name: 'role_id' })
    role: Role;


    @Column({ nullable: true })
    profile_image: string;


    @Column({ nullable: true })
    jwt_token: string;

    @Column({ nullable: true })
    google_signup_token: string;

    @Column({ nullable: true, type: 'varchar', length: 64 })
    reset_password_token: string | null;

    @Column({ type: 'timestamp', nullable: true, default: null })
    reset_password_token_expiry: Date | null;

    @Column({ nullable: true, type: 'varchar', length: 64 })
    verify_token: string | null;

    @Column({ type: 'timestamp', nullable: true, default: null })
    verify_token_expiry: Date | null;

    @Column({ default: "traditional" })
    signup_method: string;

    @Column({ type: 'boolean', default: false })
    is_verified: boolean;

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;
}
