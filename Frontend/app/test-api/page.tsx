"use client";

import { useEffect, useState } from "react";

export default function TestAPI() {
  const [apiUrl, setApiUrl] = useState("Loading...");
  const [testResult, setTestResult] = useState("Loading...");

  useEffect(() => {
    console.log("TestAPI useEffect running");
    const url = "http://localhost:8000";
    setApiUrl(url);
    
    console.log("Making API call to:", url);
    
    // Test API call
    fetch(`${url}/health`)
      .then(res => {
        console.log("API response received:", res.status);
        return res.json();
      })
      .then(data => {
        console.log("API data:", data);
        setTestResult(`Success: ${JSON.stringify(data)}`);
      })
      .catch(err => {
        console.error("API error:", err);
        setTestResult(`Error: ${err.message}`);
      });
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">API Test</h1>
      <div className="space-y-2">
        <p><strong>API URL:</strong> {apiUrl}</p>
        <p><strong>Test Result:</strong> {testResult}</p>
        <p><strong>Timestamp:</strong> {new Date().toISOString()}</p>
      </div>
    </div>
  );
}