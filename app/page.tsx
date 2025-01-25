"use client";

import { useState, useEffect, useRef } from "react";
import { fetchTopicData, fetchTopics, type TopicData } from "./api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TopicsTable } from "./components/topics-table";
import { Skeleton } from "@/components/ui/skeleton";
import { generateAndImprove } from "../utils/content-improver";
import ReactMarkdown from "react-markdown";
import { fetchWebsiteContent } from "./actions";

type ProgressMessage = {
  type: "system" | "generator" | "discriminator" | "improvement";
  content: string;
};

type ProgressUpdate = {
  message: ProgressMessage;
  intermediateContent?: string;
};

export default function Home() {
  const [topics, setTopics] = useState<TopicData[]>([]);
  const [isLoadingTopics, setIsLoadingTopics] = useState(true);
  const [selectedTopic, setSelectedTopic] = useState("");
  const [content, setContent] = useState<string>("");
  const [error, setError] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [progressMessages, setProgressMessages] = useState<ProgressMessage[]>(
    []
  );
  const [intermediateContent, setIntermediateContent] = useState<string>("");
  const chatRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function loadTopics() {
      try {
        const response = await fetchTopics();
        setTopics(response.result.rows);
      } catch (error) {
        console.error("Failed to fetch topics:", error);
        setError("Failed to load topics. Please try again later.");
      } finally {
        setIsLoadingTopics(false);
      }
    }

    loadTopics();
  }, []);

  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [progressMessages]);

  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.scrollTop = 0;
    }
  }, [intermediateContent]);

  const handleGenerateContent = async (topicId: string, topic: string) => {
    if (!topic) return;

    const topicData = await fetchTopicData(topicId);

    const matchedKeywords = topicData.matchedKeywordsResponse.result.rows.map(
      (x) => x.name
    );
    const missedKeywords = topicData.missedKeywordsResponse.result.rows.map(
      (x) => x.name
    );
    const urls = topicData.urlsResponse.result.rows.map((x) => x.name) as string[];

    console.log("Topic data", { matchedKeywords, missedKeywords, urls });

    let websiteDatas = [];

    for (const website of urls) {
      const parsed = await fetchWebsiteContent(website);
      websiteDatas.push({
        website, parsed
      });
    }


    console.log('Contents', websiteDatas)

    websiteDatas = websiteDatas.slice(0, 5).sort((x, y) => x.parsed.length - y.parsed.length).slice(0, 2);

    setSelectedTopic(topic);
    setIsGenerating(true);
    setError("");
    setContent("");
    setProgressMessages([]);
    setIntermediateContent("");

    try {
      const improvedContent = await generateAndImprove(
        topic,
        {
          matchedKeywords,
          missedKeywords,
          websiteDatas
        },
        5,
        (update: ProgressUpdate) => {
          setProgressMessages((prev) => [...prev, update.message]);
          if (update.intermediateContent) {
            setIntermediateContent(update.intermediateContent);
          }
        }
      );
      setContent(improvedContent);
    } catch (error) {
      console.error("Error generating content:", error);
      setError("Failed to generate content. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">AI Content Generator</h1>
      {isLoadingTopics ? (
        <div className="space-y-2">
          <Skeleton className="h-4 w-[250px]" />
          <Skeleton className="h-4 w-[200px]" />
          <Skeleton className="h-4 w-[300px]" />
        </div>
      ) : (
        <TopicsTable data={topics} onGenerateContent={handleGenerateContent} />
      )}
      {error && (
        <Card className="mt-4 mb-4 bg-red-50">
          <CardContent className="text-red-600 p-4">{error}</CardContent>
        </Card>
      )}
      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        {(isGenerating || progressMessages.length > 0) && (
          <Card>
            <CardHeader>
              <CardTitle>Content Generation Process: {selectedTopic}</CardTitle>
            </CardHeader>
            <CardContent>
              <div
                ref={chatRef}
                className="h-96 overflow-y-auto space-y-2 p-4 border rounded"
              >
                {progressMessages.map((message, index) => (
                  <div
                    key={index}
                    className={`p-2 rounded ${
                      message.type === "system"
                        ? "bg-gray-100"
                        : message.type === "generator"
                          ? "bg-blue-100"
                          : message.type === "discriminator"
                            ? "bg-green-100"
                            : "bg-yellow-100"
                    }`}
                  >
                    <strong>
                      {message.type.charAt(0).toUpperCase() +
                        message.type.slice(1)}
                      :
                    </strong>{" "}
                    {message.content}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
        {(isGenerating || intermediateContent) && (
          <Card>
            <CardHeader>
              <CardTitle>Intermediate Content: {selectedTopic}</CardTitle>
            </CardHeader>
            <CardContent>
              <div
                ref={contentRef}
                className="h-96 overflow-y-auto prose max-w-none"
              >
                <ReactMarkdown>{intermediateContent}</ReactMarkdown>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
      {content && !isGenerating && (
        <Card className="mt-4">
          <CardHeader>
            <CardTitle>Final Generated Content: {selectedTopic}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose max-w-none">
              <ReactMarkdown>{content}</ReactMarkdown>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
