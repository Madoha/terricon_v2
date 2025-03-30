import { createConnection, In } from "typeorm";
import { User } from "../entities/User";
import { Session } from "../entities/Session";
import { VerificationCode } from "../entities/VerificationCode";
import { FAQ } from "../entities/FAQ";
import { POSTGRES_URI } from "../constants/env";
import { Incident } from "../entities/Incident";
import { Media } from "../entities/Media";
import { Chat } from "../entities/Chat";
import { Message } from "../entities/Message";

const connectToDatabase = async () => {
    try {
        await createConnection({
            type: "postgres",
            url: POSTGRES_URI,
            entities: [User, Session, VerificationCode, FAQ, Incident, Media, Chat, Message],
            synchronize: true // for development only, set to false in production
        });
        console.log('Connected to DB');
    } catch (error) {
        console.log('Could not connect to database', error);
        process.exit(1);
    }
};

export default connectToDatabase;