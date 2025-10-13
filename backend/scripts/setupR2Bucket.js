import { S3Client, PutBucketPolicyCommand, GetBucketPolicyCommand } from "@aws-sdk/client-s3";
import dotenv from "dotenv";

dotenv.config();

const r2Client = new S3Client({
    region: "auto",
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    },
});

const bucketPolicy = {
    Version: "2012-10-17",
    Statement: [
        {
            Sid: "PublicRead",
            Effect: "Allow",
            Principal: "*",
            Action: ["s3:GetObject"],
            Resource: [`arn:aws:s3:::${process.env.R2_BUCKET_NAME}/*`]
        }
    ]
};

async function setupBucket() {
    try {
        console.log("Setting up R2 bucket for public access...");
        
        // Check current policy
        try {
            const getCommand = new GetBucketPolicyCommand({
                Bucket: process.env.R2_BUCKET_NAME,
            });
            const currentPolicy = await r2Client.send(getCommand);
            console.log("Current policy:", currentPolicy.Policy);
        } catch (error) {
            console.log("No existing policy found.");
        }

        // Set public read policy
        const putCommand = new PutBucketPolicyCommand({
            Bucket: process.env.R2_BUCKET_NAME,
            Policy: JSON.stringify(bucketPolicy),
        });

        await r2Client.send(putCommand);
        console.log("✅ Bucket policy set successfully!");
        console.log("Your bucket is now configured for public reads.");
        
    } catch (error) {
        console.error("❌ Error setting up bucket:", error.message);
        if (error.Code === 'NotImplemented') {
            console.log("\n⚠️  R2 doesn't support bucket policies through API.");
            console.log("Please enable public access through the Cloudflare dashboard:");
            console.log("1. Go to R2 → Your bucket → Settings");
            console.log("2. Under 'Public Access', click 'Allow Access'");
            console.log("3. Make sure the public dev URL is enabled");
        }
    }
}

setupBucket();
