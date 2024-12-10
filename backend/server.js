const express = require('express');
const multer = require('multer');
const { exec } = require('child_process');
const ffmpeg = require('fluent-ffmpeg');
const path = require('path');
const fs = require('fs');

const app = express();
const upload = multer({ dest: 'temp/' });

app.post('/upload', upload.single('video'), (req, res) => {
    if (!req.file) {
        return res.status(400).send('No video file uploaded');
    }

    const videoPath = req.file.path;
    const audioPath = path.resolve(`${videoPath}.wav`);
    const processedAudioPath = path.resolve(`${videoPath}-processed.wav`);
    const outputVideoPath = path.resolve(`${videoPath}-output.mp4`);

    console.log('Paths:', { videoPath, audioPath, processedAudioPath, outputVideoPath });

    // Step 1: Extract audio
    ffmpeg(videoPath)
        .output(audioPath)
        .on('end', () => {
            console.log('Audio extraction completed:', audioPath);

            // Step 2: Process audio
            exec(`python3.11 scripts/process_audio.py ${audioPath} ${processedAudioPath}`, (err, stdout, stderr) => {
                if (err) {
                    console.error('Error during audio processing:', stderr);
                    cleanUp([videoPath, audioPath]);
                    return res.status(500).send('Audio processing failed');
                }

                console.log('Audio processing completed:', processedAudioPath);

                // Step 3: Merge audio back into video
                ffmpeg(videoPath)
                    .addInput(processedAudioPath)
                    .outputOptions([
                        '-map 0:v:0', // Map video stream from the original file
                        '-map 1:a:0', // Map audio stream from the processed audio
                        '-c:v copy',  // Copy video codec to avoid re-encoding
                        '-shortest'   // Ensure the output matches the shortest stream (video or audio)
                    ])
                    .output(outputVideoPath)
                    .on('end', () => {
                        console.log('Video processing completed:', outputVideoPath);

                        // Send the file with an absolute path
                        res.sendFile(outputVideoPath, (sendErr) => {
                            if (sendErr) {
                                console.error('Error sending file:', sendErr);
                            }
                            // Clean up temporary files
                            cleanUp([videoPath, audioPath, processedAudioPath, outputVideoPath]);
                        });
                    })
                    .on('error', (mergeErr) => {
                        console.error('Error during video merging:', mergeErr);
                        cleanUp([videoPath, audioPath, processedAudioPath]);
                        res.status(500).send('Video merging failed');
                    })
                    .run();

            });
        })
        .on('error', (extractErr) => {
            console.error('Error during audio extraction:', extractErr);
            cleanUp([videoPath]);
            res.status(500).send('Audio extraction failed');
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

app.listen(3001, () => {
    console.log('Backend running on http://localhost:3001');
});
