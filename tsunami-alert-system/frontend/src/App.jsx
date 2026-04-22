import { Route, Routes } from "react-router-dom";
import Navbar from "./components/UI/Navbar";
import Home from "./pages/Home";
import AdminDashboard from "./pages/AdminDashboard";
import EvacuationPage from "./pages/EvacuationPage";

export default function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 flex min-h-0">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/evac" element={<EvacuationPage />} />
        </Routes>
      </main>
    </div>
  );
}
