import {s3Client} from '../config/s3.js';
import {Upload} from '@aws-sdk/lib-storage';
import {v4 as uuidv4} from 'uuid'; //for create unique file name
import 'dotenv/config';

const BUCKET_NAME = process.env.S3_BUCKET_NAME;

const uploadToS3 = async (fileBuffer, fileMimetype) => {
    try {
        const fileName = `${uuidv4()}-${Date.now()}.${fileMimetype.split('/')[1]}`;

        const uploadParams = {
            Bucket: BUCKET_NAME,
            Key: fileName,
            Body: fileBuffer,
            ContentType: fileMimetype,
            ACL: 'public-read'
        };

        const upload = new Upload({
            client: s3Client,
            params: uploadParams
        });

        const data = await upload.done();

        return data.Location;
    } catch (err) {
        throw new Error(`Failed to upload file to S3: ${err.message}`);
    }
}

export {uploadToS3};