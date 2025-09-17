import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Insurance Act Chatbot",
};

export default function ChatLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
