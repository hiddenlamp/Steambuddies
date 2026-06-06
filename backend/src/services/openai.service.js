import OpenAI from "openai";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function generateQuestionsWithOpenAI({
  subject,
  topics,
  difficulty = "medium",
  count = 10,
  grade = "8",
  language = "en"
}) {
  const schema = {
    name: "mocktest_questions",
    schema: {
      type: "object",
      additionalProperties: false,
      properties: {
        questions: {
          type: "array",
          minItems: count,
          maxItems: count,
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
              difficulty: { type: "string", enum: ["easy", "medium", "hard"] }
            },
            required: ["qid", "question", "options", "correctIndex", "explanation", "topic", "difficulty"]
          }
        }
      },
      required: ["questions"]
    }
  };

  const prompt = `
Generate ${count} MCQ questions for Indian school students.
Subject: ${subject}
Topics: ${topics?.length ? topics.join(", ") : "general"}
Grade/Class: ${grade}
Difficulty: ${difficulty}
Language: ${language}

Rules:
- Exactly 4 options.
- Only one correct option.
- Provide short explanation.
- qid must be unique (use something like "Q" + random/slug).
Return STRICT JSON only.
`.trim();

  const resp = await client.responses.create({
    model: process.env.OPENAI_MODEL || "gpt-5",
    input: prompt,
    response_format: { type: "json_schema", json_schema: schema }
  });

  // Responses API returns structured output in output_text (JSON string)
  const jsonText = resp.output_text;
  const parsed = JSON.parse(jsonText);
  return parsed.questions;
}
