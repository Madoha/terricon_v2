import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from "typeorm";

@Entity("faqs")
export class FAQ {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column()
    question!: string;

    @Column()
    answer!: string;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}