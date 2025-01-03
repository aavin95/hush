# Hush - Video Audio Enhancement Application

## Overview
Hush is a full-stack application that enhances the audio quality of uploaded videos using AI-powered audio processing. The application is built with Next.js for the frontend, Flask for the backend, and uses Supabase for authentication and storage.

## Features
- User authentication via Supabase
- Video upload and processing
- AI-powered audio enhancement using DeepFilterNet
- Real-time processing status updates
- Secure file handling and storage
- Responsive design

## Tech Stack
- Frontend: Next.js, TypeScript, Styled Components
- Backend: Flask, Python
- Database: PostgreSQL (via Supabase)
- Authentication: Supabase Auth
- Storage: Supabase Storage
- Audio Processing: DeepFilterNet, FFmpeg

## Prerequisites
- Node.js (v14 or higher)
- Python 3.11
- FFmpeg
- PostgreSQL
- Supabase account

## Project Structure
```
├── frontend/          # Next.js frontend application
├── backend/           # Flask backend server
├── lib/              # Shared library code
├── prisma/           # Database schema and migrations
└── supabase/         # Supabase configuration
```

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/hush.git
cd hush
```

2. Install dependencies:
```bash
# Root dependencies
npm install

# Frontend dependencies
cd frontend
npm install

# Backend dependencies
cd ../backend
pip install -r requirements.txt
```

3. Set up environment variables:

Create a `.env` file in the root directory:
```
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Database
DATABASE_URL=your_database_url
```

4. Set up the database:
```bash
cd frontend
npx prisma generate
npx prisma db push
```

5. Start the development servers:

In one terminal (frontend):
```bash
cd frontend
npm run dev
```

In another terminal (backend):
```bash
cd backend
python server.py
```

The application will be available at `http://localhost:3000`

## Configuration

### Supabase Setup
1. Create a new Supabase project
2. Enable authentication and storage
3. Configure authentication providers as needed
4. Update environment variables with your Supabase credentials

### Backend Configuration
The backend server (referenced in `backend/server.py`) handles:
- Video upload processing
- Audio extraction and enhancement
- File management
- Authentication verification

For reference, see:

