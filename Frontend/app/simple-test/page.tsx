"use client";

export default function SimpleTest() {
  return (
    <div className="p-6">
      <h1>Simple Test</h1>
      <p>Current time: {new Date().toISOString()}</p>
      <button onClick={() => alert("Button clicked!")}>
        Click me
      </button>
    </div>
  );
}