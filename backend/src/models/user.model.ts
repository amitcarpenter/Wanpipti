import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from "typeorm";

@Entity("users")
export class User {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ unique: true })
    username: string;

    @Column({ unique: true })
    email: string;

    @Column()
    password: string;

    @Column()
    fullname: string;

    @Column({ name: "phone_number" })
    phoneNumber: string;

    @Column({ name: "wallet_balance", type: "decimal", precision: 10, scale: 2, default: 0 })
    walletBalance: number;

    @Column({ name: "today_earning", type: "decimal", precision: 10, scale: 2, default: 0 })
    todayEarning: number;

    @Column({ name: "total_earning", type: "decimal", precision: 10, scale: 2, default: 0 })
    totalEarning: number;

    @Column({ name: "profile_image", nullable: true })
    profileImage: string;

    @CreateDateColumn({ name: "created_at" })
    createdAt: Date;

    @UpdateDateColumn({ name: "updated_at" })
    updatedAt: Date;
}