```1:200:backend/server.py
"""Flask server for video processing and storage with Supabase integration."""

import os
import uuid
import subprocess
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
from supabase import create_client, Client
import shutil
import time

load_dotenv()

SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
SUPABASE_ANON_KEY = os.environ.get("NEXT_PUBLIC_SUPABASE_ANON_KEY")

if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY or not SUPABASE_ANON_KEY:
    raise ValueError("Missing required Supabase environment variables")

# Initialize Supabase clients
supabase_public: Client = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)
supabase_admin: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

app = Flask(__name__)
CORS(app, origins=["http://localhost:3000", "https://hush.andrewvincent.dev",
                   "https://hush-frontend-chi.vercel.app", "https://hush-uqt8.onrender.com"],
                   supports_credentials=True)

UPLOAD_FOLDER = "temp"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

def authenticate_user():
    """Verify user authentication using Supabase token from request headers."""
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        print("No authorization header found or invalid format.")
        return None
    token = auth_header.split(" ")[1]
    try:
        # The response is a UserResponse object, not a dictionary
        user_response = supabase_public.auth.get_user(token)
        # Access the user directly from the response
        return user_response.user
    except Exception as e:
        print("Exception during token verification:", str(e))
        return None
@app.route("/upload", methods=["POST"])
def upload():
    """Process and store uploaded video files with audio enhancement."""
    print("Upload endpoint hit.")
    print(f"Temp folder exists: {os.path.exists(app.config['UPLOAD_FOLDER'])}")
    print(f"Temp folder writable: {os.access(app.config['UPLOAD_FOLDER'], os.W_OK)}")

    # Authenticate user
    user = authenticate_user()
    if user is None:
        print("Unauthorized access attempt.")
        return "Unauthorized", 401

    if "video" not in request.files:
        print("No video file uploaded.")
        return "No video file uploaded", 400

    video = request.files["video"]
    if video.filename == '':
        print("Uploaded video file has no filename.")
        return "No video file uploaded", 400

    # Save the uploaded video file
    video_filename = str(uuid.uuid4()) + "_" + video.filename
    video_path = os.path.join(app.config['UPLOAD_FOLDER'], video_filename)
    video.save(video_path)
    print(f"Video saved to {video_path}")

    # Prepare file paths
    audio_path = os.path.splitext(video_path)[0] + ".wav"
    processed_audio_path = os.path.splitext(video_path)[0] + "-processed.wav"
    output_video_path = os.path.splitext(video_path)[0] + "-output.mp4"

    user_id = user.id

    # 1. Extract audio from video using ffmpeg
    try:
        print("Extracting audio from video...")
        result = subprocess.run(
            ["ffmpeg", "-i", video_path, "-vn", "-acodec", "pcm_s16le", "-ar", "44100", "-ac", "2",
             audio_path],
            check=True,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE
        )
        print("Subprocess stdout:", result.stdout.decode())
        print("Subprocess stderr:", result.stderr.decode())
        print("Audio extraction completed.")
    except subprocess.CalledProcessError as e:
        cleanup([video_path])
        print("Audio extraction failed:", e.stderr.decode())
        return "Audio extraction failed", 500
    # 2. Process audio with the Python script
    try:
        print("Processing audio...")
        result = subprocess.run(
            ["python3.11", "scripts/process_audio.py", audio_path, processed_audio_path],
            check=True,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE
        )
        print("Audio processing completed.")

        # Add verification step
        time.sleep(1)  # Wait 1 second for filesystem to sync
        if not os.path.exists(processed_audio_path) or os.path.getsize(processed_audio_path) == 0:
            print(f"Processed audio file not found or empty: {processed_audio_path}")
            print("Process output:", result.stdout.decode())
            print("Process errors:", result.stderr.decode())
            raise FileNotFoundError("Processed audio file not found or empty")

        print(f"Verified processed audio file exists: {processed_audio_path}")
    except subprocess.CalledProcessError as e:
        cleanup([video_path, audio_path, processed_audio_path])
        print("Audio processing failed:", e.stderr.decode())
        return "Audio processing failed", 500

    # 3. Merge processed audio back into the video
    try:
        print("Merging processed audio back into video...")
        subprocess.run(
            [
                "ffmpeg", "-i", video_path, "-i", processed_audio_path,
                "-map", "0:v:0", "-map", "1:a:0", "-c:v", "copy", "-shortest",
                output_video_path
            ],
            check=True,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE
        )
        print("Video merging completed.")
    except subprocess.CalledProcessError as e:
        cleanup([video_path, audio_path, processed_audio_path, output_video_path])
        print("Video merging failed:", e.stderr.decode())
        return "Video merging failed", 500
    # 4. Upload processed video to Supabase storage
    remote_filename = f"{user_id}/{uuid.uuid4()}.mp4"
    with open(output_video_path, "rb") as f:
        print(f"Uploading video to Supabase storage as {remote_filename}...")
        try:
            supabase_admin.storage.from_("videos").upload(
                path=remote_filename,
                file=f,
                file_options={"content-type": "video/mp4"}
            )
        except Exception as e:
            cleanup([video_path, audio_path, processed_audio_path, output_video_path])
            print("Video upload failed:", str(e))
            return "Video upload failed", 500

    # 5. Get public URL
    try:
        public_url = supabase_admin.storage.from_("videos").get_public_url(remote_filename)
    except Exception as e:
        cleanup([video_path, audio_path, processed_audio_path, output_video_path])
        print("Failed to generate public URL:", str(e))
        return "Failed to generate public URL", 500

    # 6. Insert video metadata into Supabase
    try:
        insert_response = supabase_admin.table("Video").insert({
            "file_url": public_url, 
            "userId": user_id
        }).execute()
    except Exception as e:
        cleanup([video_path, audio_path, processed_audio_path, output_video_path])
        print("Error saving video metadata:", str(e))
        return "Error saving video metadata", 500
    cleanup([video_path, audio_path, processed_audio_path, output_video_path])
    print("Video processed and uploaded successfully.")
    return "Video processed and uploaded successfully", 200
def cleanup(file_paths):
    """Remove temporary files from the given list of file paths."""
    for fp in file_paths:
        if os.path.exists(fp):
            os.remove(fp)
            print(f"Cleaned up file: {fp}")

@app.route("/")
def index():
    """Return a simple hello world message."""
    return "Hello World"

if __name__ == "__main__":
    # Run the Flask app on port 3001
    app.run(port=3001, debug=True)
```


