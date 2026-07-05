import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";

// ─── Pre-computed stable random arrays ───────────────────────────────────────
const STARS_BG = Array.from({ length: 55 }, (_, i) => ({
  id: i,
  x: Math.random() * 100,
  y: Math.random() * 70,
  size: Math.random() * 2.4 + 0.7,
  dur: 1.6 + Math.random() * 2.4,
  delay: Math.random() * 4,
}));

const RAIN = Array.from({ length: 22 }, (_, i) => ({
  id: i,
  x: Math.random() * 100,
  dur: 0.42 + Math.random() * 0.55,
  delay: Math.random() * 2.5,
}));

const CLOUDS_DATA = [
  { id: 0, x: 10, y: 14, w: 155, face: "😴", msg: "Professional reminder: drink water.", col: "#ede8ff" },
  { id: 1, x: 42, y: 8, w: 120, face: "🌸", msg: "You somehow make rainy days prettier.", col: "#ffe8f2" },
  { id: 2, x: 70, y: 18, w: 140, face: "😊", msg: "If I were a cat, I'd probably nap beside you.", col: "#e8f0ff" },
  { id: 3, x: 24, y: 38, w: 108, face: "🌙", msg: null, col: "#f0e8ff" },
  { id: 4, x: 58, y: 42, w: 128, face: "🌿", msg: "The world is genuinely better with you in it.", col: "#e8fff0" },
];

const KEEPSAKES = [
  { id: 0, icon: "🎬", label: "Movie ticket", story: "The one where you laughed so hard you cried. Row G, Seat 12. The absolute best night." },
  { id: 1, icon: "🌸", label: "Pressed flower", story: "From that walk where you stopped to photograph every single one." },
  { id: 2, icon: "☕", label: "Coffee receipt", story: "Two oat lattes, extra warm. Some afternoons deserve to last forever." },
  { id: 3, icon: "🎀", label: "Little ribbon", story: "Tied it in your hair. You forgot. It stayed all day and made you smile at 6pm." },
  { id: 4, icon: "🔖", label: "Bookmark", story: "Still on page 47. Some books are meant to live beside you, not be finished." },
  { id: 5, icon: "⭐", label: "Paper star", story: "Folded at 2am when sleep wouldn't come. Some ideas are worth losing sleep over." },
];

const GACHA_PRIZES = [
  "You are the main character. Act accordingly. 🌟",
  "Certified Excellent Person™",
  "Today's horoscope: You're going to be okay.",
  "🌸 Rare drop: The ability to make people feel seen.",
  "Alert: Your smile is a public service.",
  "According to my calculations... you are wonderful.",
  "Today's mission: rest. That's it. That's the mission.",
  "✨ You have unlocked: Being loved.",
  "Gentle reminder that you deserve nice things.",
  "Secret discovered: you've been wonderful this whole time.",
  "Loading warmth... found. Loading kindness... found. That's you.",
  "Breaking news: Local person is incredibly lovely.",
  "Fun fact: You make rooms feel warmer just by walking in.",
  "🐰 Bonus bunny sends you good luck today.",
  "The stars are rooting for you. Obviously.",
];

// SAYANI dot-matrix (3×5 grid per letter, letter_index × 4 offset)
const SAYANI_DOTS = (() => {
  const L = [
    [[1,0],[2,0],[0,1],[0,2],[1,2],[2,2],[2,3],[0,4],[1,4]],        // S
    [[1,0],[0,1],[2,1],[0,2],[1,2],[2,2],[0,3],[2,3],[0,4],[2,4]],   // A
    [[0,0],[2,0],[0,1],[2,1],[1,2],[1,3],[1,4]],                     // Y
    [[1,0],[0,1],[2,1],[0,2],[1,2],[2,2],[0,3],[2,3],[0,4],[2,4]],   // A
    [[0,0],[0,1],[0,2],[0,3],[0,4],[1,1],[2,0],[2,1],[2,2],[2,3],[2,4]], // N
    [[0,0],[1,0],[2,0],[1,1],[1,2],[1,3],[0,4],[1,4],[2,4]],         // I
  ];
  const dots: { col: number; row: number; li: number }[] = [];
  L.forEach((letter, li) =>
    letter.forEach(([c, r]) => dots.push({ col: c + li * 4, row: r, li }))
  );
  return dots;
})();

const DOT_COLORS = ["#f9c8e8", "#c8d8f9", "#f9f0c8", "#d8c8f9", "#c8f9e8", "#ffd700"];

// ─── Types ────────────────────────────────────────────────────────────────────
type Memory = {
  pettedCat: boolean;
  wateredFlowers: boolean;
  watchedButterflies: boolean;
  foundFeather: boolean;
};

// ─── Global CSS injected via <style> ─────────────────────────────────────────
const GCSS = `
  * { cursor: none !important; }

  @keyframes twinkle {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.2; transform: scale(0.5); }
  }
  @keyframes steam {
    0% { transform: translateY(0) scaleX(1); opacity: 0.55; }
    100% { transform: translateY(-30px) scaleX(2); opacity: 0; }
  }
  @keyframes rainFall {
    from { transform: translateY(-20px); }
    to   { transform: translateY(280px); }
  }
  @keyframes floatUp {
    0%, 100% { transform: translateY(0); }
    50%       { transform: translateY(-8px); }
  }
  @keyframes blink {
    0%, 100% { opacity: 1; } 50% { opacity: 0; }
  }
  @keyframes waxCrack {
    0%   { transform: scale(1) rotate(0deg); }
    45%  { transform: scale(1.2) rotate(5deg); }
    100% { transform: scale(0) rotate(20deg); opacity: 0; }
  }
  @keyframes featherDrift {
    0%, 100% { transform: rotate(-5deg) translateY(0); }
    50%       { transform: rotate(5deg) translateY(-6px); }
  }
  @keyframes bloomFlower {
    0%   { transform: scale(0) rotate(-120deg); opacity: 0; }
    65%  { transform: scale(1.25); }
    100% { transform: scale(1) rotate(0); opacity: 1; }
  }
  @keyframes polarDev {
    0%   { filter: brightness(0) sepia(1); }
    55%  { filter: brightness(0.6) sepia(0.5); }
    100% { filter: brightness(1) sepia(0); }
  }
  @keyframes catTail {
    0%, 100% { transform-origin: bottom center; transform: rotate(0deg); }
    30%       { transform: rotate(12deg); }
    70%       { transform: rotate(-12deg); }
  }
  @keyframes glowPulse {
    0%, 100% { opacity: 0.13; } 50% { opacity: 0.28; }
  }
  @keyframes capFall {
    0%   { transform: translateY(-220px) rotate(-5deg); }
    68%  { transform: translateY(12px); }
    84%  { transform: translateY(-6px); }
    100% { transform: translateY(0); }
  }
  @keyframes sparkFade {
    from { transform: scale(0) rotate(0deg); opacity: 1; }
    to   { transform: scale(1.6) rotate(90deg); opacity: 0; }
  }
  @keyframes birdHop {
    0%   { transform: translateX(0) translateY(0); opacity: 1; }
    25%  { transform: translateX(20px) translateY(-12px); }
    50%  { transform: translateX(40px) translateY(0); }
    75%  { transform: translateX(60px) translateY(-12px); }
    100% { transform: translateX(300px) translateY(-120px); opacity: 0; }
  }
  @keyframes handleTurn {
    from { transform: rotate(0deg); }
    to   { transform: rotate(360deg); }
  }
  @keyframes springGrow {
    from { transform: scaleY(0); transform-origin: bottom center; }
    to   { transform: scaleY(1); transform-origin: bottom center; }
  }

  .nb-lines {
    background-color: #fefdf8;
    background-image:
      repeating-linear-gradient(transparent, transparent 27px, rgba(163,174,216,.3) 27px, rgba(163,174,216,.3) 28px),
      linear-gradient(90deg, transparent 38px, rgba(220,120,120,.28) 38px, rgba(220,120,120,.28) 39px, transparent 39px);
  }
  .paper {
    background-color: #fdf8ef;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='.055'/%3E%3C/svg%3E");
  }
  .washi {
    background: repeating-linear-gradient(
      45deg,
      rgba(255,182,193,.55), rgba(255,182,193,.55) 4px,
      rgba(255,220,232,.55) 4px, rgba(255,220,232,.55) 8px
    );
  }
`;

// ─── Typewriter hook ──────────────────────────────────────────────────────────
function useTW(text: string, speed = 65, delay = 0, active = true) {
  const [shown, setShown] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!active) { setShown(""); setDone(false); return; }
    setShown(""); setDone(false);
    let i = 0;
    const pre = setTimeout(() => {
      const t = setInterval(() => {
        i++;
        setShown(text.slice(0, i));
        if (i >= text.length) { clearInterval(t); setDone(true); }
      }, speed);
      return () => clearInterval(t);
    }, delay);
    return () => clearTimeout(pre);
  }, [text, active]); // eslint-disable-line

  return { shown, done };
}

// ─── Cursor ───────────────────────────────────────────────────────────────────
const SPARK_COLORS = ["#f9c8e8", "#c8d8f9", "#f9f0c8", "#d8c8f9", "#c8f9e8", "#ffd700"];
type Spark = { id: number; x: number; y: number; c: string; s: number };

