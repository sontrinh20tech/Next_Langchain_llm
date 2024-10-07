"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { AIMessageChunk } from "@langchain/core/messages";
import Chatbot from "@/api/llm";

interface IMessage {
  type: "user" | "llm";
  text: string;
}

let startResponse = false;

const chatbot = new Chatbot;

export default function Home() {
  const [prompt, setPrompt] = useState("");
  const [messages, setMessages] = useState<IMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const messageEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    appendMessages({
      type: "user",
      text: prompt,
    });
    setPrompt("");
    setLoading(true);
    await chatbot.askStream(prompt, handleChunk);
    setLoading(false);
    startResponse = false;
  };

  const handleChunk = (chuck: AIMessageChunk) => {
    if (!startResponse) {
      appendMessages({
        type: "llm",
        text: chuck.content.toString(),
      });

      startResponse = true;
    } else {
      replaceMessage({
        type: "llm",
        text: chuck.content.toString(),
      });
    }
  };

  const appendMessages = (message: IMessage) => {
    setMessages((pre) => [...pre, message]);
  };

  const replaceMessage = (message: IMessage) => {
    setMessages((prev) => {
      // Tạo một bản sao của mảng trước đó
      const newItems = [...prev];

      // Thay thế phần tử cuối cùng bằng giá trị mới
      newItems[newItems.length - 1] = message;

      // Trả về mảng mới
      return newItems;
    });
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white h-screen p-6 rounded-lg shadow-lg w-full flex flex-col space-y-4">
        <h1 className="text-2xl font-bold text-center mb-4">Chat với LLM</h1>

        {/* Vùng hiển thị các tin nhắn */}
        <div className="flex-1 overflow-y-auto space-y-4 p-4 bg-gray-50 rounded-lg h-96">
          {" "}
          {/* Thêm height và overflow */}
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${
                message.type === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`px-4 py-2 rounded-lg ${
                  message.type === "user"
                    ? "bg-blue-500 text-white"
                    : "bg-gray-200 text-gray-800"
                }`}
              >
                <ReactMarkdown className="prose-sm prose-blue">
                  {message.text}
                </ReactMarkdown>
              </div>
            </div>
          ))}
          {/* Cuộn xuống cuối danh sách */}
          <div ref={messageEndRef} />
        </div>

        {/* Form nhập dữ liệu */}
        <form onSubmit={handleSubmit} className="flex space-x-2">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Nhập tin nhắn..."
            className="flex-1 p-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
            rows={1}
          />
          <button
            type="submit"
            className={`py-2 px-4 bg-blue-500 text-white rounded-lg shadow-md hover:bg-blue-600 transition ${
              loading ? "opacity-50 cursor-not-allowed" : ""
            }`}
            disabled={loading}
          >
            {loading ? "..." : "Gửi"}
          </button>
        </form>
      </div>
    </div>
  );
}
