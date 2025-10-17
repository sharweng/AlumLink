import { StreamClient } from "@stream-io/node-sdk";

const apiKey = process.env.STREAM_API_KEY || process.env.VITE_STREAM_API_KEY;
const apiSecret = process.env.STREAM_API_SECRET;

// Generate Stream token for authenticated user
export const getStreamToken = async (req, res) => {
    try {
        const userId = req.user._id.toString();

        console.log("Stream token request for user:", userId);
        console.log("API Key configured:", !!apiKey);
        console.log("API Secret configured:", !!apiSecret);

        if (!apiKey || !apiSecret) {
            console.error("Missing Stream credentials. API Key:", !!apiKey, "API Secret:", !!apiSecret);
            return res.status(500).json({
                message: "Stream API credentials are not configured. Please check your environment variables.",
            });
        }

        // Initialize Stream client
        const client = new StreamClient(apiKey, apiSecret);

        // Generate token for the user
        const token = client.generateUserToken({ user_id: userId });

        console.log("Token generated successfully for user:", userId);

        res.status(200).json({
            token,
            apiKey,
            userId,
        });
    } catch (error) {
        console.error("Error generating Stream token:", error);
        console.error("Error details:", error.message);
        res.status(500).json({ 
            message: "Failed to generate video token",
            error: error.message 
        });
    }
};
