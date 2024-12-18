// components/Auth.tsx

"use client";

import React from "react";
import { useSession, useSupabaseClient } from "@supabase/auth-helpers-react";
import { useEffect } from "react";

export default function Auth() {
  const session = useSession();
  const supabase = useSupabaseClient();

  const signInWithGoogle = async (): Promise<void> => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
    });
    if (error) console.error("Error signing in:", error);
  };

  const signOut = async (): Promise<void> => {
    const { error } = await supabase.auth.signOut();
    if (error) console.error("Error signing out:", error);
  };

  useEffect(() => {
    const createUserInDB = async (): Promise<void> => {
      if (session) {
        const { user } = session;
        const res = await fetch("/api/createUser", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            id: user.id,
            email: user.email,
            name: user.user_metadata?.full_name || user.email, // Adjust based on your metadata
            image: user.user_metadata?.avatar_url || "",
          }),
        });

        if (!res.ok) {
          console.error("Failed to create user in DB");
        }
      }
    };

    createUserInDB();
  }, [session]);

  if (session) {
    return (
      <div>
        <p>Signed in as {session.user.email}</p>
        <button onClick={signOut}>Sign Out</button>
      </div>
    );
  }

  return <button onClick={signInWithGoogle}>Sign in with Google</button>;
}
