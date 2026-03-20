import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import './App.css'
import Sidebar from "./components/Sidebar";
// import Header from "./components/Header";
import api from "./Axios/axios";
import useAuthStore from "./context/AuthContext";

function App() {
  const token = useAuthStore((state) => state.token);
  const setUser = useAuthStore((state) => state.setUser);
  // const [theme] = useState("light");
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        if (!token) return;
        const resp = await api.get("/auth/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUser(resp.data.user);
      } catch (err) {
        console.error(err);
      }
    };
    fetchProfile();
  }, [token, setUser]);

  // Apply simple body-level theme class for light/dark toggling
  // useEffect(() => {
  //   // initialize dynamic palette variables
  //   applyPalette(defaultPalette);
  // }, [theme]);

  return (
    <Router>
      <Routes>
        <Route
          path="/*"
          element={
            <div className="flex h-screen">
              
              {/* Sidebar */}
              <Sidebar
                isOpen={sidebarOpen}
                toggleSidebar={() => setSidebarOpen((s) => !s)}
              />

              {/* Open button when sidebar is closed */}
              {!sidebarOpen && (
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="fixed top-4 left-4 z-50 p-2 rounded-md bg-white shadow-md"
                >
                  <MdMenu size={20} />
                </button>
              )}

              {/* Empty main area (for now) */}
              <div className="flex-1 bg-gray-50 flex items-center justify-center">
                <h1 className="text-xl text-gray-500">
                  Main Content Area
                </h1>
              </div>

            </div>
          }
        />
      </Routes>
    </Router>
  )
}

export default App
