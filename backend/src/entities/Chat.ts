import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany } from "typeorm";
import { User } from "./User";
import { Message } from "./Message";
import { ChatStatus } from "../constants/chatStatus";

@Entity("chats")
export class Chat {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({ default: false })
    isAnonymous!: boolean;

    @Column({ default: ChatStatus.OPEN })
    status!: ChatStatus;

    @ManyToOne(() => User, user => user.chats, { nullable: true })
    user?: User; 

    @ManyToOne(() => User, { nullable: true })
    officer?: User;

    @OneToMany(() => Message, message => message.chat)
    messages?: Message[];
}