import OpenAI from "openai";

export const GROQ_MODEL = "qwen-3-32b";

let _client: OpenAI | null = null;

export function getGroqClient() {
  if (!_client) {
    _client = new OpenAI({
      apiKey: process.env.GROQ_API_KEY,
      baseURL: "https://api.groq.com/openai/v1",
    });
  }
  return _client;
}
