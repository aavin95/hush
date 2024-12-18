import express from "express";
import multer from "multer";
import { exec } from "child_process";
import ffmpeg from "fluent-ffmpeg";
import path from "path";
import fs from "fs";
import dotenv from "dotenv";
import cors from "cors";
import { v4 as uuidv4 } from "uuid";
import { createClient } from "@supabase/supabase-js";

dotenv.config({ path: path.join(process.cwd(), "../.env") });
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    throw new Error("Missing required environment variables");
}

const supabasePublic = createClient(
    process.env.SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const supabaseAdmin = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

const app = express();
const upload = multer({ dest: "temp/" });
app.use(cors({ origin: "http://localhost:3000" }));

// Middleware to verify the Supabase user using the PUBLIC anon key
const authenticateUser = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).send("Unauthorized");
    }

    const token = authHeader.split(" ")[1];
    const { data: { user }, error } = await supabasePublic.auth.getUser(token);

    if (error || !user) {
        console.error("Token verification failed:", error);
        return res.status(401).send("Unauthorized");
    }

    req.user = user;
    next();
};

app.post("/upload", authenticateUser, upload.single("video"), async (req, res) => {
    // Check if a file was uploaded
    if (!req.file) {
        return res.status(400).send("No video file uploaded");
    }

    // Access the user from req set by authenticateUser middleware
    const supabaseUser = req.user;

    // Ensure the user exists in the database
    const userId = supabaseUser.id;

    const videoPath = req.file.path;
    const audioPath = path.resolve(`${videoPath}.wav`);
    const processedAudioPath = path.resolve(`${videoPath}-processed.wav`);
    const outputVideoPath = path.resolve(`${videoPath}-output.mp4`);

    // Process the video
    ffmpeg(videoPath)
        .output(audioPath)
        .on("end", () => {
            console.log("Audio extraction completed:", audioPath);

            // Step 2: Process audio
            exec(
                `python3.11 scripts/process_audio.py ${audioPath} ${processedAudioPath}`,
                async (err, stdout, stderr) => {
                    if (err) {
                        console.error("Error during audio processing:", stderr);
                        cleanUp([videoPath, audioPath, processedAudioPath]);
                        return res.status(500).send("Audio processing failed");
                    }

                    console.log("Audio processing completed:", processedAudioPath);

                    // Step 3: Merge audio back into video
                    ffmpeg(videoPath)
                        .addInput(processedAudioPath)
                        .outputOptions(["-map 0:v:0", "-map 1:a:0", "-c:v copy", "-shortest"])
                        .output(outputVideoPath)
                        .on("end", async () => {
                            console.log("Video processing completed:", outputVideoPath);
                            const filePath = `${userId}/${uuidv4()}.mp4`;

                            console.log("Uploading file to path:", filePath);

                            const { data, error } = await supabaseAdmin.storage
                                .from("videos")
                                .upload(
                                    filePath,
                                    fs.createReadStream(outputVideoPath, { emitClose: true }),
                                    {
                                        duplex: "half",
                                        upsert: false,
                                        contentType: "video/mp4",
                                    }
                                );

                            if (error) {
                                console.error("Error uploading video to Supabase:", error);
                                cleanUp([videoPath, audioPath, processedAudioPath, outputVideoPath]);
                                return res.status(500).send("Video upload failed");
                            }

                            console.log("Uploaded video to Supabase");

                            // Generate public URL for the uploaded video
                            const { data: publicUrlData } = supabaseAdmin.storage
                                .from("videos")
                                .getPublicUrl(filePath);

                            if (!publicUrlData) {
                                console.error("Failed to generate public URL");
                                cleanUp([videoPath, audioPath, processedAudioPath, outputVideoPath]);
                                return res.status(500).send("Failed to generate public URL");
                            }

                            // Insert video metadata into the database
                            const { error: insertError } = await supabaseAdmin
                                .from("Video")
                                .insert({
                                    file_url: publicUrlData.publicUrl,
                                    userId,
                                });

                            if (insertError) {
                                console.error("Error inserting video metadata:", insertError);
                                cleanUp([videoPath, audioPath, processedAudioPath, outputVideoPath]);
                                return res.status(500).send("Error saving video metadata");
                            }

                            cleanUp([videoPath, audioPath, processedAudioPath, outputVideoPath]);
                            res.status(200).send("Video processed and uploaded successfully");
                        })
                        .on("error", (mergeErr) => {
                            console.error("Error during video merging:", mergeErr);
                            cleanUp([videoPath, audioPath, processedAudioPath, outputVideoPath]);
                            res.status(500).send("Video merging failed");
                        })
                        .run();
                }
            );
        })
        .on("error", (extractErr) => {
            console.error("Error during audio extraction:", extractErr);
            cleanUp([videoPath]);
            res.status(500).send("Audio extraction failed");
        })
        .run();
});

// Utility function to clean up temporary files
const cleanUp = (filePaths) => {
    filePaths.forEach((filePath) => {
        fs.unlink(filePath, (err) => {
            if (err) console.error(`Failed to delete file ${filePath}:`, err);
        });
    });
};

// Start the backend server
app.listen(3001, () => {
    console.log("Backend running on http://localhost:3001");
});
