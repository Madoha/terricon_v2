import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from "typeorm";
import { Session } from "./Session";
import { VerificationCode } from "./VerificationCode";
import { compareValue } from "../utils/bcrypt";
import { UserRole } from "../constants/userRole";
import { Incident } from "./Incident";
import { Chat } from "./Chat";
import { Message } from "./Message";

@Entity('users')
export class User {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column()
    username!: string;

    @Column({ unique: true })
    email!: string;

    @Column()
    password!: string;

    @Column({ nullable: true })
    firstName?: string;

    @Column({ nullable: true })
    lastName?: string;

    @Column({ nullable: true })
    phoneNumber?: string;

    @Column({ nullable: true })
    address?: string;

    @Column({ nullable: true })
    city?: string;

    @Column({ nullable: true })
    region?: string;

    @Column({ default: false })
    verified!: boolean;

    @Column({
        type: "enum",
        enum: UserRole,
        default: UserRole.USER
    })
    role!: UserRole;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;

    @OneToMany(() => Session, session => session.user)
    sessions?: Session[];

    @OneToMany(() => VerificationCode, verificationCode => verificationCode.user)
    verificationCodes?: VerificationCode[];

    @OneToMany(() => Incident, incident => incident.user)
    incidents?: Incident[];

    @OneToMany(() => Chat, chat => chat.user)
    chats?: Chat[];

    @OneToMany(() => Message, message => message.sender)
    messages?: Message[];

    async comparePassword(val: string): Promise<boolean> {
        return compareValue(val, this.password);
    }

    omitPassword(): Pick<User, "id" | "email" | "verified" | "createdAt" | "updatedAt" | "firstName" | "lastName" | "phoneNumber" | "address" | "city" | "region" | "role" | "username"> {
        return {
            id: this.id,
            email: this.email,
            verified: this.verified,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
            firstName: this.firstName,
            lastName: this.lastName,
            phoneNumber: this.phoneNumber,
            address: this.address,
            city: this.city,
            region: this.region,
            role: this.role,
            username: this.username
        };
    }
}