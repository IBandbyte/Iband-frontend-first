import React from "react";

export default function IbandRailLogo() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
      
      <img
        src="/IBand logo .PNG"
        alt="iBand Logo"
        style={{
          width: "40px",
          height: "40px",
          borderRadius: "50%",
          objectFit: "cover"
        }}
      />

      <div style={{ display: "flex", flexDirection: "column", lineHeight: "1.1" }}>
        <span style={{ fontWeight: "bold", fontSize: "16px" }}>
          iBandbyte
        </span>
        <span style={{ fontSize: "12px", opacity: 0.7 }}>
          Powered by Fans
        </span>
      </div>

    </div>
  );
}