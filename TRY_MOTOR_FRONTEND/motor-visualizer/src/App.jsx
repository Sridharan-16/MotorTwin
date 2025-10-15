import React, { useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, useGLTF, Environment } from "@react-three/drei";
import * as THREE from "three";

// --- Reusable Motor Part ---
function MotorPart({ path, faulted }) {
  const { scene } = useGLTF(path);
  const part = scene.clone(true);

  part.traverse((child) => {
    if (child.isMesh) {
      child.receiveShadow = true;
      child.material = new THREE.MeshStandardMaterial({
        color: faulted ? "red" : "#7a7a7a",
        metalness: 0.6,
        roughness: 0.4,
      });
    }
  });

  return <primitive object={part} />;
}

// --- Motor Parts ---
const motorParts = {
  shaft: "Shaft/Shaft.gltf",
  rotor: "Rotor/Rotor.gltf",
  fan: "Fan/Fan.gltf",
  commutator: "Commutator/Commutator.gltf",
  casing: "Casing/Casing.gltf",
  brush: "Carbon_brush/Carbon_Brush.gltf",
  outerCasing: "Outer_casing/Outer_Casing.gltf",
  brushHolder: "Carbon_brush_holder/Carbon_Brush_Holder.gltf",
  backCover: "Back_cover/Back_Cover.gltf",
  magnet: "Magnet/Magnet.gltf",
};

