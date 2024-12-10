import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    // Replace this with actual database fetching logic
    const videos = [
      { id: "1", file_url: "https://example.com/video1.mp4" },
      { id: "2", file_url: "https://example.com/video2.mp4" },
    ];

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // Filter videos by user email (dummy example)
    const userVideos = videos.filter((video) => video.file_url.includes(email));

    return NextResponse.json(userVideos);
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
