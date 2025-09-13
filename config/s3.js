import { S3Client } from "@aws-sdk/client-s3";
import 'dotenv/config';

//take credential from variables environment
const s3Client = new S3Client({
    region: 'id',
    endpoint: process.env.S3_ENDPOINT,
    forcePathStyle: true, 
    credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY_ID,
        secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
    }
});

export {s3Client};