function Cursor() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [sparks, setSparks] = useState<Spark[]>([]);
  const sid = useRef(0);
  const lt = useRef(0);

  useEffect(() => {
    let mouseX = -200;
    let mouseY = -200;
    let currentX = -200;
    let currentY = -200;

    const h = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      if (Date.now() - lt.current < 75) return;
      lt.current = Date.now();
      const id = sid.current++;
      setSparks(s => [...s.slice(-13), {
        id,
        x: e.clientX + (Math.random() - .5) * 18,
        y: e.clientY + (Math.random() - .5) * 18,
        c: SPARK_COLORS[Math.floor(Math.random() * SPARK_COLORS.length)],
        s: Math.random() * 7 + 3,
      }]);
      setTimeout(() => setSparks(s => s.filter(sp => sp.id !== id)), 650);
    };

    window.addEventListener("mousemove", h);

    let rafId: number;
    const updateCursor = () => {
      if (containerRef.current) {
        containerRef.current.style.transform = `translate3d(${mouseX - 11}px, ${mouseY - 10}px, 0)`;
      }
      rafId = requestAnimationFrame(updateCursor);
    };
    rafId = requestAnimationFrame(updateCursor);

    return () => {
      window.removeEventListener("mousemove", h);
      cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 9999 }}>
      <div 
        ref={containerRef} 
        style={{ 
          position: "absolute", 
          left: 0, 
          top: 0, 
          willChange: "transform",
          transform: "translate3d(-200px, -200px, 0)" 
        }}
      >
        <svg width="22" height="20" viewBox="0 0 22 20">
          <ellipse cx="6" cy="8" rx="6" ry="4.5" fill="#f9c8e8" opacity=".9" transform="rotate(-20 6 8)" />
          <ellipse cx="6" cy="13" rx="4.5" ry="3" fill="#e8a8cc" opacity=".8" transform="rotate(-20 6 13)" />
          <ellipse cx="16" cy="8" rx="6" ry="4.5" fill="#c8d8f9" opacity=".9" transform="rotate(20 16 8)" />
          <ellipse cx="16" cy="13" rx="4.5" ry="3" fill="#a8c4e8" opacity=".8" transform="rotate(20 16 13)" />
          <ellipse cx="11" cy="10" rx="1.3" ry="5" fill="#4a2840" />
          <line x1="10" y1="5" x2="7" y2="0.5" stroke="#4a2840" strokeWidth=".8" />
          <line x1="12" y1="5" x2="15" y2="0.5" stroke="#4a2840" strokeWidth=".8" />
          <circle cx="7" cy=".5" r="1.3" fill="#f9c8e8" />
          <circle cx="15" cy=".5" r="1.3" fill="#c8d8f9" />
        </svg>
      </div>
      {sparks.map(sp => (
        <div key={sp.id} style={{ position: "absolute", left: sp.x - sp.s / 2, top: sp.y - sp.s / 2, width: sp.s, height: sp.s, animation: "sparkFade .65s ease-out forwards" }}>
          <svg width={sp.s} height={sp.s} viewBox="0 0 10 10">
            <path d="M5 0L5.4 4.6L10 5L5.4 5.4L5 10L4.6 5.4L0 5L4.6 4.6Z" fill={sp.c} />
          </svg>
        </div>
      ))}
    </div>
  );
}

// ─── Shared: Chapter label ────────────────────────────────────────────────────
function ChLabel({ text, light = false }: { text: string; light?: boolean }) {
  return (
    <div style={{
      position: "absolute", top: 22, left: 0, right: 0, textAlign: "center",
      fontFamily: "'Cormorant Garamond', serif", fontSize: 12,
      color: light ? "rgba(220,200,180,.45)" : "rgba(70,50,30,.4)",
      letterSpacing: 6, textTransform: "uppercase",
    }}>
      {text}
    </div>
  );
}

