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
        subprocess.run(
            ["ffmpeg", "-i", video_path, "-vn", "-acodec", "pcm_s16le", "-ar", "44100", "-ac", "2",
             audio_path],
            check=True,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE
        )
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
