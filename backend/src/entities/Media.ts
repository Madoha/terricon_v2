import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from "typeorm";
import { Incident } from "./Incident";

@Entity("media")
export class Media {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column()
    url!: string; 

    @Column()
    type!: string;

    @ManyToOne(() => Incident, incident => incident.mediaFiles)
    incident!: Incident;
}