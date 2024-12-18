// components/VideoEnhancer.tsx

"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { useSupabaseClient, useSession } from "@supabase/auth-helpers-react";
import Auth from "../../components/Auth";
import toast, { Toaster } from "react-hot-toast";

type Video = {
  id: string;
  file_url: string;
};

export default function VideoEnhancer() {
  const supabase = useSupabaseClient();
  const session = useSession();
  const [uploading, setUploading] = useState(false);
  const [videos, setVideos] = useState<Video[]>([]);

  // Fetch videos when session changes
  useEffect(() => {
    const fetchVideos = async () => {
      if (!session) return;

      try {
        const response = await axios.post("/api/videos", {});
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

  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <Toaster />
        <div className="col-md-6 text-center">
          <h1 className="mb-4">🎥 Video Audio Enhancer</h1>
          <Auth />

          {/* Upload Form */}
          {session && session.user && (
            <div className="card shadow p-4 mb-4">
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
              </form>
            </div>
          )}

          {/* Display Videos */}
          {session && session.user && (
            <div className="card shadow p-4">
              <h3 className="mb-3">Your Videos</h3>
              {videos.length === 0 ? (
                <p>You have no uploaded videos.</p>
              ) : (
                <div className="list-group">
                  {videos.map((video) => (
                    <div key={video.id} className="mb-3">
                      <p>Video ID: {video.id}</p>
                      {video.file_url ? (
                        <video width="320" height="240" controls>
                          <source src={video.file_url} type="video/mp4" />
                          Your browser does not support the video tag.
                        </video>
                      ) : (
                        <p className="text-danger">Unable to load video URL.</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
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
