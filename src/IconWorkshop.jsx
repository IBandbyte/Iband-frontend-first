import { useState } from "react";

export default function IconWorkshop() {
  const [size, setSize] = useState(56);
  const [stroke, setStroke] = useState(2.4);
  const [glow, setGlow] = useState(1.6);
  const [radius, setRadius] = useState(18);
  const [tail, setTail] = useState(12);

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>iBand Icon Workshop — Engineering Mode</h2>

      <div style={styles.panel}>
        <Control label="Size" value={size} min={24} max={120} step={1} onChange={setSize} />
        <Control label="Stroke" value={stroke} min={1} max={5} step={0.1} onChange={setStroke} />
        <Control label="Glow" value={glow} min={0} max={4} step={0.1} onChange={setGlow} />
        <Control label="Corner Radius" value={radius} min={8} max={30} step={1} onChange={setRadius} />
        <Control label="Tail Size" value={tail} min={6} max={20} step={1} onChange={setTail} />
      </div>

      <div style={styles.grid}>
        <Preview title="Like (Guitar Heart)">
          <LikeIcon size={size} stroke={stroke} glow={glow} radius={radius} tail={tail} />
        </Preview>

        <Preview title="Comment">
          <CommentIcon size={size} stroke={stroke} glow={glow} radius={radius} tail={tail} />
        </Preview>

        <Preview title="Save">
          <SaveIcon size={size} stroke={stroke} glow={glow} radius={radius} />
        </Preview>

        <Preview title="Share">
          <ShareIcon size={size} stroke={stroke} glow={glow} />
        </Preview>
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

function Preview({ title, children }) {
  return (
    <div style={styles.preview}>
      <div>{title}</div>
      {children}
    </div>
  );
}

function BaseSVG({ size, stroke, glow, children }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
      <defs>
        <linearGradient id="grad" x1="0" y1="0" x2="100" y2="100">
          <stop offset="0%" stopColor="#ff00cc" />
          <stop offset="100%" stopColor="#ff8800" />
        </linearGradient>

        <filter id="glow">
          <feGaussianBlur stdDeviation={glow * 2} result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {children({ stroke })}
    </svg>
  );
}

function LikeIcon({ size, stroke, glow, radius, tail }) {
  return (
    <BaseSVG size={size} stroke={stroke} glow={glow}>
      {({ stroke }) => (
        <>
          <rect
            x="10"
            y="15"
            width="80"
            height="55"
            rx={radius}
            stroke="url(#grad)"
            strokeWidth={stroke}
            filter="url(#glow)"
          />

          <path
            d={`M40 70 L50 ${70 + tail} L55 70`}
            stroke="url(#grad)"
            strokeWidth={stroke}
            filter="url(#glow)"
          />

          <path
            d="M50 55
               C50 55, 32 42, 32 32
               A9 9 0 0 1 50 32
               A9 9 0 0 1 68 32
               C68 42, 50 55, 50 55"
            stroke="url(#grad)"
            strokeWidth={stroke * 0.8}
            fill="none"
            filter="url(#glow)"
          />
        </>
      )}
    </BaseSVG>
  );
}

function CommentIcon({ size, stroke, glow, radius, tail }) {
  return (
    <BaseSVG size={size} stroke={stroke} glow={glow}>
      {({ stroke }) => (
        <>
          <rect
            x="10"
            y="15"
            width="80"
            height="55"
            rx={radius}
            stroke="url(#grad)"
            strokeWidth={stroke}
            filter="url(#glow)"
          />

          <path
            d={`M40 70 L50 ${70 + tail} L55 70`}
            stroke="url(#grad)"
            strokeWidth={stroke}
            filter="url(#glow)"
          />

          <line x1="25" y1="35" x2="65" y2="35" stroke="url(#grad)" strokeWidth={stroke} />
          <line x1="25" y1="45" x2="60" y2="45" stroke="url(#grad)" strokeWidth={stroke} />
        </>
      )}
    </BaseSVG>
  );
}

function SaveIcon({ size, stroke, glow }) {
  return (
    <BaseSVG size={size} stroke={stroke} glow={glow}>
      {({ stroke }) => (
        <path
          d="M30 15 H70 V75 L50 60 L30 75 Z"
          stroke="url(#grad)"
          strokeWidth={stroke}
          fill="none"
          filter="url(#glow)"
        />
      )}
    </BaseSVG>
  );
}

function ShareIcon({ size, stroke, glow }) {
  return (
    <BaseSVG size={size} stroke={stroke} glow={glow}>
      {({ stroke }) => (
        <path
          d="M30 60 C40 40, 60 40, 70 25 M70 25 L60 25 M70 25 L70 35"
          stroke="url(#grad)"
          strokeWidth={stroke}
          fill="none"
          filter="url(#glow)"
        />
      )}
    </BaseSVG>
  );
}

const styles = {
  container: {
    background: "#0a0a0a",
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
    flexDirection: "column"
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, 1fr)",
    gap: 20
  },
  preview: {
    border: "1px solid #222",
    borderRadius: 12,
    padding: 20,
    textAlign: "center"
  }
};