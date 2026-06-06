// src/services/openaiQuestions.service.js
const OpenAI = require("openai");

// openai package sometimes exports default; this handles both
const OpenAIClient = OpenAI?.default || OpenAI;

const client = new OpenAIClient({
  apiKey: process.env.OPENAI_API_KEY,
});

function safeJsonParse(text) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

async function generateQuestionsWithOpenAI({
  subject,
  topics,
  difficulty = "medium",
  count = 10,
  grade = "8",
  language = "en",
}) {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY missing in .env");
  }

  const n = Math.max(1, Math.min(50, Number(count) || 10));
  const cleanTopics = Array.isArray(topics) ? topics.map(String).map(s => s.trim()).filter(Boolean) : [];

  const schema = {
    name: "mocktest_questions",
    schema: {
      type: "object",
      additionalProperties: false,
      properties: {
        questions: {
          type: "array",
          minItems: n,
          maxItems: n,
          items: {
            type: "object",
            additionalProperties: false,
            properties: {
              qid: { type: "string" },
              question: { type: "string" },
              options: { type: "array", minItems: 4, maxItems: 4, items: { type: "string" } },
              correctIndex: { type: "integer", minimum: 0, maximum: 3 },
              explanation: { type: "string" },
              topic: { type: "string" },
              difficulty: { type: "string", enum: ["easy", "medium", "hard"] },
            },
            required: ["qid", "question", "options", "correctIndex", "explanation", "topic", "difficulty"],
          },
        },
      },
      required: ["questions"],
    },
  };

  const prompt = `
Generate ${n} MCQ questions for Indian school students.

Subject: ${String(subject || "").trim()}
Topics: ${cleanTopics.length ? cleanTopics.join(", ") : "general"}
Grade/Class: ${String(grade || "8")}
Difficulty: ${difficulty}
Language: ${language}

Rules:
- Exactly 4 options.
- Only one correct option.
- Provide short explanation.
- Make qid unique.
Return STRICT JSON only (no markdown, no extra text).
`.trim();

  const resp = await client.responses.create({
    model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
    input: prompt,
    response_format: { type: "json_schema", json_schema: schema },
  });

  // output_text is usually available; fallback to digging in output array
  const text = resp?.output_text || "";
  const parsed = safeJsonParse(text);

  if (!parsed?.questions || !Array.isArray(parsed.questions)) {
    // fallback: try to locate json string in outputs
    const alt =
      resp?.output?.[0]?.content?.find?.((c) => c?.type === "output_text")?.text ||
      resp?.output?.[0]?.content?.[0]?.text ||
      "";
    const parsedAlt = safeJsonParse(alt);

    if (!parsedAlt?.questions || !Array.isArray(parsedAlt.questions)) {
      throw new Error("OpenAI response parsing failed");
    }
    return parsedAlt.questions;
  }

  return parsed.questions;
}

module.exports = { generateQuestionsWithOpenAI };
