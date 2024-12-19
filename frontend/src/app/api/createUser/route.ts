// app/api/createUser/route.ts
"cookies-next";

import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { PrismaClient } from "@prisma/client";
import { ReadonlyRequestCookies } from "next/dist/server/web/spec-extension/adapters/request-cookies";

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    // Initialize Supabase client with the correct cookies format
    const supabase = createRouteHandlerClient({
      cookies: cookies as unknown as () => Promise<ReadonlyRequestCookies>,
    });

    // Retrieve the session
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();

    if (error || !session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse the request body
    const { id, email, name, image } = await request.json();

    // Validate required fields
    if (!id || !email) {
      return NextResponse.json(
        { error: "Missing required fields: id and email" },
        { status: 400 }
      );
    }

    // Upsert the user: create if not exists, do nothing if exists
    const user = await prisma.user.upsert({
      where: { id },
      update: {},
      create: {
        id,
        email,
        name,
        image,
      },
    });

    return NextResponse.json({ user }, { status: 200 });
  } catch (error) {
    console.error("Error in createUser API:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
