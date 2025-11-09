"use client";
import ChatLayoutWithStorage from "@/components/ChatLayoutWithStorage";
import AuthGuard from "@/components/auth/AuthGuard";

export default function ChatPage() {
  return (
    <AuthGuard>
      <ChatLayoutWithStorage />
    </AuthGuard>
  );
}
