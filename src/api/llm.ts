import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { AIMessageChunk } from "@langchain/core/messages";
import { concat } from "@langchain/core/utils/stream";

export default class Chatbot {
  private llm: ChatGoogleGenerativeAI;
  private history: Array<{ role: string; content: string }>; // Lưu trữ lịch sử hội thoại

  constructor() {
    this.llm = new ChatGoogleGenerativeAI({
      model: "gemini-pro",
      apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY,
    });
    this.history = []; // Khởi tạo mảng để lưu lịch sử
  }

  // Ghi nhớ câu hỏi và câu trả lời
  private addToHistory(role: string, content: string) {
    this.history.push({ role, content });
  }

  // Tạo prompt dựa trên lịch sử hội thoại
  private createPrompt(newQuestion: string) {
    let prompt = this.history
      .map((msg) => `${msg.role}: ${msg.content}`)
      .join("\n");
    prompt += `\nuser: ${newQuestion}`;
    return prompt;
  }

  // Hỏi không dùng stream
  async ask(content: string) {
    // Thêm câu hỏi mới vào lịch sử
    this.addToHistory("user", content);

    // Tạo prompt với lịch sử trước đó
    const prompt = this.createPrompt(content);
    const res = await this.llm.invoke(prompt);

    // Lưu lại câu trả lời
    this.addToHistory("assistant", res.content.toString());

    return res.content.toString();
  }

  // Hỏi dùng stream
  async askStream(content: string, callback?: (chunk: AIMessageChunk) => void) {
    // Thêm câu hỏi mới vào lịch sử
    this.addToHistory("user", content);

    // Tạo prompt với lịch sử trước đó
    const prompt = this.createPrompt(content);

    let full: AIMessageChunk | undefined;
    const stream = await this.llm.stream(prompt);

    for await (const chunk of stream) {
      full = !full ? chunk : concat(full, chunk);

      // Gọi callback nếu có
      if (callback) {
        callback(full);
      }

      console.log(chunk);
    }

    // Lưu lại câu trả lời hoàn chỉnh
    if (full?.content) {
      this.addToHistory("assistant", full.content.toString());
    }

    return full?.content;
  }
}
