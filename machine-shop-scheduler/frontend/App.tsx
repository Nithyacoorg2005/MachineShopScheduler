import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import Dashboard from "./src/pages/Dashboard";
import Schedule from "./src/pages/Schedule";
import Scenarios from "./src/pages/Scenarios";

const Placeholder = ({ title }: { title: string }) => (
  <div style={{ padding: 40, fontFamily: "Inter, sans-serif", color: "#111827" }}>
    <h2 style={{ fontWeight: 700, fontSize: 24 }}>{title}</h2>
    <p style={{ color: "#94a3b8", marginTop: 8 }}>Coming soon.</p>
  </div>
);

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/schedule" element={<Schedule />} />
        
       // ADD this:
<Route path="/scenarios" element={<Scenarios />} />
        
        <Route path="/machines" element={<Placeholder title="Machines" />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;