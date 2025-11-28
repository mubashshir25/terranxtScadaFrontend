import React, { useContext, useEffect, useState } from "react";
import { Outlet, Link, useLocation } from "react-router-dom";
import ChatBot from "./ChatBot";
import { AuthContext } from "../context/AuthContext";
import ProfileButton from "./ProfileButton";
import companyLogo from "../companylogo.png";
import sigLogo from "../siglogo.png";

const Layout: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(true);
  const [isChatOpen, setIsChatOpen] = useState(true);
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  const { user } = useContext(AuthContext);
  const location = useLocation();

  useEffect(() => {
    const saved = (localStorage.getItem("theme") as "light" | "dark") || "dark";
    setTheme(saved);
    document.documentElement.setAttribute("data-theme", saved);
  }, []);

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    localStorage.setItem("theme", next);
    document.documentElement.setAttribute("data-theme", next);
  };

  const isActive = (path: string) => {
    return location.pathname === path ? "active" : "";
  };

  return (
    <div className="app-grid">
      {/* Left rail - SwitchPlane */}
      <aside className="left-rail">
        <div className="left-rail-header">
          <img src={sigLogo} alt="TERRANXT" className="left-rail-logo" />
          <span>switchPlane</span>
        </div>
        <div className="left-rail-body">
          <nav className="left-rail-nav">
            <Link to="/dashboard" className={`nav-item ${isActive("/dashboard")}`}>
              <svg viewBox="0 0 20 20" fill="currentColor">
                <path d="M2 10a8 8 0 018-8v8h8a8 8 0 11-16 0z" />
                <path d="M12 2.252A8.014 8.014 0 0117.748 8H12V2.252z" />
              </svg>
              <span>Dashboard</span>
            </Link>
            <Link to="/monitoring" className={`nav-item ${isActive("/monitoring")}`}>
              <svg viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 5a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2h-2.22l.123.489.804.804A1 1 0 0113 18H7a1 1 0 01-.707-1.707l.804-.804L7.22 15H5a2 2 0 01-2-2V5zm5.771 7H5V5h10v7H8.771z" clipRule="evenodd" />
              </svg>
              <span>Monitoring</span>
            </Link>
            <Link to="/alarms" className={`nav-item ${isActive("/alarms")}`}>
              <svg viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <span>Alarms</span>
            </Link>
            <Link to="/reports" className={`nav-item ${isActive("/reports")}`}>
              <svg viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm5 6a1 1 0 10-2 0v3.586l-1.293-1.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V8z" clipRule="evenodd" />
              </svg>
              <span>Reports</span>
            </Link>
            <Link to="/plants" className={`nav-item ${isActive("/plants")}`}>
              <svg viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>Plants</span>
            </Link>
            <Link to="/devices" className={`nav-item ${isActive("/devices")}`}>
              <svg viewBox="0 0 20 20" fill="currentColor">
                <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z" />
              </svg>
              <span>Devices</span>
            </Link>
            <Link to="/digital-twins" className={`nav-item ${isActive("/digital-twins")}`}>
              <svg viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm3 1h6v4H7V5zm6 6H7v2h6v-2z" clipRule="evenodd" />
              </svg>
              <span>Digital Twins</span>
            </Link>
            <Link to="/predicted-generation" className={`nav-item ${isActive("/predicted-generation")}`}>
              <svg viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
              </svg>
              <span>Predicted Generation</span>
            </Link>
            <Link to="/shadow-analysis" className={`nav-item ${isActive("/shadow-analysis")}`}>
              <svg viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
              </svg>
              <span>Shadow Analysis</span>
            </Link>
            <Link to="/settings" className={`nav-item ${isActive("/settings")}`}>
              <svg viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
              </svg>
              <span>Settings</span>
            </Link>
          </nav>
        </div>
      </aside>

      {/* Top toolbar */}
      <div className="toolbar">
        <div className="toolbar-title">
          <img src={companyLogo} alt="TERRANXT" className="toolbar-logo" />
          <div className="toolbar-title-text">
            <span className="toolbar-title-main">TERRANXT SCADA</span>
            <span className="toolbar-title-sub">Industrial Control System</span>
          </div>
        </div>
        <div className="toolbar-actions">
          <button 
            className="btn btn-icon" 
            onClick={toggleTheme}
            aria-label="Toggle theme"
            title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          >
            {theme === "dark" ? (
              <svg viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg viewBox="0 0 20 20" fill="currentColor">
                <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
              </svg>
            )}
          </button>
          <div className="toolbar-user">
            {user ? (
              <ProfileButton />
            ) : null}
          </div>
        </div>
      </div>

      {/* Main area: content + right rail */}
      <div className="main-grid">
        <div className="content-panel">
          <Outlet />
        </div>

        <aside className="right-rail">
          {/* Menu panel */}
          <div className={`panel ${isMenuOpen ? "" : "collapsed"}`}>
            <div className="panel-header" onClick={() => setIsMenuOpen((v) => !v)}>
              <span>Menu</span>
              <button className="panel-toggle" aria-label="Toggle menu">
                {isMenuOpen ? "−" : "+"}
              </button>
            </div>
            {isMenuOpen && (
              <div className="panel-body">
                {/* Placeholder for menu items */}
              </div>
            )}
          </div>

          {/* ChatBot panel */}
          <div className={`panel ${isChatOpen ? "" : "collapsed"}`}>
            <div className="panel-header" onClick={() => setIsChatOpen((v) => !v)}>
              <span>ChatBot</span>
              <button className="panel-toggle" aria-label="Toggle chatbot">
                {isChatOpen ? "−" : "+"}
              </button>
            </div>
            {isChatOpen && (
              <div className="panel-body chatbot-body">
                <ChatBot />
              </div>
            )}
          </div>
        </aside>
      </div>

      {/* Details panel at the bottom middle */}
      <div className="details-panel">
        {/* Placeholder for details content */}
      </div>
    </div>
  );
};

export default Layout;

