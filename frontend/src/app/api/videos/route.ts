import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import prisma from "../../../../../lib/prisma";

export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies });

    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();

    if (error || !session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // Fetch videos for the user
    const userVideos = await prisma.video.findMany({
      where: { userId },
      select: { id: true, file_url: true },
    });

    // Check if file_url is already a full URL
    const publicVideos = userVideos.map((video) => {
      const fileUrl = video.file_url.startsWith("http")
        ? video.file_url // Use directly if it's already a full URL
        : `https://${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/videos/${video.file_url}`;
      return {
        id: video.id,
        file_url: fileUrl,
      };
    });

    return NextResponse.json(publicVideos, { status: 200 });
  } catch (error) {
    console.error("Error fetching videos:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
