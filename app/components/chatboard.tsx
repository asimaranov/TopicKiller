import Image from "next/image";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import Editor from "@monaco-editor/react";

export default function ChatBoard() {
  const [aiResponse, setAiResponse] = useState("");

  const fetchSession = async () => {
    const response = await fetch("/api/session");
    if (!response.ok) {
      throw new Error("Network response was not ok");
    }
    return response.json();
  };

  const fetchClear = async () => {
    const response = await fetch("/api/clear");
  };

  const fetchCode = async (request: string) => {
    const apiKey = process.env.NEXT_PUBLIC_OPENAI_KEY;
    const url = "https://api.openai.com/v1/chat/completions";
    console.log(
      "Content",
      `User asks you to implement some logic to solve a specific task. Write a code on javascript that can be executed in browser and solves the following task. Write only code. User asks: "${request}"`
    );
    const body = JSON.stringify({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "user",
          content: `User asks you to implement some logic to solve a specific task. Write a code on javascript that can be executed in browser and solves the following task. Write only code. User asks: "${request}"`,
        },
      ],
    });

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body,
    });
    const data = await response.json();
    console.log("Ai response", data);

    return data.choices[0].message.content;
  };

  const { data, error, isLoading } = useQuery({
    queryKey: ["session"],
    queryFn: fetchSession,
    refetchInterval: 1000,
  });

  useEffect(() => {
    if (data?.session?.conversation) {
      if (
        (data?.session?.conversation as string).toLowerCase().includes("please")
      ) {
        fetchCode(data?.session?.conversation).then((data) =>
          setAiResponse(
            data.replaceAll("```javascript", "").replaceAll("```", "")
          )
        );
      }
    }
  }, [data]);

  return (
    <div className="grid grid-rows-[20px_1fr_20px] justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col gap-8 row-start-1 row-end-3 items-center w-[90%]">
        <ol className="list-inside list-decimal text-sm text-center sm:text-left font-[family-name:var(--font-geist-mono)]">
          <li className="mb-2">Connect necklace</li>

          <li className="mb-2">
            Say OmiCoder,{" "}
            <code className="bg-black/[.05] dark:bg-white/[.06] px-1 py-0.5 rounded font-semibold">
              write code fetching current weather in turkey{" "}
            </code>
          </li>
          <li className="mb-2">
            End phrase with <code>`please`</code>
          </li>
        </ol>
        <div
          dangerouslySetInnerHTML={{
            __html: (data?.session?.conversation as string)
              ?.replaceAll("Omnicoder", "Omicoder")
              ?.replaceAll(
                "Omicoder",
                `
            <div style="filter: drop-shadow(0 0 4px rgba(255, 255, 255, 0.50))" class="inline">Omicoder</div>
          `
              ),
          }}
        ></div>
        <div className="w-full">
          {aiResponse && (
            <Editor
              height="50vh"
              width="100%"
              defaultLanguage="javascript"
              defaultValue={aiResponse}
              theme="vs-dark"
            ></Editor>
          )}
        </div>
      </main>

      <footer className="row-start-3 flex gap-6 flex-wrap items-center justify-center">
        <div className="flex gap-4 items-center flex-col sm:flex-row row-start-3">
          <div
            className="rounded-full border border-solid border-transparent transition-colors flex items-center justify-center bg-foreground text-background gap-2 hover:bg-[#383838] dark:hover:bg-[#ccc] text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 cursor-pointer"
            onClick={() => {
              const logs = [];
              (console as any).oldLog = console.log;
              console.log = function (value) {
                (console as any).oldLog(value);
                logs.push(value);
                return value;
              };

              eval(aiResponse);

              console.log = (console as any).oldLog;

              console.log("Executions logs", logs);
            }}
          >
            <Image
              className="dark:invert"
              src="/vercel.svg"
              alt="Vercel logomark"
              width={20}
              height={20}
            />
            Execute
          </div>
          <div
            className="rounded-full border border-solid border-black/[.08] dark:border-white/[.145] transition-colors flex items-center justify-center hover:bg-[#f2f2f2] dark:hover:bg-[#1a1a1a] hover:border-transparent text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 sm:min-w-44 cursor-pointer"
            onClick={() => fetchClear()}
          >
            Clear
          </div>
        </div>
      </footer>
    </div>
  );
}
