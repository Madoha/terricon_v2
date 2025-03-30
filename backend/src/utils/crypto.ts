import crypto from 'crypto';

const algorithm = 'aes-256-ctr';
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY!;

export const encrypt = (text: string) => {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(algorithm, Buffer.from(ENCRYPTION_KEY), iv);
    const encrypted = Buffer.concat([cipher.update(text), cipher.final()]);
    return { iv: iv.toString('hex'), content: encrypted.toString('hex') };
};

export const decrypt = (hash: { iv: string; content: string }) => {
    const decipher = crypto.createDecipheriv(
        algorithm, 
        Buffer.from(ENCRYPTION_KEY), 
        Buffer.from(hash.iv, 'hex')
    );
    return Buffer.concat([
        decipher.update(Buffer.from(hash.content, 'hex')),
        decipher.final()
    ]).toString();
};