// ─── Shared: "Turn the page" tab ─────────────────────────────────────────────
function PageTab({ onClick, label = "Turn the page →", pos = "right" }: {
  onClick: () => void; label?: string; pos?: "right" | "center"
}) {
  return (
    <motion.button
      initial={{ opacity: 0, x: pos === "right" ? 20 : 0, y: pos === "center" ? 10 : 0 }}
      animate={{ opacity: 1, x: 0, y: 0 }}
      transition={{ delay: .3 }}
      onClick={onClick}
      style={{
        background: "#f9c8d0", border: "none",
        padding: pos === "center" ? "10px 22px" : "9px 14px 9px 11px",
        borderRadius: pos === "center" ? 24 : "0 8px 8px 0",
        fontFamily: "'Caveat', cursive", fontSize: 15, color: "#7a3a50",
        cursor: "pointer", boxShadow: "2px 3px 14px rgba(0,0,0,.2)", whiteSpace: "nowrap",
      }}>
      {label}
    </motion.button>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
//  CHAPTER 1 · The Notebook
// ═════════════════════════════════════════════════════════════════════════════
function Ch1({ onNext }: { onNext: () => void }) {
  const [opened, setOpened] = useState(false);
  const [phase, setPhase] = useState(0); // 0 nothing, 1 line1, 2 line2, 3 tab

  const l1 = useTW("Hi Sayani.", 78, 0, phase >= 1);
  const l2 = useTW("I borrowed you from the world for a little while.", 60, 0, phase >= 2);

  useEffect(() => { if (opened) { const t = setTimeout(() => setPhase(1), 700); return () => clearTimeout(t); } }, [opened]);
  useEffect(() => { if (phase === 1 && l1.done) { const t = setTimeout(() => setPhase(2), 900); return () => clearTimeout(t); } }, [phase, l1.done]);
  useEffect(() => { if (phase === 2 && l2.done) { const t = setTimeout(() => setPhase(3), 1100); return () => clearTimeout(t); } }, [phase, l2.done]);

  return (
    <div style={{
      width: "100vw", height: "100vh",
      background: "linear-gradient(180deg, #060e1c 0%, #0a1628 55%, #0d2035 100%)",
      position: "relative", overflow: "hidden", fontFamily: "'Caveat', cursive",
    }}>
      {/* Stars */}
      {STARS_BG.map(s => (
        <div key={s.id} style={{
          position: "absolute", left: `${s.x}%`, top: `${s.y}%`,
          width: s.size, height: s.size, borderRadius: "50%", background: "white",
          opacity: .3 + Math.random() * .7,
          animation: `twinkle ${s.dur}s ease-in-out infinite`, animationDelay: `${s.delay}s`,
        }} />
      ))}

      {/* Moon */}
      <div style={{ position: "absolute", top: "7%", left: "20%" }}>
        <svg width="52" height="52" viewBox="0 0 52 52">
          <circle cx="26" cy="26" r="22" fill="#fff8d0" opacity=".92" />
          <circle cx="35" cy="18" r="18" fill="#0a1628" />
        </svg>
      </div>

      {/* Rainy window */}
      <div style={{
        position: "absolute", right: "8%", top: "6%",
        width: 168, height: 212, background: "rgba(18,38,78,.5)",
        border: "11px solid #5c3d1e", borderRadius: 3, overflow: "hidden",
        boxShadow: "inset 0 0 20px rgba(0,0,0,.4), 0 0 30px rgba(80,120,200,.1)",
      }}>
        <div style={{ position: "absolute", left: "50%", top: 0, bottom: 0, width: 8, background: "#5c3d1e", transform: "translateX(-50%)" }} />
        <div style={{ position: "absolute", top: "48%", left: 0, right: 0, height: 8, background: "#5c3d1e", transform: "translateY(-50%)" }} />
        {RAIN.map(d => (
          <div key={d.id} style={{
            position: "absolute", left: `${d.x}%`, top: -16,
            width: 1, height: 13, background: "rgba(180,210,255,.4)",
            animation: `rainFall ${d.dur}s linear infinite`, animationDelay: `${d.delay}s`,
          }} />
        ))}
      </div>

      {/* Lamp */}
      <div style={{ position: "absolute", left: "10%", top: "18%" }}>
        <svg width="68" height="134" viewBox="0 0 68 134">
          <path d="M20 47L9 79L59 79L48 47Z" fill="#c8a060" />
          <ellipse cx="34" cy="78" rx="28" ry="7" fill="rgba(255,200,80,.18)" />
          <rect x="30" y="79" width="8" height="44" fill="#8b5e2a" />
          <rect x="18" y="121" width="32" height="10" rx="4" fill="#8b5e2a" />
        </svg>
        <div style={{
          position: "absolute", top: 30, left: -90, width: 240, height: 240,
          borderRadius: "50%", background: "radial-gradient(circle, rgba(255,200,80,.11) 0%, transparent 70%)",
          pointerEvents: "none", animation: "glowPulse 3.5s ease-in-out infinite",
        }} />
      </div>

      {/* Mug */}
      <div style={{ position: "absolute", left: "26%", bottom: "35%" }}>
        <svg width="54" height="60" viewBox="0 0 54 60">
          <path d="M8 20L8 47Q8 53 15 53L37 53Q44 53 44 47L44 20Z" fill="#d4856a" />
          <path d="M44 27Q58 27 58 35Q58 43 44 43" stroke="#b86a50" strokeWidth="4.5" fill="none" />
          <rect x="6" y="17" width="40" height="5" rx="2.5" fill="#c07050" />
          {[0, .7, 1.4].map((d, i) => (
            <path key={i} d={`M${16 + i * 7} 16Q${18 + i * 7} 9 ${16 + i * 7} 2`}
              stroke="rgba(255,255,255,.5)" strokeWidth="1.5" fill="none"
              style={{ animation: `steam 2s ease-out infinite`, animationDelay: `${d}s` }} />
          ))}
        </svg>
      </div>

      {/* Plant */}
      <div style={{ position: "absolute", right: "5%", bottom: "35%" }}>
        <svg width="66" height="92" viewBox="0 0 66 92">
          <rect x="23" y="59" width="20" height="33" rx="3" fill="#7a5c2a" />
          <ellipse cx="23" cy="46" rx="14" ry="8" fill="#4a8a40" transform="rotate(-25 23 46)" />
          <ellipse cx="43" cy="46" rx="13" ry="7" fill="#5aa050" transform="rotate(25 43 46)" />
          <ellipse cx="33" cy="38" rx="13" ry="10" fill="#4a8a40" />
          <ellipse cx="20" cy="32" rx="10" ry="6" fill="#5aa050" transform="rotate(-30 20 32)" />
          <path d="M33 70L33 30" stroke="#3a6a30" strokeWidth="2" />
        </svg>
      </div>

      {/* Desk surface */}
      <div style={{
        position: "absolute", bottom: 0, left: 0, right: 0, height: "36%",
        background: "linear-gradient(180deg, #4a2e0a 0%, #3a2008 100%)",
        boxShadow: "0 -6px 30px rgba(0,0,0,.6)",
      }} />

      {/* THE NOTEBOOK */}
      <div style={{ position: "absolute", left: "50%", bottom: "27%", transform: "translateX(-50%)", perspective: 900 }}>
        {!opened ? (
          <motion.div
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
            onClick={() => setOpened(true)}
            style={{ cursor: "pointer" }}>
            <div style={{
              width: 178, height: 238,
              background: "linear-gradient(140deg, #7a3a50 0%, #9a4a65 100%)",
              borderRadius: "3px 12px 12px 3px",
              boxShadow: "5px 6px 28px rgba(0,0,0,.65), inset -2px 0 8px rgba(0,0,0,.3)",
              position: "relative", display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center",
            }}>
              <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 18, background: "linear-gradient(90deg, #5a2a3a, #7a3a50)", borderRadius: "3px 0 0 3px" }} />
              {/* Pressed flower */}
              <div style={{ position: "absolute", top: 28, right: 26 }}>
                <svg width="40" height="40" viewBox="0 0 40 40">
                  {[0, 60, 120, 180, 240, 300].map((a, i) => (
                    <ellipse key={i} cx="20" cy="10" rx="5.5" ry="9.5"
                      fill={["#f9c8d0","#f0d0c8","#f9d8c0","#e8c8d8","#f0c0d0","#f8d0e0"][i]}
                      opacity=".83" transform={`rotate(${a} 20 20)`} />
                  ))}
                  <circle cx="20" cy="20" r="5.5" fill="#f9e880" />
                </svg>
              </div>
              <div style={{ fontFamily: "'Caveat', cursive", fontSize: 36, color: "#f9e8d0", transform: "rotate(-4deg)", marginLeft: 14, textShadow: "1px 1px 5px rgba(0,0,0,.35)", letterSpacing: 2 }}>
                Sayani
              </div>
              <div style={{ fontFamily: "'Caveat', cursive", fontSize: 13, color: "rgba(249,232,200,.5)", marginTop: 10, marginLeft: 14, transform: "rotate(-2deg)" }}>
                click to open ✦
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ rotateY: -90, opacity: 0 }}
            animate={{ rotateY: 0, opacity: 1 }}
            transition={{ duration: .65, ease: "easeOut" }}
            style={{ width: 344, height: 422, display: "flex", borderRadius: 4, boxShadow: "0 12px 55px rgba(0,0,0,.72)" }}>
            {/* Cover */}
            <div style={{ width: "44%", height: "100%", background: "linear-gradient(140deg, #7a3a50, #9a4a65)", borderRadius: "3px 0 0 3px", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <div style={{ color: "#f9e8d0", fontFamily: "'Caveat', cursive", fontSize: 28, transform: "rotate(-5deg)" }}>Sayani</div>
            </div>
            {/* Page */}
            <div className="nb-lines" style={{ width: "56%", height: "100%", borderRadius: "0 4px 4px 0", padding: "30px 18px 18px 30px", display: "flex", flexDirection: "column", gap: 16, position: "relative" }}>
              {phase >= 1 && (
                <div style={{ fontFamily: "'Caveat', cursive", fontSize: 24, color: "#2c1810", lineHeight: 1.4 }}>
                  {l1.shown}
                  {phase === 1 && !l1.done && <span style={{ borderRight: "2px solid #2c1810", marginLeft: 1, animation: "blink .7s step-end infinite" }} />}
                </div>
              )}
              {phase >= 2 && (
                <div style={{ fontFamily: "'Caveat', cursive", fontSize: 17, color: "#3d2010", lineHeight: 1.7, maxWidth: 156 }}>
                  {l2.shown}
                  {phase === 2 && !l2.done && <span style={{ borderRight: "2px solid #3d2010", marginLeft: 1, animation: "blink .7s step-end infinite" }} />}
                </div>
              )}
              {phase >= 3 && (
                <div style={{ position: "absolute", bottom: 18, right: -46 }}>
                  <PageTab onClick={onNext} />
                </div>
              )}
            </div>
          </motion.div>
        )}
      </div>

      <ChLabel text="A Little Corner of the Universe" light />
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
//  CHAPTER 2 · The Letter
// ═════════════════════════════════════════════════════════════════════════════
function Ch2({ onNext, setMemory }: { onNext: () => void; setMemory: React.Dispatch<React.SetStateAction<Memory>> }) {
  const [step, setStep] = useState<"sealed" | "cracking" | "open" | "bird" | "feather">("sealed");
  const [showNext, setShowNext] = useState(false);

  const l1 = useTW("Sayani,", 80, 0, step === "open");
  const l2 = useTW("There are people who make rooms feel warmer just by walking into them.", 50, 0, step === "open" && l1.done);
  const l3 = useTW("You are one of those people.", 55, 0, step === "open" && l2.done);
  const l4 = useTW("Don't let today tell you otherwise.", 55, 0, step === "open" && l3.done);

  useEffect(() => {
    if (step === "open" && l4.done) { const t = setTimeout(() => setStep("bird"), 1200); return () => clearTimeout(t); }
  }, [step, l4.done]);
  useEffect(() => {
    if (step === "bird") {
      const t = setTimeout(() => { setStep("feather"); setMemory(m => ({ ...m, foundFeather: true })); setTimeout(() => setShowNext(true), 1000); }, 2600);
      return () => clearTimeout(t);
    }
  }, [step, setMemory]);

  const crack = () => { if (step !== "sealed") return; setStep("cracking"); setTimeout(() => setStep("open"), 650); };

  return (
    <div style={{
      width: "100vw", height: "100vh",
      background: "linear-gradient(180deg, #0f1540 0%, #1a205a 50%, #1e2868 100%)",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "'Caveat', cursive", position: "relative", overflow: "hidden",
    }}>
      {STARS_BG.slice(0, 32).map(s => (
        <div key={s.id} style={{ position: "absolute", left: `${s.x}%`, top: `${s.y}%`, width: s.size * .8, height: s.size * .8, borderRadius: "50%", background: "white", opacity: .12 + .2 * Math.random(), animation: `twinkle ${s.dur}s ease-in-out infinite`, animationDelay: `${s.delay}s` }} />
      ))}

      {step === "sealed" || step === "cracking" ? (
        <motion.div initial={{ scale: .9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: .6 }}
          style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 28 }}>
          {/* Envelope */}
          <div className="paper" style={{ width: 268, height: 200, borderRadius: 4, boxShadow: "0 8px 40px rgba(0,0,0,.5)", display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
            <div style={{ position: "absolute", top: "50%", left: 0, right: 0, height: 1, background: "rgba(61,43,31,.14)" }} />
            <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, color: "rgba(61,43,31,.38)", letterSpacing: 3, fontStyle: "italic" }}>for Sayani</div>
          </div>
          {/* Wax seal */}
          <div onClick={crack} style={{
            width: 72, height: 72, borderRadius: "50%",
            background: "radial-gradient(circle at 35% 35%, #d44040, #8b2020)",
            boxShadow: "0 4px 16px rgba(180,30,30,.5)",
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", fontSize: 24,
            animation: step === "cracking" ? "waxCrack .6s ease-out forwards" : undefined,
          }}>✦</div>
          <div style={{ color: "rgba(200,180,240,.55)", fontSize: 14 }}>click the seal to open</div>
        </motion.div>
      ) : (
        <motion.div
          initial={{ clipPath: "inset(50% 0 50% 0)", opacity: 0 }}
          animate={{ clipPath: "inset(0% 0 0% 0)", opacity: 1 }}
          transition={{ duration: .7, ease: "easeOut" }}
          className="paper"
          style={{ width: 420, maxWidth: "90vw", borderRadius: 6, boxShadow: "0 12px 55px rgba(0,0,0,.55)", padding: "48px 44px 40px", display: "flex", flexDirection: "column", gap: 18, position: "relative" }}>
          <div className="washi" style={{ position: "absolute", top: -11, left: "30%", width: 82, height: 22, transform: "rotate(-2deg)", borderRadius: 2 }} />
          <div style={{ fontFamily: "'Caveat', cursive", fontSize: 22, color: "#2c1810" }}>
            {l1.shown}{step === "open" && !l1.done && <span style={{ borderRight: "2px solid #2c1810", animation: "blink .7s step-end infinite" }} />}
          </div>
          {l1.done && <div style={{ fontFamily: "'Caveat', cursive", fontSize: 17, color: "#3d2010", lineHeight: 1.75 }}>
            {l2.shown}{step === "open" && !l2.done && <span style={{ borderRight: "2px solid #3d2010", animation: "blink .7s step-end infinite" }} />}
          </div>}
          {l2.done && <div style={{ fontFamily: "'Caveat', cursive", fontSize: 17, color: "#3d2010", lineHeight: 1.75 }}>
            {l3.shown}{step === "open" && !l3.done && <span style={{ borderRight: "2px solid #3d2010", animation: "blink .7s step-end infinite" }} />}
          </div>}
          {l3.done && <div style={{ fontFamily: "'Caveat', cursive", fontSize: 17, color: "#3d2010", lineHeight: 1.75 }}>
            {l4.shown}{step === "open" && !l4.done && <span style={{ borderRight: "2px solid #3d2010", animation: "blink .7s step-end infinite" }} />}
          </div>}
          {(step === "bird" || step === "feather") && (
            <div style={{ position: "absolute", bottom: 70, right: 30, fontSize: 26, animation: step === "bird" ? "birdHop 2.4s ease-in-out forwards" : undefined }}>🐦</div>
          )}
          {step === "feather" && (
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
              style={{ position: "absolute", bottom: 22, right: 34, fontSize: 28, animation: "featherDrift 3s ease-in-out infinite" }}>🪶</motion.div>
          )}
          {showNext && <div style={{ position: "absolute", bottom: 18, right: -46 }}><PageTab onClick={onNext} /></div>}
        </motion.div>
      )}
      <ChLabel text="Chapter II · The Letter" light />
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
//  CHAPTER 3 · Dream Cloud Garden
// ═════════════════════════════════════════════════════════════════════════════
type BtEl = { id: number; x: number; y: number; bx: number; by: number };

function Ch3({ onNext, setMemory }: { onNext: () => void; setMemory: React.Dispatch<React.SetStateAction<Memory>> }) {
  const [burst, setBurst] = useState<Set<number>>(new Set());
  const [msg, setMsg] = useState<string | null>(null);
  const [bts, setBts] = useState<BtEl[]>([]);
  const [showNext, setShowNext] = useState(false);
  const bid = useRef(0);

  const burstCloud = (c: typeof CLOUDS_DATA[0]) => {
    if (burst.has(c.id)) return;
    const next = new Set(burst).add(c.id);
    setBurst(next);
    if (c.msg) setMsg(c.msg);
    setMemory(m => ({ ...m, watchedButterflies: true }));
    const newBts: BtEl[] = Array.from({ length: 8 }, () => ({
      id: bid.current++,
      x: c.x + Math.random() * 15,
      y: c.y + Math.random() * 8,
      bx: (Math.random() - .5) * 220,
      by: -(70 + Math.random() * 120),
    }));
    setBts(bs => [...bs, ...newBts]);
    setTimeout(() => setBts(bs => bs.filter(b => !newBts.some(n => n.id === b.id))), 1500);
    if (next.size >= 3) setTimeout(() => setShowNext(true), 1000);
  };

  return (
    <div style={{
      width: "100vw", height: "100vh",
      background: "linear-gradient(180deg, #9b8fcc 0%, #b8a8e0 35%, #d0bce8 65%, #e8d5f5 100%)",
      position: "relative", overflow: "hidden", fontFamily: "'Caveat', cursive",
    }}>
      {/* Meadow */}
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "30%", background: "linear-gradient(180deg, #5a8060 0%, #4a6a50 100%)", clipPath: "ellipse(60% 38% at 50% 100%)" }} />
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "22%", background: "#4a6a50" }} />
      {/* Meadow flowers */}
      {["🌸","🌼","🌺","🌻","🌸","🌼","🌺","🌻","🌸","🌼","🌺","🌻"].map((f, i) => (
        <div key={i} style={{ position: "absolute", bottom: `${6 + Math.random() * 10}%`, left: `${4 + i * 8}%`, fontSize: "17px" }}>{f}</div>
      ))}

      {/* Clouds */}
      {CLOUDS_DATA.map(c => (
        <motion.div key={c.id}
          animate={burst.has(c.id) ? { scale: 0, opacity: 0 } : { y: [0, -7, 0] }}
          transition={burst.has(c.id) ? { duration: .35 } : { duration: 3 + c.id * .5, repeat: Infinity, ease: "easeInOut", delay: c.id * .4 }}
          onClick={() => burstCloud(c)}
          style={{
            position: "absolute", left: `${c.x}%`, top: `${c.y}%`,
            width: c.w, height: c.w * .52,
            background: c.col, borderRadius: 50,
            cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 4px 22px rgba(140,110,200,.22)",
            userSelect: "none",
          }}>
          <span style={{ fontSize: 30 }}>{c.face}</span>
        </motion.div>
      ))}

      {/* Flying butterflies */}
      {bts.map(b => (
        <motion.div key={b.id}
          initial={{ x: `${b.x}vw`, y: `${b.y}vh`, opacity: 1, rotate: 0 }}
          animate={{ x: `calc(${b.x}vw + ${b.bx}px)`, y: `calc(${b.y}vh + ${b.by}px)`, opacity: 0, rotate: 540 }}
          transition={{ duration: 1.4, ease: "easeOut" }}
          style={{ position: "absolute", top: 0, left: 0, fontSize: 18, pointerEvents: "none" }}>
          🦋
        </motion.div>
      ))}

      {/* Compliment */}
      <AnimatePresence>
        {msg && (
          <motion.div key={msg}
            initial={{ opacity: 0, y: 18, scale: .9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className="paper"
            style={{ position: "absolute", bottom: "30%", left: "50%", transform: "translateX(-50%)", padding: "16px 28px", borderRadius: 14, boxShadow: "0 4px 24px rgba(0,0,0,.14)", fontFamily: "'Caveat', cursive", fontSize: 20, color: "#4a2860", textAlign: "center", maxWidth: "78vw" }}>
            {msg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Dot progress */}
      <div style={{ position: "absolute", bottom: "17%", left: "50%", transform: "translateX(-50%)", display: "flex", gap: 10 }}>
        {CLOUDS_DATA.map(c => (
          <div key={c.id} style={{ width: 8, height: 8, borderRadius: "50%", background: burst.has(c.id) ? "#9b7fa6" : "rgba(90,60,130,.28)", transition: "background .4s" }} />
        ))}
      </div>

      {showNext && (
        <div style={{ position: "absolute", bottom: "8%", left: "50%", transform: "translateX(-50%)" }}>
          <PageTab onClick={onNext} label="Step into the room →" pos="center" />
        </div>
      )}
      <ChLabel text="Chapter III · Dream Cloud Garden" />
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
//  CHAPTER 4 · Sayani's Little Room
// ═════════════════════════════════════════════════════════════════════════════
const POLARS = [
  { id: 0, x: 14, y: 12, rot: -6, caption: "that afternoon that lasted forever", shade: "#fce8f0" },
  { id: 1, x: 43, y: 7, rot: 3, caption: "the café with the wobbly chair", shade: "#f0e8fc" },
  { id: 2, x: 68, y: 14, rot: -4, caption: "when you laughed and forgot to be sad", shade: "#e8f0fc" },
];

function Ch4({ onNext, memory, setMemory }: { onNext: () => void; memory: Memory; setMemory: React.Dispatch<React.SetStateAction<Memory>> }) {
  const [developed, setDeveloped] = useState<Set<number>>(new Set());
  const [catPurring, setCatPurring] = useState(false);
  const [watered, setWatered] = useState(false);
  const [showNext, setShowNext] = useState(false);

  const devPolaroid = (id: number) => {
    const next = new Set(developed).add(id);
    setDeveloped(next);
    if (next.size >= 2) setTimeout(() => setShowNext(true), 600);
  };

  const petCat = () => {
    setCatPurring(true);
    setMemory(m => ({ ...m, pettedCat: true }));
    setTimeout(() => setCatPurring(false), 2200);
  };

  const waterPlant = () => { setWatered(true); setMemory(m => ({ ...m, wateredFlowers: true })); };

  return (
    <div style={{
      width: "100vw", height: "100vh",
      background: "linear-gradient(180deg, #f5d0e0 0%, #fce4ee 50%, #fff0f5 100%)",
      position: "relative", overflow: "hidden", fontFamily: "'Caveat', cursive",
    }}>
      {/* Walls */}
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "40%", background: "linear-gradient(180deg, #e8c4b8 0%, #d4b0a0 100%)" }} />
      {/* Floor */}
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "18%", background: "linear-gradient(180deg, #c4956a 0%, #b07850 100%)" }} />

      {/* Window */}
      <div style={{ position: "absolute", left: "7%", top: "7%", width: 132, height: 162, border: "10px solid #c4907a", borderRadius: 3, background: "linear-gradient(180deg, #c8e4f8, #a8d0f0)", overflow: "hidden" }}>
        <div style={{ position: "absolute", left: "50%", top: 0, bottom: 0, width: 8, background: "#c4907a", transform: "translateX(-50%)" }} />
        <div style={{ position: "absolute", top: "45%", left: 0, right: 0, height: 8, background: "#c4907a" }} />
        {RAIN.slice(0, 12).map(d => (
          <div key={d.id} style={{ position: "absolute", left: `${d.x}%`, top: -10, width: 1, height: 10, background: "rgba(180,210,255,.5)", animation: `rainFall ${d.dur}s linear infinite`, animationDelay: `${d.delay}s` }} />
        ))}
      </div>

      {/* String lights */}
      <div style={{ position: "absolute", top: "4%", left: "4%", right: "4%", height: 26 }}>
        {Array.from({ length: 16 }, (_, i) => (
          <div key={i} style={{ position: "absolute", left: `${i * 6.5}%` }}>
            <div style={{ width: 2, height: 14 + Math.sin(i) * 4, background: "#9a7060", margin: "0 auto" }} />
            <div style={{ width: 10, height: 14, borderRadius: "0 0 6px 6px", background: ["#f9c8a0","#c8f9d8","#f9c8f0","#c8d8f9","#f9f0c8"][i % 5], boxShadow: `0 0 8px ${["rgba(249,200,160,.8)","rgba(200,249,216,.8)","rgba(249,200,240,.8)","rgba(200,216,249,.8)","rgba(249,240,200,.8)"][i % 5]}` }} />
          </div>
        ))}
      </div>

      {/* Bookshelf */}
      <div style={{ position: "absolute", right: "5%", top: "14%", width: 88, height: 135 }}>
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 10, background: "#9a6040", borderRadius: "0 0 3px 3px" }} />
        {["#d08060","#8070c0","#60a080","#c07060","#708090"].map((c, i) => (
          <div key={i} style={{ position: "absolute", bottom: 10, left: i * 16 + 2, width: 14, height: 38 + i * 6, background: c, borderRadius: "3px 3px 0 0", boxShadow: "inset -2px 0 4px rgba(0,0,0,.14)" }} />
        ))}
      </div>

      {/* Polaroids */}
      {POLARS.map(p => (
        <div key={p.id} style={{ position: "absolute", left: `${p.x}%`, top: `${p.y + 8}%` }}>
          <div style={{ width: 2, height: 22, background: "#9a7060", margin: "0 auto" }} />
          <div className="washi" style={{ width: 32, height: 13, margin: "0 auto -5px", transform: `rotate(${p.rot * .5}deg)`, borderRadius: 2, position: "relative", zIndex: 1 }} />
          <div onClick={() => devPolaroid(p.id)} style={{
            width: 112, height: 132,
            background: developed.has(p.id) ? p.shade : "#d4c8c0",
            transform: `rotate(${p.rot}deg)`,
            boxShadow: "3px 4px 18px rgba(0,0,0,.25)",
            cursor: "pointer", borderRadius: 2,
            display: "flex", flexDirection: "column", alignItems: "center", padding: "10px 10px 20px",
            animation: developed.has(p.id) ? "polarDev 1.5s ease-out forwards" : undefined,
          }}>
            <div style={{ width: "100%", flex: 1, background: developed.has(p.id) ? "rgba(0,0,0,.06)" : "#b8aca8", borderRadius: 1, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28 }}>
              {developed.has(p.id) ? "📷" : ""}
            </div>
            {developed.has(p.id) && (
              <div style={{ fontFamily: "'Caveat', cursive", fontSize: 11, color: "#4a3028", marginTop: 6, textAlign: "center", lineHeight: 1.3 }}>{p.caption}</div>
            )}
          </div>
        </div>
      ))}

      {/* Plant (left) */}
      <div style={{ position: "absolute", left: "5%", bottom: "20%", cursor: "pointer" }} onClick={waterPlant}>
        <div style={{ fontSize: 13, color: "#6a4a30", textAlign: "center", marginBottom: 2 }}>{watered ? "🌿 happy!" : "🌱 water me?"}</div>
        <svg width="56" height="76" viewBox="0 0 56 76">
          <rect x="18" y="50" width="20" height="26" rx="3" fill="#9a7060" />
          {watered ? <>
            <ellipse cx="28" cy="30" rx="16" ry="10" fill="#5aa050" />
            <ellipse cx="15" cy="38" rx="12" ry="7" fill="#4a9040" transform="rotate(-25 15 38)" />
            <ellipse cx="40" cy="38" rx="12" ry="7" fill="#5aa050" transform="rotate(25 40 38)" />
            <ellipse cx="28" cy="20" rx="10" ry="8" fill="#60b055" />
          </> : <>
            <ellipse cx="28" cy="34" rx="12" ry="8" fill="#6a9060" />
            <ellipse cx="18" cy="40" rx="9" ry="5" fill="#5a8050" transform="rotate(-20 18 40)" />
          </>}
          <path d="M28 62L28 28" stroke="#3a6030" strokeWidth="2" />
        </svg>
      </div>

      {/* Cat */}
      <div onClick={petCat} style={{ position: "absolute", right: "11%", bottom: "19%", cursor: "pointer" }}>
        <div style={{ fontFamily: "'Caveat', cursive", fontSize: 12, color: "#7a5a4a", textAlign: "center", marginBottom: 2 }}>
          {catPurring ? "purrrr~ 💕" : memory.pettedCat ? "zzzz 💤" : "pet me?"}
        </div>
        <svg width="70" height="56" viewBox="0 0 70 56">
          <ellipse cx="35" cy="39" rx="26" ry="16" fill="#d4a880" />
          <circle cx="35" cy="21" r="16" fill="#d4a880" />
          <polygon points="22,9 18,1 28,11" fill="#d4a880" /><polygon points="22,9 20,4 27,10" fill="#f0b8a0" />
          <polygon points="48,9 52,1 42,11" fill="#d4a880" /><polygon points="48,9 50,4 43,10" fill="#f0b8a0" />
          <ellipse cx="29" cy="20" rx="3" ry="3.5" fill="#3a2010" />
          <ellipse cx="41" cy="20" rx="3" ry="3.5" fill="#3a2010" />
          <path d="M32 27Q35 30 38 27" stroke="#c08070" strokeWidth="1.5" fill="none" />
          <line x1="13" y1="22" x2="25" y2="23" stroke="#9a7060" strokeWidth=".8" />
          <line x1="13" y1="25" x2="25" y2="25" stroke="#9a7060" strokeWidth=".8" />
          <line x1="45" y1="23" x2="57" y2="22" stroke="#9a7060" strokeWidth=".8" />
          <line x1="45" y1="25" x2="57" y2="25" stroke="#9a7060" strokeWidth=".8" />
          <path d="M61 41Q75 36 69 51Q63 59 59 53" stroke="#d4a880" strokeWidth="7" fill="none" strokeLinecap="round"
            style={{ animation: catPurring ? "catTail 1s ease-in-out infinite" : undefined }} />
        </svg>
      </div>

      {/* Candle */}
      <div style={{ position: "absolute", right: "27%", bottom: "20%" }}>
        <svg width="22" height="46" viewBox="0 0 22 46">
          <rect x="7" y="20" width="8" height="26" rx="2" fill="#f0e8d0" />
          <rect x="9" y="18" width="4" height="4" fill="#e8d0b0" />
          <ellipse cx="11" cy="15" rx="3" ry="5" fill="#f9b040" opacity=".9" style={{ animation: "floatUp 1.5s ease-in-out infinite" }} />
        </svg>
      </div>

      {showNext && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ position: "absolute", bottom: "5%", right: "6%" }}>
          <PageTab onClick={onNext} label="Open the box →" />
        </motion.div>
      )}
      <ChLabel text="Chapter IV · Sayani's Little Room" />
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
//  CHAPTER 5 · The Keepsake Box
// ═════════════════════════════════════════════════════════════════════════════
function Ch5({ onNext }: { onNext: () => void }) {
  const [boxOpen, setBoxOpen] = useState(false);
  const [selected, setSelected] = useState<number | null>(null);
  const [opened, setOpened] = useState<Set<number>>(new Set());
  const [showNext, setShowNext] = useState(false);

  const pick = (id: number) => {
    setSelected(id);
    const next = new Set(opened).add(id);
    setOpened(next);
    if (next.size >= 4) setTimeout(() => setShowNext(true), 500);
  };

  return (
    <div style={{
      width: "100vw", height: "100vh",
      background: "linear-gradient(180deg, #fef5e4 0%, #fdf0d8 100%)",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      fontFamily: "'Caveat', cursive", position: "relative", overflow: "hidden",
    }}>
      {/* Table */}
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "38%", background: "linear-gradient(180deg, #c4935a 0%, #b07840 100%)", boxShadow: "0 -3px 14px rgba(0,0,0,.12)" }} />

      <motion.div animate={!boxOpen ? { y: [0, -5, 0] } : {}} transition={{ duration: 2.8, repeat: boxOpen ? 0 : Infinity, ease: "easeInOut" }}>
        {/* Lid */}
        <motion.div animate={boxOpen ? { rotateX: -130, y: -22 } : { rotateX: 0 }} transition={{ duration: .65 }}
          onClick={() => setBoxOpen(true)}
          style={{
            width: 320, height: 42,
            background: "linear-gradient(135deg, #8b5e2a 0%, #a06030 100%)",
            borderRadius: "6px 6px 0 0", boxShadow: "0 -3px 12px rgba(0,0,0,.2)",
            transformOrigin: "top center", cursor: boxOpen ? "default" : "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            position: "relative", zIndex: 2,
          }}>
          <span style={{ fontFamily: "'Caveat', cursive", fontSize: 14, color: "#f9e8d0", letterSpacing: 3 }}>{boxOpen ? "" : "click to open ✦"}</span>
          <div style={{ position: "absolute", bottom: -5, left: "50%", transform: "translateX(-50%)", width: 22, height: 10, background: "#c8a040", borderRadius: 3 }} />
        </motion.div>
        {/* Body */}
        <div style={{
          width: 320, height: 210,
          background: "linear-gradient(180deg, #7a5020 0%, #8b5e2a 100%)",
          borderRadius: "0 0 8px 8px", boxShadow: "0 8px 30px rgba(0,0,0,.3), inset 0 4px 12px rgba(0,0,0,.15)",
          padding: 18, display: "flex", flexWrap: "wrap", gap: 12,
          alignItems: "center", justifyContent: "center", overflow: "hidden",
        }}>
          {boxOpen ? KEEPSAKES.map((k, i) => (
            <motion.div key={k.id}
              initial={{ opacity: 0, scale: .4 }} animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * .1, duration: .4 }}
              onClick={() => pick(k.id)}
              style={{
                width: 72, height: 72,
                background: opened.has(k.id) ? "rgba(255,255,255,.28)" : "rgba(255,255,255,.12)",
                borderRadius: 8, cursor: "pointer",
                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4,
                border: `1.5px solid ${opened.has(k.id) ? "rgba(255,255,255,.35)" : "rgba(255,255,255,.15)"}`,
                transition: "all .3s",
              }}>
              <span style={{ fontSize: 26 }}>{k.icon}</span>
              <span style={{ fontSize: 10, color: "#f0d8b8", textAlign: "center", lineHeight: 1.2 }}>{k.label}</span>
            </motion.div>
          )) : <div style={{ color: "rgba(249,232,200,.32)", fontSize: 22 }}>✦ ✦ ✦</div>}
        </div>
      </motion.div>

      {/* Story popup */}
      <AnimatePresence>
        {selected !== null && (
          <motion.div key={selected}
            initial={{ opacity: 0, y: 20, scale: .9 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, scale: .92 }}
            className="paper"
            onClick={() => setSelected(null)}
            style={{ position: "absolute", top: "10%", left: "50%", transform: "translateX(-50%)", padding: "22px 30px", borderRadius: 12, boxShadow: "0 8px 32px rgba(0,0,0,.18)", maxWidth: 360, textAlign: "center", fontFamily: "'Caveat', cursive", fontSize: 19, color: "#3d2b1f", lineHeight: 1.65, cursor: "pointer" }}>
            <div style={{ fontSize: 30, marginBottom: 10 }}>{KEEPSAKES[selected].icon}</div>
            {KEEPSAKES[selected].story}
            <div style={{ marginTop: 10, fontSize: 12, color: "#9a7060" }}>tap to close</div>
          </motion.div>
        )}
      </AnimatePresence>

      {showNext && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ position: "absolute", bottom: "5%", right: "6%" }}>
          <PageTab onClick={onNext} label="To the gacha machine →" />
        </motion.div>
      )}
      <ChLabel text="Chapter V · The Keepsake Box" />
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
//  CHAPTER 6 · Gacha of Tiny Joy
// ═════════════════════════════════════════════════════════════════════════════
type ConfEl = { id: number; x: number; col: string; rot: number };

