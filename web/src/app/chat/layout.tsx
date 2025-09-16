import type { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
  title: "Insurance Act Chatbot",
};

export default function ChatLayout({ children }: { children: React.ReactNode }) {
  return children;
}
