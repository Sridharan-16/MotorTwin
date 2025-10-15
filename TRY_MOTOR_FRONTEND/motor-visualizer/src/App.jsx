import React, { useState, useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, useGLTF, Environment } from "@react-three/drei";
import * as THREE from "three";
import { io } from "socket.io-client";

// --- Auth Forms ---
function AuthForm({ type, onSuccess, switchForm }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    const res = await fetch(`http://localhost:5000/api/auth/${type}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    const data = await res.json();
    if (res.ok) {
      localStorage.setItem("auth", "true");
      onSuccess();
    } else {
      setError(data.error || "Auth failed");
    }
  }
  return (
    <div style={{ maxWidth: 340, margin: "100px auto", padding: 28, border: "1px solid #ddd", background: "#fff", borderRadius: 10 }}>
      <h2 style={{ marginBottom: 20 }}>{type === "login" ? "Login" : "Sign Up"}</h2>
      <form onSubmit={handleSubmit}>
        <input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Username" style={{ display: "block", width: "100%", marginBottom: 14, padding: 8 }} />
        <input value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" type="password" style={{ display: "block", width: "100%", marginBottom: 18, padding: 8 }} />
        <button type="submit" style={{ width: "100%", padding: 10, background: "#0d6efd", color: "#fff", border: "none", borderRadius: 5 }}>
          {type === "login" ? "Login" : "Sign Up"}
        </button>
      </form>
      {error && <div style={{ color: "#dc3545", marginTop: 12 }}>{error}</div>}
      <div style={{ marginTop: 18, textAlign: "center" }}>
        {type === "login" ? (
          <>Don't have an account? <button style={{ border: 'none', background: 'none', color: '#0d6efd', cursor: 'pointer' }} onClick={() => switchForm("signup")}>Sign up</button></>
        ) : (
          <>Already have an account? <button style={{ border: 'none', background: 'none', color: '#0d6efd', cursor: 'pointer' }} onClick={() => switchForm("login")}>Login</button></>
        )}
      </div>
    </div>
  );
}

function LogoutBtn({ onLogout }) {
  return <button style={{ position:'fixed',top:20,right:32,zIndex:10,background:'#dc3545',color:'#fff',border:'none',borderRadius:6,padding:'7px 16px',fontSize:14,cursor:'pointer',boxShadow:'0 2px 7px #0001'}} onClick={onLogout}>Logout</button>;
}

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
  const [auth, setAuth] = useState(() => localStorage.getItem("auth") === "true");
  const [authPage, setAuthPage] = useState("login");
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
      // Check if backend sends string directly
      const message = typeof data === "string" ? data : data.fault || data.response || "No analysis data";
      // Determine which parts are faulted
      const lowerMsg = message.toLowerCase();
      const faultedParts = {};
      if (lowerMsg.includes("commutator")) faultedParts["commutator"] = true;
      if (lowerMsg.includes("severe")) faultedParts["rotor"] = true;
      if (lowerMsg.includes("brush")) faultedParts["brush"] = true;
      if (lowerMsg.includes("fan")) faultedParts["fan"] = true;
      if (lowerMsg.includes("shaft")) faultedParts["shaft"] = true;
      setParts((prev) =>
        Object.fromEntries(
          Object.keys(prev).map((key) => [
            key,
            { ...prev[key], faulted: !!faultedParts[key] },
          ])
        )
      );
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

  // --- Real-time Updates from Backend ---
  useEffect(() => {
    if (!auth) return;
    const socket = io("http://localhost:5000");
    socket.on("motor-update", () => {
      refreshStatus();
    });
    return () => {
      socket.disconnect();
    };
    // eslint-disable-next-line
  }, [auth]);

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

  const handleLogout = () => {
    setAuth(false);
    localStorage.removeItem("auth");
    setParts(Object.fromEntries(Object.keys(motorParts).map(key => [key, { faulted: false, visible: true }])));
    setQuestion("");
    setNotifications([]);
    setChatMessages([]);
  };

  if (!auth) {
    return <AuthForm type={authPage} onSuccess={() => setAuth(true)} switchForm={setAuthPage} />;
  }

  return (<>
    <LogoutBtn onLogout={handleLogout} />
    {/* --- 3D Viewer and Side Panel --- */}
    <div style={{ height: "100vh", display: "flex", background: "#e9ecef" }}>
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
  </>);
}