function Ch6({ onNext }: { onNext: () => void }) {
  const [state, setState] = useState<"idle" | "turning" | "dropping" | "open">("idle");
  const [prize, setPrize] = useState<string | null>(null);
  const [conf, setConf] = useState<ConfEl[]>([]);
  const [plays, setPlays] = useState(0);
  const cid = useRef(0);

  const turnHandle = () => {
    if (state !== "idle") return;
    setState("turning");
    setTimeout(() => {
      setState("dropping");
      setTimeout(() => {
        setState("open");
        setPrize(GACHA_PRIZES[Math.floor(Math.random() * GACHA_PRIZES.length)]);
        const newConf: ConfEl[] = Array.from({ length: 22 }, () => ({
          id: cid.current++, x: 22 + Math.random() * 56,
          col: SPARK_COLORS[Math.floor(Math.random() * SPARK_COLORS.length)],
          rot: (Math.random() - .5) * 360,
        }));
        setConf(newConf);
        setTimeout(() => setConf([]), 1300);
      }, 950);
    }, 900);
  };

  const reset = () => { setState("idle"); setPrize(null); setPlays(p => p + 1); };

  return (
    <div style={{
      width: "100vw", height: "100vh",
      background: "linear-gradient(180deg, #f7dfa8 0%, #f5d590 50%, #f0c870 100%)",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      fontFamily: "'Caveat', cursive", position: "relative", overflow: "hidden",
    }}>
      {["✦","✦","✦","✦","✦","✦","✦","✦"].map((s, i) => (
        <div key={i} style={{ position: "absolute", fontSize: 18, left: `${7 + i * 12}%`, top: `${12 + (i % 3) * 22}%`, opacity: .5, animation: `floatUp ${2 + i * .4}s ease-in-out infinite`, animationDelay: `${i * .3}s` }}>{s}</div>
      ))}

      {/* Machine */}
      <div style={{ position: "relative" }}>
        <div style={{ textAlign: "center", fontSize: 36, marginBottom: -6, animation: "floatUp 2.5s ease-in-out infinite" }}>🐰</div>
        <svg width="220" height="285" viewBox="0 0 220 285">
          {/* Globe */}
          <ellipse cx="110" cy="100" rx="76" ry="82" fill="rgba(255,255,255,.65)" stroke="#c8a040" strokeWidth="4" />
          {/* Body */}
          <rect x="34" y="168" width="152" height="92" rx="10" fill="#d48030" />
          <rect x="34" y="168" width="152" height="22" rx="5" fill="#c07020" />
          {/* Capsule chute */}
          <rect x="78" y="235" width="64" height="17" rx="7" fill="#8b5020" />
          {/* Handle base */}
          <rect x="170" y="192" width="30" height="12" rx="4" fill="#c87020" />
          {/* Handle arm */}
          <g transform="translate(185,198)" style={{ animation: state === "turning" ? "handleTurn .9s ease-in-out" : undefined, transformOrigin: "0 0" }}>
            <rect x="-4" y="-32" width="8" height="32" rx="3" fill="#e89030" />
            <circle cx="0" cy="-35" r="9" fill="#f0a040" />
          </g>
          {/* Capsules inside */}
          {[[90,80,"#f9c8e8"],[122,65,"#c8d8f9"],[100,112,"#f9f0c8"],[75,96,"#d8c8f9"],[138,102,"#c8f9e8"]].map(([x,y,f],i) => (
            <ellipse key={i} cx={x as number} cy={y as number} rx="14" ry="10" fill={f as string} opacity=".8" />
          ))}
          {/* Label */}
          <rect x="54" y="180" width="112" height="30" rx="4" fill="#f0e8d0" />
          <text x="110" y="200" textAnchor="middle" fontFamily="'Caveat',cursive" fontSize="14" fill="#8b5020">ガチャ ✦ Joy</text>
          {/* Coin slot */}
          <rect x="88" y="222" width="44" height="7" rx="3.5" fill="#8b5020" />
        </svg>

        {/* Falling capsule */}
        {state === "dropping" && (
          <div style={{ position: "absolute", left: "50%", top: "62%", transform: "translateX(-50%)", fontSize: 32, animation: "capFall .95s ease-out forwards" }}>💊</div>
        )}

        {/* Confetti */}
        {conf.map(c => (
          <motion.div key={c.id}
            initial={{ y: 0, rotate: 0, opacity: 1 }}
            animate={{ y: 170, rotate: c.rot, opacity: 0 }}
            transition={{ duration: 1.1, ease: "easeOut" }}
            style={{ position: "absolute", left: `${c.x}%`, top: "55%", width: 10, height: 10, background: c.col, borderRadius: 2 }} />
        ))}
      </div>

      {/* Turn button */}
      {state === "idle" && (
        <motion.button initial={{ scale: .9 }} animate={{ scale: 1 }} whileHover={{ scale: 1.06 }}
          onClick={turnHandle}
          style={{ marginTop: 22, background: "#e89040", border: "none", padding: "14px 34px", borderRadius: 30, fontFamily: "'Caveat',cursive", fontSize: 20, color: "white", cursor: "pointer", boxShadow: "0 4px 18px rgba(200,120,0,.35)" }}>
          {plays > 0 ? "turn again ✦" : "turn the handle ✦"}
        </motion.button>
      )}

      {/* Prize card */}
      <AnimatePresence>
        {state === "open" && prize && (
          <motion.div initial={{ opacity: 0, scale: .6, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
            className="paper"
            style={{ marginTop: 18, padding: "20px 32px", borderRadius: 18, boxShadow: "0 8px 32px rgba(0,0,0,.14)", textAlign: "center", maxWidth: 340, fontFamily: "'Caveat',cursive", fontSize: 20, color: "#3d2b1f", lineHeight: 1.55 }}>
            {prize}
            <div style={{ marginTop: 16, display: "flex", gap: 12, justifyContent: "center" }}>
              <button onClick={reset} style={{ background: "#f0e0c8", border: "none", padding: "8px 20px", borderRadius: 20, fontFamily: "'Caveat',cursive", fontSize: 15, cursor: "pointer", color: "#7a5020" }}>again!</button>
              <button onClick={onNext} style={{ background: "#9b7fa6", border: "none", padding: "8px 20px", borderRadius: 20, fontFamily: "'Caveat',cursive", fontSize: 15, cursor: "pointer", color: "white" }}>to the stars →</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <ChLabel text="Chapter VI · Gacha of Tiny Joy" />
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
//  CHAPTER 7 · A Universe That Remembers You
// ═════════════════════════════════════════════════════════════════════════════
const UNIVERSE_STARS = Array.from({ length: 60 }, (_, i) => ({
  id: i,
  x: Math.random() * 100,
  y: Math.random() * 92,
  size: Math.random() * 4.2 + 2.0,        // larger than before
  dur: 1.5 + Math.random() * 2.5,
  delay: Math.random() * 3.5,
  baseOpacity: 0.55 + Math.random() * 0.45, // pre-computed so renders are stable
}));

// ── Leo constellation (mapped from real RA/Dec) ───────────────────────────────
// x%, y% viewport positions — sickle + body + tail
const LEO_STARS = [
  { id: 0, x: 68, y: 68, r: 11, bright: true,  name: "Regulus" },    // α Leo — heart ♌
  { id: 1, x: 68, y: 52, r:  7, bright: false, name: "η Leo" },      // sickle base
  { id: 2, x: 62, y: 42, r:  9, bright: false, name: "Algieba" },    // γ Leo — mane
  { id: 3, x: 63, y: 31, r:  6, bright: false, name: "Adhafera" },   // ζ Leo — upper sickle
  { id: 4, x: 74, y: 22, r:  7, bright: false, name: "μ Leo" },      // top curve of sickle
  { id: 5, x: 78, y: 30, r:  6, bright: false, name: "ε Leo" },      // sickle hook tip
  { id: 6, x: 40, y: 41, r:  8, bright: false, name: "Zosma" },      // δ Leo — back
  { id: 7, x: 40, y: 57, r:  7, bright: false, name: "Chertan" },    // θ Leo — hip
  { id: 8, x: 23, y: 60, r: 10, bright: false, name: "Denebola" },   // β Leo — tail tip
];

const LEO_LINES: [number, number][] = [
  [0, 1], // Regulus → η Leo   (sickle handle up)
  [1, 2], // η Leo → Algieba   (sickle curves left)
  [2, 3], // Algieba → Adhafera (sickle rises)
  [3, 4], // Adhafera → μ Leo  (sickle arcs right — the curve)
  [4, 5], // μ Leo → ε Leo     (sickle hook tip)
  [0, 7], // Regulus → Chertan (body goes left)
  [7, 6], // Chertan → Zosma   (body rises)
  [6, 2], // Zosma → Algieba   (body meets mane)
  [7, 8], // Chertan → Denebola (tail sweeps out)
];

function Ch7({ onNext }: { onNext: () => void }) {
  const [clicked, setClicked] = useState<Set<number>>(new Set());
  const [forming, setForming] = useState(false);
  const [showNext, setShowNext] = useState(false);

  const clickStar = useCallback((id: number) => {
    const next = new Set(clicked).add(id);
    setClicked(next);
    if (next.size >= 8 && !forming) {
      setForming(true);
      setTimeout(() => setShowNext(true), 2400);
    }
  }, [clicked, forming]);

  return (
    <div style={{
      width: "100vw", height: "100vh",
      background: "linear-gradient(180deg, #030814 0%, #060b1e 60%, #0a1030 100%)",
      position: "relative", overflow: "hidden", fontFamily: "'Caveat', cursive",
    }}>
      {/* Milky way */}
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 80% 40% at 50% 40%, rgba(100,80,180,.08) 0%, transparent 100%)", pointerEvents: "none" }} />
      {/* Ground silhouette */}
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "16%", background: "#050f08", clipPath: "polygon(0 40%,5% 22%,12% 35%,20% 18%,28% 30%,35% 16%,44% 28%,50% 13%,58% 24%,65% 14%,72% 28%,80% 16%,87% 26%,94% 18%,100% 30%,100% 100%,0 100%)" }} />

      {/* Background stars — brighter, larger, clickable */}
      {UNIVERSE_STARS.map(s => (
        <div key={s.id} onClick={() => clickStar(s.id)} style={{
          position: "absolute",
          left: `${s.x}%`, top: `${s.y}%`,
          width:  clicked.has(s.id) ? s.size * 3 : s.size,
          height: clicked.has(s.id) ? s.size * 3 : s.size,
          borderRadius: "50%",
          background: clicked.has(s.id) ? "#ffd700" : "white",
          opacity: clicked.has(s.id) ? 1 : s.baseOpacity,
          boxShadow: clicked.has(s.id)
            ? `0 0 ${s.size * 6}px #ffd700, 0 0 ${s.size * 2}px #fff8c0`
            : `0 0 ${s.size * 2}px rgba(200,220,255,.55)`,
          animation: `twinkle ${s.dur}s ease-in-out infinite`,
          animationDelay: `${s.delay}s`,
          cursor: "pointer", transition: "all .4s ease", zIndex: 2,
        }} />
      ))}

      {/* ♌ Leo constellation — appears after 8 stars clicked */}
      {forming && (() => {
        const vw = window.innerWidth;
        const vh = window.innerHeight;
        const px = (star: typeof LEO_STARS[0]) => star.x / 100 * vw;
        const py = (star: typeof LEO_STARS[0]) => star.y / 100 * vh;
        return (
          <svg
            width={vw} height={vh}
            style={{ position: "absolute", inset: 0, zIndex: 9, pointerEvents: "none" }}>
            <defs>
              <filter id="leo-glow-sm">
                <feGaussianBlur stdDeviation="3" result="b"/>
                <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
              </filter>
              <filter id="leo-glow-lg">
                <feGaussianBlur stdDeviation="7" result="b"/>
                <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
              </filter>
            </defs>

            {/* Connecting lines — draw one by one */}
            {LEO_LINES.map(([a, b], i) => (
              <motion.path
                key={i}
                d={`M ${px(LEO_STARS[a])} ${py(LEO_STARS[a])} L ${px(LEO_STARS[b])} ${py(LEO_STARS[b])}`}
                stroke="rgba(190,215,255,.65)"
                strokeWidth="1.6"
                strokeLinecap="round"
                fill="none"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ delay: 0.6 + i * 0.22, duration: 0.9, ease: "easeInOut" }}
              />
            ))}

            {/* Star dots */}
            {LEO_STARS.map((s, i) => (
              <g key={s.id}>
                {/* soft halo */}
                <motion.circle
                  cx={px(s)} cy={py(s)} r={s.r * (s.bright ? 4 : 2.5)}
                  fill={s.bright ? "rgba(255,220,80,.22)" : "rgba(200,225,255,.09)"}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.3 + i * 0.1, duration: 0.7 }}
                />
                {/* star core */}
                <motion.circle
                  cx={px(s)} cy={py(s)} r={s.r}
                  fill={s.bright ? "#ffd700" : "#e8f0ff"}
                  filter={s.bright ? "url(#leo-glow-lg)" : "url(#leo-glow-sm)"}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.3 + i * 0.1, duration: 0.55, ease: "easeOut" }}
                />
                {/* Regulus pulse ring */}
                {s.bright && (
                  <motion.circle
                    cx={px(s)} cy={py(s)} r={s.r * 2.2}
                    fill="none" stroke="rgba(255,215,0,.35)" strokeWidth="1.5"
                    animate={{ scale: [1, 1.8, 1], opacity: [0.5, 0, 0.5] }}
                    transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                  />
                )}
              </g>
            ))}
          </svg>
        );
      })()}

      {/* Hint text */}
      {!forming && (
        <motion.div animate={{ opacity: [.45, 1, .45] }} transition={{ duration: 3, repeat: Infinity }}
          style={{ position: "absolute", bottom: "20%", left: "50%", transform: "translateX(-50%)", fontFamily: "'Caveat', cursive", fontSize: 16, color: "rgba(200,180,240,.6)", whiteSpace: "nowrap" }}>
          click the stars to find them ({clicked.size}/8)
        </motion.div>
      )}

      {/* Leo label */}
      {forming && (
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 2.8 }}
          style={{ position: "absolute", bottom: "18%", left: "50%", transform: "translateX(-50%)", textAlign: "center" }}>
          <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 28, fontStyle: "italic", color: "rgba(255,230,140,.9)", textShadow: "0 0 24px rgba(255,200,60,.45)", letterSpacing: 3 }}>
            ♌ Leo
          </div>
          <div style={{ fontFamily: "'Caveat', cursive", fontSize: 16, color: "rgba(200,180,240,.7)", marginTop: 4 }}>
            22 August · the universe remembers you
          </div>
        </motion.div>
      )}

      {showNext && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ position: "absolute", bottom: "9%", left: "50%", transform: "translateX(-50%)" }}>
          <PageTab onClick={onNext} label="Bring the spring →" pos="center" />
        </motion.div>
      )}
      <ChLabel text="Chapter VII · A Universe That Remembers You" light />
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
//  CHAPTER 8 · You Made Spring Come
// ═════════════════════════════════════════════════════════════════════════════
type FlowerEl = { id: number; x: number; y: number; emoji: string };
const FLOWER_EMOJIS = ["🌸","🌺","🌼","🌻","🌹","💐","🌷"];

