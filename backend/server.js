import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import cors from "cors";
import {
  BedrockRuntimeClient,
  ConverseCommand,
} from "@aws-sdk/client-bedrock-runtime";

// Fix __dirname in ES module scope
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

// Optional rate-limiting
const RATE_LIMIT = 10; // max requests per minute
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

// API route
app.post("/slogan", async (req, res) => {
  const ip = req.ip || req.connection.remoteAddress;

  if (!checkRateLimit(ip)) {
    return res
      .status(429)
      .json({ error: "Rate limit exceeded. Max 10 requests per minute." });
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
      inferenceConfig: { maxTokens: 60, temperature: 0.8 },
    });

    const response = await client.send(command);
    let slogan =
      response.output?.message?.content?.[0]?.text?.trim() ||
      "No slogan generated";

    // Remove wrapping quotes if present
    if (slogan.startsWith('"') && slogan.endsWith('"')) {
      slogan = slogan.slice(1, -1);
    }

    // Remove extra spaces/newlines
    slogan = slogan.trim();

    res.json({ slogan });
  } catch (err) {
    console.error("Error generating slogan:", err);
    res.status(500).json({ error: err.message || "Error generating slogan" });
  }
});

// Serve frontend build
app.use(express.static(path.join(__dirname, "../frontend/build")));

// Catch-all to serve React app
app.get(/.*/, (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/build/index.html"));
});

// Start server
const PORT = 5000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
});
