import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany } from "typeorm";
import { User } from "./User";
import { Media } from "./Media";

@Entity("incidents")
export class Incident {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column()
    description!: string;

    @Column("float")
    latitude!: number;

    @Column("float")
    longitude!: number;

    @Column()
    timestamp!: Date;

    @Column({ nullable: true })
    address?: string;

    @Column({ default: false})
    isAnonymous!: boolean

    @ManyToOne(() => User, user => user.incidents, { nullable: true })
    user?: User;

    // @Column()
    // userId?: string

    @OneToMany(() => Media, media => media.incident, { cascade: true })
    mediaFiles?: Media[];

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}