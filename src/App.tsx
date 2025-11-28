import React, { useContext } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import Monitoring from "./pages/Monitoring";
import Alarms from "./pages/Alarms";
import Reports from "./pages/Reports";
import Plants from "./pages/Plants";
import Devices from "./pages/Devices";
import DigitalTwins from "./pages/DigitalTwins";
import PredictedGeneration from "./pages/PredictedGeneration";
import ShadowAnalysis from "./pages/ShadowAnalysis";
import Settings from "./pages/Settings";
import Layout from "./components/Layout";
import { AuthProvider, AuthContext } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";

// Component to handle redirects based on auth state
const AuthRedirect: React.FC = () => {
  const { isAuthenticated, isLoading } = useContext(AuthContext);
  
  if (isLoading) {
    return (
      <div style={{ 
        display: "flex", 
        justifyContent: "center", 
        alignItems: "center", 
        height: "100vh",
        fontSize: "18px"
      }}>
        Loading...
      </div>
    );
  }
  
  return isAuthenticated ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />;
};

const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/" element={
        <ProtectedRoute>
          <Layout />
        </ProtectedRoute>
      }>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="monitoring" element={<Monitoring />} />
        <Route path="alarms" element={<Alarms />} />
        <Route path="reports" element={<Reports />} />
        <Route path="plants" element={<Plants />} />
        <Route path="devices" element={<Devices />} />
        <Route path="digital-twins" element={<DigitalTwins />} />
        <Route path="predicted-generation" element={<PredictedGeneration />} />
        <Route path="shadow-analysis" element={<ShadowAnalysis />} />
        <Route path="settings" element={<Settings />} />
      </Route>
      <Route path="*" element={<AuthRedirect />} />
    </Routes>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
