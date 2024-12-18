"use client";

import React from "react";
import { useSession, useSupabaseClient } from "@supabase/auth-helpers-react";
import styled from "styled-components";

// Styled Components
const AuthButtonContainer = styled.div`
  position: absolute;
  top: 20px;
  right: 20px;
  display: flex;
  align-items: center;
`;

const StyledButton = styled.button`
  background: linear-gradient(135deg, #1e90ff 0%, #0066cc 100%);
  color: #fff;
  border: none;
  border-radius: 6px;
  padding: 10px 15px;
  font-size: 1rem;
  font-weight: bold;
  cursor: pointer;
  transition: background 0.3s ease, transform 0.2s ease;
  margin-left: 10px;

  &:hover {
    background: linear-gradient(135deg, #0066cc 0%, #005bb5 100%);
    transform: scale(1.05);
  }

  &:active {
    transform: scale(0.98);
  }
`;

const SignOutButton = styled(StyledButton)`
  background: #ff6666;

  &:hover {
    background: #e65555;
  }
`;

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

  return (
    <AuthButtonContainer>
      {session ? (
        <SignOutButton onClick={signOut}>Sign Out</SignOutButton>
      ) : (
        <StyledButton onClick={signInWithGoogle}>Sign In</StyledButton>
      )}
    </AuthButtonContainer>
  );
}
