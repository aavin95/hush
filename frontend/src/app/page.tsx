"use client";

import axios from "axios";
import { useSession, signIn, signOut } from "next-auth/react";
import { useEffect, useState } from "react";

export default function VideoEnhancer() {
  const { data: session } = useSession();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [videos, setVideos] = useState([]);

  // Fetch videos for the logged-in user
  useEffect(() => {
    if (!session?.user?.email) return;

    const fetchVideos = async () => {
      try {
        const response = await fetch("/api/videos", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: session.user.email }),
        });

        const data = await response.json();
        setVideos(data);
      } catch (err) {
        console.error("Error fetching videos:", err);
      }
    };

    fetchVideos();
  }, [session]);

  // Handle video upload
  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) {
      setError("No file selected");
      return;
    }

    setUploading(true);
    setError(null);
    setSuccessMessage(null);

    const formData = new FormData();
    formData.append("video", e.target.files[0]);

    try {
      const response = await axios.post(
        "http://localhost:3001/upload",
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      setSuccessMessage("Video processed successfully! Check your dashboard.");
      console.log(response.data); // Processed video file URL
    } catch (err) {
      console.error(err);
      setError("An error occurred during the upload. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-md-6 text-center">
          <h1 className="mb-4">🎥 Video Audio Enhancer</h1>

          {/* Authentication Section */}
          <div className="mb-4">
            {session ? (
              <div>
                <p>Welcome, {session.user?.name}!</p>
                <button className="btn btn-danger" onClick={() => signOut()}>
                  Sign Out
                </button>
              </div>
            ) : (
              <button
                className="btn btn-primary"
                onClick={() => signIn("google")}
              >
                Sign In with Google
              </button>
            )}
          </div>

          {/* Dashboard Section */}
          {session && videos.length > 0 && (
            <div className="mb-4">
              <h3>Your Processed Videos</h3>
              <ul className="list-group">
                {videos.map((video) => (
                  <li key={video.id} className="list-group-item">
                    <a
                      href={video.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {video.file_url}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Upload Form */}
          {session && (
            <div className="card shadow p-4">
              <form>
                <div className="mb-3">
                  <label htmlFor="fileUpload" className="form-label">
                    Select a video file
                  </label>
                  <input
                    type="file"
                    className="form-control"
                    id="fileUpload"
                    onChange={handleUpload}
                    disabled={uploading}
                  />
                </div>
                {uploading && (
                  <div className="alert alert-info" role="alert">
                    Uploading and processing your video. Please wait...
                  </div>
                )}
                {error && (
                  <div className="alert alert-danger" role="alert">
                    {error}
                  </div>
                )}
                {successMessage && (
                  <div className="alert alert-success" role="alert">
                    {successMessage}
                  </div>
                )}
              </form>
            </div>
          )}

          {!session && (
            <div className="alert alert-warning mt-4">
              Please sign in to upload and process videos.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