export default function App() {
  const [parts, setParts] = useState(
    Object.fromEntries(
      Object.keys(motorParts).map((key) => [key, { faulted: false, visible: true }])
    )
  );

  const [notifications, setNotifications] = useState([]);
  const [chatMessages, setChatMessages] = useState([]);
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);

  // --- Controls ---
  const toggleFault = (part) => {
    setParts((prev) => ({
      ...prev,
      [part]: { ...prev[part], faulted: !prev[part].faulted },
    }));
  };

  const toggleVisibility = (part) => {
    setParts((prev) => ({
      ...prev,
      [part]: { ...prev[part], visible: !prev[part].visible },
    }));
  };

  // --- Refresh Motor Status & Notifications ---
  const refreshStatus = async () => {
  try {
    const res = await fetch("http://localhost:5000/api/analysis-data");
    const data = await res.json();
    console.log(data);

    // Check if backend sends a string directly
    const message = typeof data === "string" ? data : data.fault || data.response || "No analysis data";

    // Determine which parts are faulted
    const lowerMsg = message.toLowerCase();
    const faultedParts = {};
    if (lowerMsg.includes("commutator")) faultedParts["commutator"] = true;
    if (lowerMsg.includes("severe")) faultedParts["rotor"] = true;
    if (lowerMsg.includes("brush")) faultedParts["brush"] = true;
    if (lowerMsg.includes("fan")) faultedParts["fan"] = true;
    if (lowerMsg.includes("shaft")) faultedParts["shaft"] = true;

    // Update parts state
    setParts((prev) =>
      Object.fromEntries(
        Object.keys(prev).map((key) => [
          key,
          { ...prev[key], faulted: !!faultedParts[key] },
        ])
      )
    );

    // Determine notification type
    const type = lowerMsg.includes("healthy") ? "success" : "error";

    setNotifications((prev) => [
      ...prev,
      { id: Date.now(), message, type },
    ]);
  } catch (err) {
    console.error(err);
    setNotifications((prev) => [
      ...prev,
      { id: Date.now(), message: "Error fetching motor analysis", type: "error" },
    ]);
  }
};

  // --- Chatbot ---
  const sendMessage = async () => {
    if (!question.trim()) return;

    setChatMessages((prev) => [...prev, { sender: "user", text: question }]);
    setQuestion("");
    setLoading(true);

    try {
      const res = await fetch("http://localhost:5000/api/chatbot-question", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
      });
      const data = await res.json();

      setChatMessages((prev) => [
        ...prev,
        { sender: "bot", text: data.response || data.fault || "No response available." },
      ]);
    } catch (err) {
      console.error("Chatbot error:", err);
      setChatMessages((prev) => [
        ...prev,
        { sender: "bot", text: "⚠️ Error connecting to chatbot." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ height: "100vh", display: "flex", background: "#e9ecef" }}>
      {/* --- 3D Viewer --- */}
      <Canvas shadows camera={{ position: [0, 0.3, 0], fov: 45 }}>
        <ambientLight intensity={0.4} />
        <directionalLight position={[10, 15, 10]} intensity={1.2} castShadow />
        <spotLight position={[-10, 20, -5]} angle={0.3} intensity={1} castShadow />

        <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, -2, 0]}>
          <planeGeometry args={[50, 50]} />
          <shadowMaterial opacity={0.25} />
        </mesh>

        {Object.entries(motorParts).map(([key, path]) =>
          parts[key].visible ? <MotorPart key={key} path={`/${path}`} faulted={parts[key].faulted} /> : null
        )}

        <Environment preset="warehouse" />
        <OrbitControls enablePan enableZoom enableRotate />
      </Canvas>

      {/* --- Right Side Panel --- */}
      <div style={{ width: "400px", display: "flex", flexDirection: "column", borderLeft: "1px solid #ddd", background: "#fff", padding: "20px" }}>
        <h2 style={{ marginBottom: "15px" }}>Motor Control Panel</h2>

        {/* Refresh Button */}
        <button
          onClick={refreshStatus}
          style={{ padding: "10px", marginBottom: "15px", borderRadius: "6px", border: "none", cursor: "pointer", background: "#0d6efd", color: "#fff" }}
        >
          🔄 Refresh Status
        </button>

        {/* Notifications */}
        <div style={{ marginBottom: "15px" }}>
          {notifications.map((note) => (
            <div
              key={note.id}
              style={{
                padding: "10px",
                borderRadius: "6px",
                marginBottom: "10px",
                background: note.type === "error" ? "#f8d7da" : "#d1e7dd",
                color: note.type === "error" ? "#842029" : "#0f5132",
                border: note.type === "error" ? "1px solid #f5c2c7" : "1px solid #badbcc",
              }}
            >
              {note.message}
            </div>
          ))}
        </div>

        {/* Chatbot Panel */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", border: "1px solid #ddd", borderRadius: "8px", padding: "10px", marginBottom: "15px" }}>
          <div style={{ flex: 1, overflowY: "auto", marginBottom: "10px", background: "#f8f9fa", padding: "8px", borderRadius: "5px" }}>
            {chatMessages.map((msg, idx) => (
              <div key={idx} style={{ textAlign: msg.sender === "user" ? "right" : "left", marginBottom: "8px" }}>
                <span style={{
                  display: "inline-block",
                  padding: "8px 12px",
                  borderRadius: "15px",
                  background: msg.sender === "user" ? "#0d6efd" : "#e9ecef",
                  color: msg.sender === "user" ? "#fff" : "#333",
                }}>
                  {msg.text}
                </span>
              </div>
            ))}
          </div>
          <div style={{ display: "flex" }}>
            <input
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Ask the chatbot..."
              style={{ flex: 1, padding: "8px", borderRadius: "5px 0 0 5px", border: "1px solid #ccc", marginRight: "8px" }}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            />
            <button
              onClick={sendMessage}
              style={{ padding: "8px 12px", borderRadius: "0 5px 5px 0", border: "none", background: "#198754", color: "#fff", cursor: "pointer" }}
            >
              {loading ? "..." : "Send"}
            </button>
          </div>
        </div>

        {/* Part Controls */}
        {Object.keys(parts).map((part) => (
          <div key={part} style={{ marginBottom: "10px", padding: "8px", border: "1px solid #ddd", borderRadius: "6px", background: "#f9f9f9" }}>
            <strong style={{ textTransform: "capitalize" }}>{part}</strong>
            <div style={{ marginTop: "6px" }}>
              <button
                onClick={() => toggleFault(part)}
                style={{
                  padding: "5px 10px",
                  marginRight: "6px",
                  borderRadius: "5px",
                  border: "none",
                  cursor: "pointer",
                  background: parts[part].faulted ? "#dc3545" : "#198754",
                  color: "#fff",
                }}
              >
                {parts[part].faulted ? "Clear Fault" : "Fault"}
              </button>
              <button
                onClick={() => toggleVisibility(part)}
                style={{
                  padding: "5px 10px",
                  borderRadius: "5px",
                  border: "none",
                  cursor: "pointer",
                  background: parts[part].visible ? "#0d6efd" : "#6c757d",
                  color: "#fff",
                }}
              >
                {parts[part].visible ? "Hide" : "Show"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
