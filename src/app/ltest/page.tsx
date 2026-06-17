"use client";

import { useState } from "react";

export default function LTestPage() {
  const [loading, setLoading] = useState(false);
  const [raw, setRaw] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const run = async () => {
    setLoading(true);
    setRaw(null);
    setError(null);
    try {
      const res = await fetch("/api/compliance/llm-analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productName: "AI营销配图",
          description: "AI生成营销配图，用户手机号注册，AI自动换背景生成文案投小红书",
          mode: "quick",
        }),
      });
      const text = await res.text();
      if (!res.ok) {
        setError(`HTTP ${res.status}: ${text.slice(0, 500)}`);
        setLoading(false);
        return;
      }
      setRaw(text.slice(0, 5000));
      setLoading(false);
    } catch (e) {
      setError(String(e));
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 40, fontFamily: "monospace" }}>
      <h1>LLM API Test</h1>
      <button
        onClick={run}
        disabled={loading}
        style={{ padding: "12px 24px", fontSize: 16, cursor: "pointer" }}
      >
        {loading ? "Calling..." : "Test LLM Analyze"}
      </button>

      {loading && <p>Loading...</p>}

      {error && (
        <div style={{ color: "red", marginTop: 20, whiteSpace: "pre-wrap" }}>
          ERROR: {error}
        </div>
      )}

      {raw && (
        <div style={{ marginTop: 20 }}>
          <h3>Response:</h3>
          <pre style={{ background: "#f5f5f5", padding: 16, borderRadius: 8, overflow: "auto", maxHeight: 600 }}>
            {raw}
          </pre>
        </div>
      )}
    </div>
  );
}
