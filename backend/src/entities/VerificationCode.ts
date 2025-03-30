import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne } from "typeorm";
import { User } from "./User";

@Entity("verification_codes")
export class VerificationCode {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @ManyToOne(() => User, user => user.verificationCodes)
    user!: User;

    @Column()
    type!: string;

    @CreateDateColumn()
    createdAt!: Date;

    @Column()
    expiresAt!: Date;
}