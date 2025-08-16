import express from "express";
import cors from "cors";
import { BedrockRuntimeClient, ConverseCommand } from "@aws-sdk/client-bedrock-runtime";

const app = express();
app.use(cors());
app.use(express.json());

// Optional rate-limiting for demo purposes
const RATE_LIMIT = 10; // requests per minute
const TIME_WINDOW = 60 * 1000;
const requests = {};
function checkRateLimit(ip) {
  const now = Date.now();
  if (!requests[ip]) requests[ip] = [];
  requests[ip] = requests[ip].filter((ts) => now - ts < TIME_WINDOW);
  if (requests[ip].length >= RATE_LIMIT) return false;
  requests[ip].push(now);
  return true;
}

// Bedrock client
const client = new BedrockRuntimeClient({ region: "us-east-1" });

app.post("/slogan", async (req, res) => {
  const ip = req.ip || req.connection.remoteAddress;

  if (!checkRateLimit(ip)) {
    return res.status(429).json({ error: "Rate limit exceeded. Max 10 requests per minute." });
  }

  const { prompt } = req.body;
  if (!prompt) return res.status(400).json({ error: "Prompt is required." });

  try {
    const command = new ConverseCommand({
      modelId: "amazon.nova-lite-v1:0",
      messages: [
        {
          role: "user",
          content: [{ text: `Generate a catchy slogan for: ${prompt}` }],
        },
      ],
      inferenceConfig: {
        maxTokens: 60,
        temperature: 0.8,
      },
    });

    const response = await client.send(command);
    const slogan = response.output?.message?.content?.[0]?.text?.trim() || "No slogan generated";
    res.json({ slogan });
  } catch (err) {
    console.error("Error generating slogan:", err);
    res.status(500).json({ error: err.message || "Error generating slogan" });
  }
});

app.listen(5000, '0.0.0.0', () => console.log("Server running"))

