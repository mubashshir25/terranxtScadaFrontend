import React, { useState, useContext, useRef, useEffect } from "react";
import { AuthContext } from "../context/AuthContext";
import { logoutUser } from "../services/auth";
import { useNavigate } from "react-router-dom";

const ProfileButton: React.FC = () => {
  const { user, setUser } = useContext(AuthContext);
  const [isHovered, setIsHovered] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, right: 0 });
  const buttonRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (isHovered && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + 8,
        right: window.innerWidth - rect.right,
      });
    }
  }, [isHovered]);

  if (!user) return null;

  const handleLogout = async () => {
    await logoutUser();
    setUser(null);
    navigate("/login");
  };

  const getInitials = (username: string): string => {
    return username.charAt(0).toUpperCase();
  };

  const profileImage = user.profile_image || null;

  return (
    <div 
      ref={buttonRef}
      className="profile-button-container"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <button 
        className="profile-button"
        aria-label="User profile"
        style={{
          width: "40px",
          height: "40px",
          borderRadius: "50%",
          border: "2px solid var(--color-border, #e5e7eb)",
          backgroundColor: "var(--color-bg-secondary, #f3f4f6)",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "16px",
          fontWeight: "600",
          color: "var(--color-text-primary, #111827)",
          overflow: "hidden",
          padding: 0,
          transition: "all 0.2s ease",
        }}
      >
        {profileImage ? (
          <img 
            src={profileImage} 
            alt={user.username}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          />
        ) : (
          <span>{getInitials(user.username)}</span>
        )}
      </button>

      {isHovered && (
        <div 
          className="profile-dropdown"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          style={{
            position: "fixed",
            top: `${dropdownPosition.top}px`,
            right: `${dropdownPosition.right}px`,
            backgroundColor: "var(--color-bg-primary, #ffffff)",
            border: "1px solid var(--color-border, #e5e7eb)",
            borderRadius: "8px",
            boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
            padding: "16px",
            minWidth: "250px",
            zIndex: 99999,
            animation: "fadeIn 0.2s ease",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px", paddingBottom: "16px", borderBottom: "1px solid var(--color-border, #e5e7eb)" }}>
            <div
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "50%",
                backgroundColor: "var(--color-bg-secondary, #f3f4f6)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "20px",
                fontWeight: "600",
                color: "var(--color-text-primary, #111827)",
                overflow: "hidden",
                flexShrink: 0,
              }}
            >
              {profileImage ? (
                <img 
                  src={profileImage} 
                  alt={user.username}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                  }}
                />
              ) : (
                <span>{getInitials(user.username)}</span>
              )}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ 
                fontSize: "16px", 
                fontWeight: "600", 
                color: "var(--color-text-primary, #111827)",
                marginBottom: "4px",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}>
                {user.username}
              </div>
              {user.email && (
                <div style={{ 
                  fontSize: "14px", 
                  color: "var(--color-text-secondary, #6b7280)",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}>
                  {user.email}
                </div>
              )}
            </div>
          </div>
          
          <button
            onClick={handleLogout}
            style={{
              width: "100%",
              padding: "10px 16px",
              backgroundColor: "var(--color-error, #ef4444)",
              color: "#ffffff",
              border: "none",
              borderRadius: "6px",
              fontSize: "14px",
              fontWeight: "500",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              transition: "background-color 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "var(--color-error-dark, #dc2626)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "var(--color-error, #ef4444)";
            }}
          >
            <svg viewBox="0 0 20 20" fill="currentColor" style={{ width: "16px", height: "16px" }}>
              <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd" />
            </svg>
            Logout
          </button>
        </div>
      )}
      
      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .profile-button-container {
          position: relative;
        }
        .profile-dropdown {
          pointer-events: auto;
        }
      `}</style>
    </div>
  );
};

export default ProfileButton;

