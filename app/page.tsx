"use client";

import Image from "next/image";
import {
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import ChatBoard from "./components/chatboard";

const queryClient = new QueryClient();

export default function Home() {
  return (
    <QueryClientProvider client={queryClient}>
      <ChatBoard />
    </QueryClientProvider>
  );
}
