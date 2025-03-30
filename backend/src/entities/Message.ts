// src/entities/Message.ts
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from "typeorm";
import { Chat } from "./Chat";
import { User } from "./User";

@Entity("messages")
export class Message {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column()
    text!: string; 

    @ManyToOne(() => Chat, chat => chat.messages)
    chat!: Chat;

    @ManyToOne(() => User, { nullable: true })
    sender?: User;

    @Column()
    createdAt!: Date;
}