### Frontend Configuration
The main application component (referenced in `frontend/src/app/page.tsx`) manages:
- User authentication
- File uploads
- Video playback
- Status updates

For reference, see:

```1:345:frontend/src/app/page.tsx
"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { useSession } from "@supabase/auth-helpers-react";
import Auth from "../../components/Auth";
import GitHubButton from "../../components/GitHubButton";
import toast, { Toaster } from "react-hot-toast";
import styled, { createGlobalStyle } from "styled-components";

type Video = {
  id: string;
  file_url: string;
};

const GlobalStyle = createGlobalStyle`
  body {
    margin: 0;
    font-family: 'Inter', sans-serif;
    background: linear-gradient(135deg, #1D1F21 0%, #2F3133 100%);
    color: #FFFFFF;
  }
`;

const PageWrapper = styled.div`
  display: flex;
  min-height: 100vh;
  align-items: flex-start;
  justify-content: center;
  padding: 50px 20px;
`;

const ContentWrapper = styled.div`
  max-width: 600px;
  width: 100%;
`;

const Title = styled.h1`
  text-align: center;
  margin-bottom: 20px;
  font-weight: 700;
  color: #f9f9f9;
  font-size: 2rem;
`;

const Card = styled.div`
  background: #2d2f31;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 30px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
`;

const CardTitle = styled.h3`
  margin-bottom: 15px;
  color: #f9f9f9;
  font-size: 1.2rem;
`;
const Label = styled.label`
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
`;

const FileInput = styled.input`
  display: block;
  width: 100%;
  border: 1px solid #444;
  background: #1e1f21;
  color: #ddd;
  padding: 10px;
  border-radius: 4px;
  font-size: 0.9rem;
  margin-bottom: 10px;

  &::file-selector-button {
    background: #3f4143;
    border: none;
    padding: 8px 12px;
    color: #ddd;
    border-radius: 4px;
    cursor: pointer;
  }
`;

const Alert = styled.div<{ type?: "info" | "warning" }>`
  background: ${({ type }) => (type === "info" ? "#1E90FF" : "#FFA500")};
  padding: 10px 15px;
  border-radius: 4px;
  font-size: 0.9rem;
  margin-top: 10px;
  text-align: center;
  color: #fff;
`;

const VideoList = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-top: 20px;
`;

const VideoItem = styled.div`
  display: flex;
  flex-direction: column;
  background: #232527;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.4);
  transition: transform 0.2s ease;

  &:hover {
    transform: scale(1.05);
  }
`;

const Thumbnail = styled.video`
  width: 100%;
  height: 140px;
  object-fit: cover;
  background: #000;

  /* When video is fullscreen */
  &:fullscreen {
    object-fit: contain;
    width: 100%;
    height: 100%;
  }

  /* Safari-specific fullscreen support */
  &::-webkit-media-controls-fullscreen-button {
    object-fit: contain;
  }

  /* Adjust for different video aspect ratios */
  @media (min-aspect-ratio: 9/16) {
    &:fullscreen {
      width: auto;
      height: 100%;
    }
  }

  @media (max-aspect-ratio: 9/16) {
    &:fullscreen {
      width: 100%;
      height: auto;
    }
  }
`;
const VideoDetails = styled.div`
  padding: 10px 12px;
  display: flex;
  flex-direction: column;
  color: #ccc;
`;

const VideoTitle = styled.p`
  margin: 0;
  font-size: 0.9rem;
  font-weight: bold;
  color: #fff;
`;

const VideoID = styled.span`
  font-size: 0.8rem;
  color: #aaa;
  margin-top: 4px;
`;
export default function VideoEnhancer() {
  const session = useSession();
  const [uploading, setUploading] = useState(false);
  const [videos, setVideos] = useState<Video[]>([]);
  const [hasMounted, setHasMounted] = useState(false);

  // Fetch videos when session changes
  useEffect(() => {
    const fetchVideos = async () => {
      if (!session) return;

      try {
        const response = await axios.get("/api/videos");
        if (response.status === 200) {
          setVideos(response.data);
        } else {
          toast.error("Failed to fetch videos.");
        }
      } catch (err) {
        console.error("Error fetching videos:", err);
        toast.error("An error occurred while fetching videos.");
      }
    };
    setHasMounted(true);

    fetchVideos();
  }, [session]);

  // Handle video upload
  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) {
      toast.error("No file selected");
      return;
    }

    setUploading(true);
    const loadingToastId = toast.loading(
      "Uploading and processing your video..."
    );

    const formData = new FormData();
    formData.append("video", e.target.files[0]);

    try {
      const token = session?.access_token;
      const response = await axios.post(
        //`${process.env.NEXT_PUBLIC_BACKEND_URL}/upload`,
        "http://localhost:3001/upload",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.status === 200) {
        toast.success("Video processed successfully! Check your dashboard.", {
          id: loadingToastId,
        });
        // Optionally, refresh the videos list
        const videosResponse = await axios.post("/api/videos", {});
        if (videosResponse.status === 200) {
          setVideos(videosResponse.data);
        }
        e.target.value = "";
      } else {
        toast.error("Failed to process video.", { id: loadingToastId });
      }
    } catch (err) {
      console.error(err);
      toast.error("An error occurred during the upload. Please try again.", {
        id: loadingToastId,
      });
    } finally {
      setUploading(false);
    }
  };
  if (!hasMounted) {
    return null;
  }

  return (
    <>
      <GlobalStyle />
      <PageWrapper>
        <ContentWrapper>
          <Toaster />
          <Title>🎥 Video Audio Enhancer</Title>
          <Auth />
          {/*
          // THIS IS THE ORIGINAL CODE AND IF YOU WANT TO REVERT TO IT, UNCOMMENT THE FOLLOWING CODE  
          {session && session.user && (
            <Card>
              <form>
                <Label htmlFor="fileUpload">Select a video file</Label>
                <FileInput
                  type="file"
                  id="fileUpload"
                  onChange={handleUpload}
                  disabled={uploading}
                />
                {uploading && (
                  <Alert type="info">
                    Uploading and processing your video. Please wait...
                  </Alert>
                )}
              </form>
            </Card>
          )}
          */}
          {session && session.user && (
            <Card>
              <CardTitle>Service Unavailable</CardTitle>
              <p>
                We regret to inform you that this service is no longer available
                due to limited financial resources and the high compute costs
                required to run it. Below, you’ll find examples of videos edited
                by the application. If you’d like, you can clone the repository
                and run your own instance. For questions, feedback, or
                suggestions on how to improve the application, feel free to
                reach out to me at aavin@umich.edu.
              </p>
            </Card>
          )}
          {session && session.user && (
            <Card>
              <CardTitle>Sample Videos</CardTitle>
              {videos.length === 0 ? (
                <p>You have no uploaded videos.</p>
              ) : (
                <VideoList>
                  {videos.map((video) => (
                    <VideoItem key={video.id}>
                      {video.file_url ? (
                        <>
                          <Thumbnail controls>
                            <source src={video.file_url} type="video/mp4" />
                            Your browser does not support the video tag.
                          </Thumbnail>
                          <VideoDetails>
                            <VideoTitle>
                              {videos[0] == video || videos[1] == video
                                ? "Processed Video"
                                : "Original Video"}
                            </VideoTitle>
                          </VideoDetails>
                        </>
                      ) : (
                        <p style={{ color: "#ff6666" }}>
                          Unable to load video URL.
                        </p>
                      )}
                    </VideoItem>
                  ))}
                </VideoList>
              )}
            </Card>
          )}
          {!session && (
            <Alert type="warning">
              Please sign in to upload and process videos.
            </Alert>
          )}
          <GitHubButton />
        </ContentWrapper>
      </PageWrapper>
    </>
  );
}
```


## Contributing
1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License
ISC License

## Support
For questions or issues, please open a GitHub issue or contact the maintainers.

## Acknowledgments
- DeepFilterNet for audio enhancement
- Supabase for backend infrastructure
- Next.js team for the frontend framework
- FFmpeg for media processing
