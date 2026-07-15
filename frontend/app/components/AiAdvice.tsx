"use client";

import React, { useState } from "react";
import ReactMarkdown from "react-markdown";

interface AiAdviceProps {
  projectId: string;
}

export default function AiAdvice({ projectId }: AiAdviceProps) {
  const [advice, setAdvice] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  const fetchAiAdvice = async () => {
    setLoading(true);
    setError("");
    setAdvice("");

    try {
      // Backend Endpoint එකට Call කිරීම (ඔයාගේ backend port එක 8000 නිසා)
      const res = await fetch(`http://127.0.0.1:8000/projects/${projectId}/ai-advice`);
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.detail || "Something went wrong");
      }

      const data = await res.json();
      setAdvice(data.ai_recommendation);
    } catch (err: any) {
      setError(err.message || "Failed to load AI suggestions");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-white rounded-xl shadow-md border border-gray-100 mt-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            🤖 AI-Powered SQA Assistant
          </h2>
          <p className="text-sm text-gray-500">Get optimized code recommendations based on your SonarQube metrics</p>
        </div>
        
        <button
          onClick={fetchAiAdvice}
          disabled={loading}
          className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-all disabled:bg-indigo-400 flex items-center gap-2"
        >
          {loading ? (
            <>
              <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Analyzing Report...
            </>
          ) : (
            "Analyze with Gemini AI"
          )}
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
          ⚠️ {error}
        </div>
      )}

      {/* Markdown Results Display */}
      {advice && (
        <div className="mt-4 p-5 bg-gray-50 rounded-lg border border-gray-200 text-gray-800 prose max-w-none">
          <ReactMarkdown
            components={{
              code({ node, className, children, ...props }) {
                return (
                  <code className="bg-gray-800 text-orange-400 px-1.5 py-0.5 rounded text-sm font-mono block p-4 my-2 overflow-x-auto" {...props}>
                    {children}
                  </code>
                );
              }
            }}
          >
            {advice}
          </ReactMarkdown>
        </div>
      )}

      {/* Default Placeholder */}
      {!advice && !loading && !error && (
        <div className="text-center py-8 text-gray-400 border-2 border-dashed border-gray-200 rounded-lg">
          Click the button above to generate smart code recommendations.
        </div>
      )}
    </div>
  );
}