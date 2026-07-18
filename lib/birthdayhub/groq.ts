import Groq from "groq-sdk";

let _groq: Groq | null = null;
function getGroq() {
  if (!_groq) _groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  return _groq;
}

export async function generateBirthdayMessage(employeeName: string, department?: string | null, notes?: string | null): Promise<string> {
  const context = [
    `Employee name: ${employeeName}`,
    department && `Department: ${department}`,
    notes && `Notes about them: ${notes}`,
  ].filter(Boolean).join("\n");

  const completion = await getGroq().chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [
      {
        role: "system",
        content: "You are a warm, professional birthday message writer for a company called ValueAdd SoftTech. Write a personalized birthday email message. Keep it warm, sincere, and under 150 words. Include a subject line on the first line prefixed with 'Subject: '. Do not include any greeting like 'Dear' — start the body directly after the subject line.",
      },
      {
        role: "user",
        content: `Write a birthday message for:\n${context}`,
      },
    ],
    temperature: 0.8,
    max_tokens: 300,
  });

  return completion.choices[0]?.message?.content ?? "Happy Birthday!";
}
