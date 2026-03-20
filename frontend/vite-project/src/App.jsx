import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  Outlet,
} from "react-router-dom";
import { useEffect, useState } from "react";
import { MdMenu } from "react-icons/md";
import Login from "./pages/Login";
import AuthCallback from "./pages/AuthCallback";
import LegalDesk from "./pages/LegalDesk";
import FindLawyer from "./pages/FindLawyer";
import CompleteRegistration from "./pages/CompleteRegistration";
import LawyerRequests from "./pages/LawyerRequests";
import LawyerOnboard from "./pages/LawyerOnboard";
import ChatView from "./pages/ChatView";
import MyClients from "./pages/MyClients";
import FormAutoFill from "./pages/FormAutoFill";
import GeneralAsk from "./pages/GeneralAsk";
import Sidebar from "./components/Sidebar";
import ProtectedRoute from "./components/ProtectedRoute";
import Home from "./pages/Home";
import api from "./Axios/axios";
import useAuthStore from "./context/AuthContext";

/* ───────────── Layout ───────────── */
function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
   <div
    style={{
      display: "flex",
      height: "100vh",
      width: "100%",
      overflow: "hidden",
    }}
   >
      
      {/* Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        toggleSidebar={() => setSidebarOpen((s) => !s)}
      />

      {/* Floating button */}
      {!sidebarOpen && (
        <button
          onClick={() => setSidebarOpen(true)}
          style={{
            position: "fixed",
            top: 16,
            left: 16,
            zIndex: 50,
            padding: 8,
            borderRadius: 8,
            background: "white",
            boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05)",
          }}
        >
          <MdMenu size={20} />
        </button>
      )}

      {/* Main Content */}
     <div
       style={{
         flex: 1,
         overflow: "auto",
         background: "#f9fafb",
         padding: 0,
       }}
     >
        <Outlet />
      </div>
    </div>
  );
}

/* ───────────── App ───────────── */
function App() {
  const token = useAuthStore((state) => state.token);
  const setUser = useAuthStore((state) => state.setUser);

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

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
        {/* Redirect root */}
        <Route path="/" element={<Navigate to="/home" replace />} />

        {/* Layout wrapper */}
        <Route path="/*" element={<Layout />}>
          
          <Route
            path="home"
            element={
              <>
            {/* <ProtectedRoute> */}
                <Home />
              {/* </ProtectedRoute> */}
              </>
            }
          />
        <Route 
          path="legal-desk"
          element={
             <>
            {/* <ProtectedRoute> */}
            <LegalDesk />
             {/* </ProtectedRoute> */}
              </>
          } 
          />
          {/* <Route
            path="/legal-desk/:id"
            element={
              <> */}
              {/* <ProtectedRoute> */}
                {/* <NotebookPage /> */}
              {/* </ProtectedRoute> */}
              {/* </>
            }
          /> */}
          <Route
            path="find-lawyer"
            element={
              <>
              {/* <ProtectedRoute> */}
                <FindLawyer />
              {/* </ProtectedRoute> */}
              </>
            }
          />
          <Route
            path="onboard-lawyer"
            element={
              <>
              {/* <ProtectedRoute> */}
                <LawyerOnboard  />
              {/* </ProtectedRoute> */}
              </>
            }
          />
          <Route
            path="complete-registration"
            element={
              <>
              {/* <ProtectedRoute> */}
                <CompleteRegistration/>
              {/* </ProtectedRoute> */}
              </>
            }
          />
          <Route
            path="lawyer/requests"
            element={
              <>
              {/* <ProtectedRoute> */}
                <LawyerRequests/>
              {/* </ProtectedRoute> */}
              </>
            }
          />
           <Route
            path="mylawyers"
            element={
              <>
              {/* <ProtectedRoute> */}
                <MyClients/>
              {/* </ProtectedRoute> */}
              </>
            }
          />
            <Route
            path="forms/auto-fill"
            element={
              <>
              {/* <ProtectedRoute> */}
                <FormAutoFill/>
              {/* </ProtectedRoute> */}
              </>
            }
          />
            <Route
            path="general-ask"
            element={
              <>
              {/* <ProtectedRoute> */}
                <GeneralAsk/>
              {/* </ProtectedRoute> */}
              </>
            }
          />
          <Route
            path="chat/:id"
            element={
              <>
              {/* <ProtectedRoute> */}
                <ChatView/>
              {/* </ProtectedRoute> */}
              </>
            }
          />
          <Route
            path="chats"
            element={
              <>
              {/* <ProtectedRoute> */}
                <ChatView/>
              {/* </ProtectedRoute> */}
              </>
            }
          />
          <Route
            path="chats/:id"
            element={
              <>
              {/* <ProtectedRoute> */}
                <ChatView/>
              {/* </ProtectedRoute> */}
              </>
            }
          />
           <Route
            path="*"
            element={
              <Navigate to={'/home'} />
            }
          />
        </Route>

      </Routes>
    </Router>
  );
}

export default App;