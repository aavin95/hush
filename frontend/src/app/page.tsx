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