function Ch8({ onNext }: { onNext: () => void }) {
  const [flowers, setFlowers] = useState<FlowerEl[]>([]);
  const [phase, setPhase] = useState(0); // 0 grey, 1 growing, 2 full
  const fid = useRef(0);
  const count = useRef(0);

  const grow = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    if (y < 30) return;
    const id = fid.current++;
    setFlowers(fs => [...fs.slice(-60), { id, x, y, emoji: FLOWER_EMOJIS[Math.floor(Math.random() * FLOWER_EMOJIS.length)] }]);
    count.current++;
    if (count.current === 1) setPhase(1);
    if (count.current >= 22 && phase < 2) setPhase(2);
  };

  const bgTop = phase === 0 ? "#c4c4c4" : phase === 1 ? "#a8c8e8" : "#87ceeb";
  const ground = phase === 0 ? "#6a6a6a" : phase === 1 ? "#5a9060" : "#4a9050";

  return (
    <div onMouseMove={grow} onClick={grow} style={{
      width: "100vw", height: "100vh",
      background: `linear-gradient(180deg, ${bgTop} 0%, ${phase === 0 ? "#b0b0b0" : "#c8e0f0"} 60%, ${phase === 0 ? "#a0a0a0" : "#d8f0e8"} 100%)`,
      position: "relative", overflow: "hidden", fontFamily: "'Caveat', cursive",
      transition: "background 2.5s ease",
    }}>
      {/* Sun */}
      <motion.div animate={{ opacity: phase === 0 ? 0 : 1, scale: phase >= 1 ? 1 : 0 }} transition={{ duration: 2.2 }}
        style={{ position: "absolute", top: "7%", right: "10%", width: 80, height: 80, borderRadius: "50%", background: "radial-gradient(circle, #ffd700, #ff9f00)", boxShadow: "0 0 55px rgba(255,200,0,.5)" }} />

      {/* Birds */}
      {phase >= 2 && [0, 1, 2].map(i => (
        <motion.div key={i}
          initial={{ x: "-5vw", y: `${18 + i * 10}%` }}
          animate={{ x: "110vw", y: [`${18 + i * 10}%`, `${14 + i * 10}%`, `${18 + i * 10}%`] }}
          transition={{ duration: 9 + i * 2, delay: i * 1.8, repeat: Infinity }}
          style={{ position: "absolute", top: 0, left: 0, fontSize: 16 }}>🐦</motion.div>
      ))}

      {/* Ground */}
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "34%", background: `linear-gradient(180deg, ${ground} 0%, ${phase === 0 ? "#5a5a5a" : "#3a7040"} 100%)`, transition: "background 2.5s ease" }} />

      {/* Flowers */}
      {flowers.map(f => (
        <div key={f.id} style={{ position: "absolute", left: `${f.x}%`, top: `${f.y}%`, transform: "translate(-50%,-100%)", animation: "bloomFlower .6s ease-out forwards", fontSize: "22px", pointerEvents: "none" }}>{f.emoji}</div>
      ))}

      {/* Butterflies when bloomed */}
      {phase >= 1 && Array.from({ length: 5 }, (_, i) => (
        <motion.div key={i}
          animate={{ x: [`${15 + i * 15}%`, `${25 + i * 12}%`, `${15 + i * 15}%`], y: [`${25 + i * 8}%`, `${18 + i * 8}%`, `${25 + i * 8}%`] }}
          transition={{ duration: 5 + i * 1.8, repeat: Infinity, ease: "easeInOut" }}
          style={{ position: "absolute", top: 0, left: 0, fontSize: 20, pointerEvents: "none" }}>🦋</motion.div>
      ))}

      {/* Instructions */}
      {phase === 0 && (
        <motion.div animate={{ opacity: [.45, 1, .45] }} transition={{ duration: 2.5, repeat: Infinity }}
          style={{ position: "absolute", top: "40%", left: "50%", transform: "translateX(-50%)", fontFamily: "'Caveat', cursive", fontSize: 22, color: "rgba(70,60,50,.55)", textAlign: "center", whiteSpace: "nowrap", pointerEvents: "none" }}>
          move your mouse here to bring spring 🌱
        </motion.div>
      )}

      {phase >= 2 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: .5 }}
          style={{ position: "absolute", top: "10%", left: "50%", transform: "translateX(-50%)", fontFamily: "'Caveat', cursive", fontSize: 26, color: "#3d5a30", textShadow: "0 2px 10px rgba(255,255,255,.9)", whiteSpace: "nowrap" }}>
          you made spring come ✦
        </motion.div>
      )}

      {phase >= 2 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2 }}
          style={{ position: "absolute", bottom: "7%", left: "50%", transform: "translateX(-50%)" }}>
          <PageTab onClick={onNext} label="One last thing →" pos="center" />
        </motion.div>
      )}
      <ChLabel text="Chapter VIII · You Made Spring Come" />
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
//  CHAPTER 9 · One Last Request
// ═════════════════════════════════════════════════════════════════════════════
function Ch9({ memory }: { memory: Memory }) {
  const [step, setStep] = useState<"writing" | "camera" | "countdown" | "photo" | "final">("writing");
  const [count, setCount] = useState(3);

  const l1 = useTW("Before you go...", 75, 0, step === "writing");
  const l2 = useTW("I have one tiny request.", 75, 0, step === "writing" && l1.done);
  const lf1 = useTW("There you are.", 80, 0, step === "final");
  const lf2 = useTW("I was hoping I'd get to see this face before we said goodbye.", 52, 0, step === "final" && lf1.done);

  useEffect(() => {
    if (step === "writing" && l2.done) { const t = setTimeout(() => setStep("camera"), 1500); return () => clearTimeout(t); }
  }, [step, l2.done]);

  const clickCamera = () => {
    if (step !== "camera") return;
    setStep("countdown"); setCount(3);
    const tick = (n: number) => {
      setCount(n);
      if (n <= 0) { setStep("photo"); setTimeout(() => setStep("final"), 2200); return; }
      setTimeout(() => tick(n - 1), 950);
    };
    setTimeout(() => tick(2), 950);
  };

  const personalNote = [
    memory.pettedCat && "the cat misses you already.",
    memory.wateredFlowers && "your flowers will bloom again.",
    memory.watchedButterflies && "the butterflies remember you too.",
  ].filter(Boolean).join(" ");

  return (
    <div style={{
      width: "100vw", height: "100vh",
      background: "linear-gradient(180deg, #fff8e7 0%, #fffaf0 60%, #fff5e0 100%)",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      fontFamily: "'Caveat', cursive", position: "relative", overflow: "hidden",
    }}>
      {/* Floating petals */}
      {Array.from({ length: 14 }, (_, i) => (
        <div key={i} style={{ position: "absolute", left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%`, fontSize: "16px", opacity: .32, animation: `floatUp ${3 + Math.random() * 3}s ease-in-out infinite`, animationDelay: `${Math.random() * 3}s`, pointerEvents: "none" }}>🌸</div>
      ))}

      <div className="nb-lines" style={{ width: 450, maxWidth: "92vw", borderRadius: 6, boxShadow: "0 8px 40px rgba(0,0,0,.1)", padding: "46px 42px 42px", display: "flex", flexDirection: "column", alignItems: "center", gap: 20, position: "relative" }}>
        <div className="washi" style={{ position: "absolute", top: -12, left: "28%", width: 92, height: 24, transform: "rotate(-1.5deg)", borderRadius: 3 }} />

        {/* Writing phase */}
        {(step === "writing" || step === "camera") && (<>
          <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 30, color: "#3d2b1f", fontStyle: "italic", textAlign: "center" }}>
            {l1.shown}{step === "writing" && !l1.done && <span style={{ borderRight: "2px solid #3d2b1f", animation: "blink .7s step-end infinite" }} />}
          </div>
          {l1.done && <div style={{ fontFamily: "'Caveat', cursive", fontSize: 20, color: "#5a3d2f", textAlign: "center" }}>
            {l2.shown}{step === "writing" && !l2.done && <span style={{ borderRight: "2px solid #5a3d2f", animation: "blink .7s step-end infinite" }} />}
          </div>}
        </>)}

        {/* Camera */}
        {step === "camera" && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .35 }}
            onClick={clickCamera} style={{ cursor: "pointer", textAlign: "center" }}>
            <svg width="144" height="112" viewBox="0 0 144 112" style={{ animation: "floatUp 3s ease-in-out infinite" }}>
              <rect x="10" y="26" width="124" height="76" rx="13" fill="#4a3050" />
              <circle cx="72" cy="66" r="28" fill="#2a2030" />
              <circle cx="72" cy="66" r="22" fill="#3a2840" />
              <circle cx="72" cy="66" r="15" fill="#1a1020" />
              <circle cx="65" cy="60" r="4" fill="rgba(255,255,255,.24)" />
              <rect x="14" y="30" width="24" height="15" rx="4" fill="#f9f0c8" />
              <circle cx="115" cy="36" r="8" fill="#6a4060" />
              <rect x="90" y="16" width="26" height="15" rx="4" fill="#3a2840" />
              {/* Flower sticker */}
              <circle cx="30" cy="52" r="9" fill="#f9c8e8" />
              {[0,72,144,216,288].map((a,i) => (
                <ellipse key={i} cx={30} cy={44} rx={3} ry={5} fill={["#f9c8d0","#f0c8e8","#e8c8f9","#c8d8f9","#c8f9e8"][i]} transform={`rotate(${a} 30 52)`} />
              ))}
              {/* Smile sticker */}
              <circle cx="112" cy="74" r="8" fill="#f9f0a0" />
              <circle cx="109.5" cy="72" r="1.2" fill="#3a2010" /><circle cx="114.5" cy="72" r="1.2" fill="#3a2010" />
              <path d="M109 76Q112 79 115 76" stroke="#3a2010" strokeWidth="1.2" fill="none" />
            </svg>
            <div style={{ fontFamily: "'Caveat', cursive", fontSize: 17, color: "#5a3d2f", marginTop: 6, lineHeight: 1.6 }}>
              "I know today tried to steal your smile."<br />
              "Could I borrow one?"
            </div>
            <div style={{ marginTop: 10, fontFamily: "'Caveat', cursive", fontSize: 14, color: "#9b7fa6" }}>click the camera ✦</div>
          </motion.div>
        )}

        {/* Countdown */}
        {step === "countdown" && (
          <motion.div key={count} initial={{ scale: .4, opacity: 0 }} animate={{ scale: 1.3, opacity: 1 }} exit={{ scale: 2, opacity: 0 }}
            style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 90, color: "#9b7fa6", textAlign: "center", lineHeight: 1 }}>
            {count > 0 ? count : "✦"}
          </motion.div>
        )}

        {/* Polaroid */}
        {(step === "photo" || step === "final") && (
          <motion.div initial={{ opacity: 0, y: -30, rotate: -5 }} animate={{ opacity: 1, y: 0, rotate: -2 }} transition={{ duration: .6 }}
            style={{ width: 204, height: 228, background: "white", boxShadow: "0 6px 26px rgba(0,0,0,.22)", display: "flex", flexDirection: "column", alignItems: "center", padding: "16px 16px 26px", borderRadius: 2, position: "relative", animation: step === "photo" ? "polarDev 2s ease-out forwards" : undefined }}>
            <div className="washi" style={{ position: "absolute", top: -11, left: "50%", transform: "translateX(-50%)", width: 52, height: 18, borderRadius: 2 }} />
            <div style={{ width: "100%", flex: 1, background: "#e8d8e8", borderRadius: 1, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 50 }}>😊</div>
            {step === "final" && <div style={{ fontFamily: "'Caveat', cursive", fontSize: 13, color: "#4a3028", marginTop: 8, textAlign: "center" }}>♡ there she is</div>}
            {step === "final" && <div style={{ position: "absolute", bottom: -20, right: -18, fontSize: 22 }}>✏️❤️</div>}
          </motion.div>
        )}

        {/* Final message */}
        {step === "final" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.8 }}
            style={{ textAlign: "center", display: "flex", flexDirection: "column", gap: 10, maxWidth: 340 }}>
            <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 28, color: "#3d2b1f", fontStyle: "italic" }}>
              {lf1.shown}
            </div>
            {lf1.done && <div style={{ fontFamily: "'Caveat', cursive", fontSize: 17, color: "#5a3d2f", lineHeight: 1.65 }}>{lf2.shown}</div>}
            {lf2.done && personalNote && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: .8 }}
                style={{ fontFamily: "'Caveat', cursive", fontSize: 14, color: "#9b7fa6", marginTop: 6 }}>
                {personalNote} ✦
              </motion.div>
            )}
          </motion.div>
        )}
      </div>
      <ChLabel text="Chapter IX · One Last Request" />
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
//  ROOT APP
// ═════════════════════════════════════════════════════════════════════════════
export default function App() {
  const [chapter, setChapter] = useState(0);
  const [memory, setMemory] = useState<Memory>({
    pettedCat: false, wateredFlowers: false,
    watchedButterflies: false, foundFeather: false,
  });

  const next = () => setChapter(c => Math.min(c + 1, 8));

  const chapters = [
    <Ch1 key={0} onNext={next} />,
    <Ch2 key={1} onNext={next} setMemory={setMemory} />,
    <Ch3 key={2} onNext={next} setMemory={setMemory} />,
    <Ch4 key={3} onNext={next} memory={memory} setMemory={setMemory} />,
    <Ch5 key={4} onNext={next} />,
    <Ch6 key={5} onNext={next} />,
    <Ch7 key={6} onNext={next} />,
    <Ch8 key={7} onNext={next} />,
    <Ch9 key={8} memory={memory} />,
  ];

  return (
    <div style={{ width: "100vw", height: "100vh", overflow: "hidden", position: "relative" }}>
      <style>{GCSS}</style>
      <Cursor />

      {/* Progress dots */}
      <div style={{ position: "fixed", bottom: 14, left: "50%", transform: "translateX(-50%)", display: "flex", gap: 7, zIndex: 100, pointerEvents: "none" }}>
        {Array.from({ length: 9 }, (_, i) => (
          <div key={i} style={{
            width: i === chapter ? 22 : 7, height: 7, borderRadius: 4,
            background: i <= chapter ? "rgba(255,255,255,.72)" : "rgba(255,255,255,.2)",
            transition: "all .4s ease",
          }} />
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={chapter}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          transition={{ duration: .75 }}
          style={{ width: "100%", height: "100%" }}>
          {chapters[chapter]}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
