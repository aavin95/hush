"use client";

import axios from "axios";
import { useState } from "react";
import { useSession, signIn, signOut } from "next-auth/react";

export default function Home() {
  const { data: session } = useSession();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

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

      setSuccessMessage("Video processed successfully! Check your downloads.");
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
          <p className="lead mb-4">
            Enhance your video&apos;s audio quality by removing background noise
            and isolating speech. Upload a video to get started!
          </p>

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
