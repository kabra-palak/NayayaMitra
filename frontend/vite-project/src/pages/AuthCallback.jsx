import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../Axios/axios";
import useAuthStore from "../context/AuthContext";

const AuthCallback = () => {
  const navigate = useNavigate();

  // ✅ FIXED zustand usage
  const setToken = useAuthStore((s) => s.setToken);
  const setUser = useAuthStore((s) => s.setUser);

  useEffect(() => {
    const handleAuth = async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const token = params.get("token");

        if (!token) {
          navigate("/login", { replace: true });
          return;
        }

        // save token
        setToken(token);

        // fetch user
        const res = await api.get("/auth/me", {
          headers: { Authorization: `Bearer ${token}` },
        });

        const user = res.data.user || res.data;
        setUser(user);

        // redirect based on profile
        if (!user || !user.role) {
          navigate("/complete-registration", { replace: true });
        } else {
          navigate("/home", { replace: true });
        }

      } catch (err) {
        console.error("AuthCallback error:", err);
        setUser(null);
        navigate("/login", { replace: true });
      }
    };

    handleAuth();
  }, [navigate, setToken, setUser]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-gray-600 text-lg">Logging you in...</div>
    </div>
  );
};

export default AuthCallback;