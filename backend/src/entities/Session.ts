import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne } from "typeorm";
import { User } from "./User";
// import "reflect-metadata";

@Entity("sessions")
export class Session {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @ManyToOne(() => User, user => user.sessions)
    user!: User;

    @Column({ nullable: true })
    userAgent?: string;

    @CreateDateColumn()
    createdAt!: Date;

    @Column()
    expiresAt!: Date;
}