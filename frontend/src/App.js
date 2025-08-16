import { useState } from "react";
import axios from "axios";

export default function App() {
  const [prompt, setPrompt] = useState("");
  const [slogan, setSlogan] = useState("");
  const [error, setError] = useState("");

  const handleGenerate = async () => {
    try {
      setError("");
      const res = await axios.post("http://localhost:5000/slogan", { prompt });
      setSlogan(res.data.slogan);
    } catch (err) {
      console.error(err);
      if (err.response?.data?.error) {
        setError(err.response.data.error);
      } else {
        setError("Something went wrong");
      }
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>Slogan Generator</h1>
      <input
        type="text"
        value={prompt}
        placeholder="Enter product/company name"
        onChange={(e) => setPrompt(e.target.value)}
        maxLength={50}
        style={{ width: "300px", padding: "5px" }}
      />
      <button onClick={handleGenerate} style={{ marginLeft: 10 }}>
        Generate
      </button>

      {slogan && (
        <p>
          <strong>Slogan:</strong> {slogan}
        </p>
      )}
      {error && <p style={{ color: "red" }}>{error}</p>}
    </div>
  );
}

