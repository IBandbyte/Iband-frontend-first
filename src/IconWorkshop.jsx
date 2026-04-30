import { useState } from "react";

export default function IconWorkshop() {
  const [size, setSize] = useState(220);
  const [glow, setGlow] = useState(6);
  const [stroke, setStroke] = useState(12);

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>iBand Icon Workshop — Like Replica Test</h2>

      <div style={styles.panel}>
        <Control label="Size" value={size} min={40} max={360} step={1} onChange={setSize} />
        <Control label="Stroke" value={stroke} min={4} max={20} step={0.5} onChange={setStroke} />
        <Control label="Glow" value={glow} min={0} max={14} step={0.5} onChange={setGlow} />
      </div>

      <div style={styles.preview}>
        <LikeIcon size={size} stroke={stroke} glow={glow} />
      </div>
    </div>
  );
}

function Control({ label, value, min, max, step, onChange }) {
  return (
    <div style={styles.control}>
      <label>{label}: {value}</label>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </div>
  );
}

function LikeIcon({ size = 220, stroke = 12, glow = 6 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 512 512" fill="none" style={{ display: "block" }}>
      <defs>
        <linearGradient id="ibandLikeGrad" x1="0" y1="0" x2="512" y2="512">
          <stop offset="0%" stopColor="#a855f7" />
          <stop offset="38%" stopColor="#ff2dfc" />
          <stop offset="68%" stopColor="#ff4d7a" />
          <stop offset="100%" stopColor="#ff9f1c" />
        </linearGradient>

        <filter id="ibandLikeGlow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation={glow} result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <g filter="url(#ibandLikeGlow)" stroke="url(#ibandLikeGrad)" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round">
        <path d="M420 90H190C90 90 60 140 60 210v110c0 50 35 80 80 85l-10 70 80-60h180c70 0 110-40 110-100V150c0-40-25-60-80-60z" />
        <path d="M170 290C110 190 200 140 255 210C310 140 400 190 340 290C310 340 280 370 255 390C230 370 200 340 170 290z" />
        <path d="M200 210C220 180 250 180 270 205" strokeWidth={stroke * 0.65} opacity="0.75" />
        <path d="M280 260L400 90" strokeWidth={stroke * 0.85} />
        <path d="M280 260C300 310 280 340 240 360" strokeWidth={stroke * 0.75} />
        <path d="M320 210C340 260 360 300 380 350" strokeWidth={stroke * 0.7} />
        <path d="M380 100H420C440 100 450 120 440 135C430 150 410 145 395 135" strokeWidth={stroke * 0.75} />
        <circle cx="360" cy="90" r="6" fill="url(#ibandLikeGrad)" stroke="none" />
        <circle cx="380" cy="80" r="6" fill="url(#ibandLikeGrad)" stroke="none" />
        <circle cx="400" cy="82" r="6" fill="url(#ibandLikeGrad)" stroke="none" />
        <circle cx="420" cy="95" r="6" fill="url(#ibandLikeGrad)" stroke="none" />
      </g>

      <g stroke="rgba(255,255,255,0.78)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" opacity="0.75">
        <path d="M420 90H190C90 90 60 140 60 210v110c0 50 35 80 80 85l-10 70 80-60h180c70 0 110-40 110-100V150c0-40-25-60-80-60z" />
        <path d="M170 290C110 190 200 140 255 210C310 140 400 190 340 290C310 340 280 370 255 390C230 370 200 340 170 290z" />
        <path d="M280 260L400 90" />
      </g>
    </svg>
  );
}

const styles = {
  container: {
    background: "#05030a",
    color: "#fff",
    minHeight: "100vh",
    padding: 20,
    fontFamily: "sans-serif"
  },
  title: {
    textAlign: "center",
    marginBottom: 20
  },
  panel: {
    display: "grid",
    gap: 12,
    marginBottom: 20
  },
  control: {
    display: "flex",
    flexDirection: "column",
    gap: 6
  },
  preview: {
    minHeight: 420,
    border: "1px solid #222",
    borderRadius: 18,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "#000",
    overflow: "hidden"
  }
};