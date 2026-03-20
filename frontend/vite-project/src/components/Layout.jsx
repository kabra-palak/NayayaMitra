import { Outlet } from "react-router-dom";
import { useState } from "react";
import { MdMenu } from "react-icons/md";
import Sidebar from "./components/Sidebar";

function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="flex h-screen"> {/* ✅ THIS IS KEY */}

      {/* Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        toggleSidebar={() => setSidebarOpen(s => !s)}
      />

      {/* Main Content */}
      <div className="flex-1 overflow-auto bg-gray-50">
        <Outlet /> {/* ✅ pages render here */}
      </div>

    </div>
  );
}