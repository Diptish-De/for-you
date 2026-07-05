import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";

import sayani1 from "../imports/sayani-1.png";
import sayani2 from "../imports/sayani-2.jpg";
import sayani3 from "../imports/sayani-3.jpg";


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
  @keyframes sparkFade {
    from { transform: scale(0) rotate(0deg); opacity: 1; }
    to   { transform: scale(1.6) rotate(90deg); opacity: 0; }
  }
  @keyframes handleTurn {
    from { transform: rotate(0deg); }
    to   { transform: rotate(360deg); }
  }
  @keyframes springGrow {
    from { transform: scaleY(0); transform-origin: bottom center; }
    to   { transform: scaleY(1); transform-origin: bottom center; }
  }
  @keyframes pageFlip {
    0% { transform: rotateY(0deg); }
    100% { transform: rotateY(-180deg); }
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
  }s='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='.055'/%3E%3C/svg%3E");
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
          transform: "translate3d(-200px, -200px, 0)",
          pointerEvents: "none"
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
  const [flipping, setFlipping] = useState(false);

  const l1 = useTW("Hi Sayani.", 78, 0, phase >= 1);
  const l2 = useTW("I borrowed you from the world for a little while.", 60, 0, phase >= 2);

  const handleOpen = () => {
    setOpened(true);
  };

  useEffect(() => {
    if (opened) {
      const t = setTimeout(() => setPhase(1), 1800);
      return () => clearTimeout(t);
    }
  }, [opened]);

  useEffect(() => { if (phase === 1 && l1.done) { const t = setTimeout(() => setPhase(2), 900); return () => clearTimeout(t); } }, [phase, l1.done]);
  useEffect(() => { if (phase === 2 && l2.done) { const t = setTimeout(() => setPhase(3), 1100); return () => clearTimeout(t); } }, [phase, l2.done]);

  const handleTurnPage = () => {
    setFlipping(true);
    setTimeout(() => {
      onNext();
    }, 1300);
  };

  return (
    <div style={{
      width: "100vw", height: "100vh",
      background: "linear-gradient(180deg, #050a14 0%, #0a1122 60%, #12182c 100%)",
      position: "relative", overflow: "hidden", fontFamily: "'Caveat', cursive",
    }}>
      {/* Twinkling ambient stars */}
      {STARS_BG.map(s => (
        <div key={s.id} style={{
          position: "absolute", left: `${s.x}%`, top: `${s.y}%`,
          width: s.size, height: s.size, borderRadius: "50%", background: "white",
          opacity: .3 + Math.random() * .7,
          animation: `twinkle ${s.dur}s ease-in-out infinite`, animationDelay: `${s.delay}s`,
          pointerEvents: "none",
        }} />
      ))}

      {/* Cozy soft moon */}
      <div style={{ position: "absolute", top: "7%", left: "16%", pointerEvents: "none", opacity: 0.85 }}>
        <svg width="44" height="44" viewBox="0 0 44 44">
          <circle cx="22" cy="22" r="18" fill="#fffbe3" style={{ filter: "drop-shadow(0 0 10px rgba(255,251,227,0.6))" }} />
          <circle cx="29" cy="15" r="15" fill="#050a14" />
        </svg>
      </div>

      {/* Cozy Glassmorphic Window with trickling rain */}
      <div style={{
        position: "absolute", right: "7%", top: "7%",
        width: 154, height: 200, 
        background: "rgba(255, 255, 255, 0.03)",
        border: "10px solid #3c2415", 
        borderRadius: 4, 
        overflow: "hidden",
        backdropFilter: "blur(3px)",
        boxShadow: "inset 0 0 20px rgba(0,0,0,0.6), 0 8px 30px rgba(0,0,0,0.5)",
        zIndex: 1,
      }}>
        {/* Frame lines */}
        <div style={{ position: "absolute", left: "50%", top: 0, bottom: 0, width: 6, background: "#3c2415", transform: "translateX(-50%)" }} />
        <div style={{ position: "absolute", top: "48%", left: 0, right: 0, height: 6, background: "#3c2415", transform: "translateY(-50%)" }} />
        
        {/* Rain droplets */}
        {RAIN.map(d => (
          <div key={d.id} style={{
            position: "absolute", left: `${d.x}%`, top: -16,
            width: 1, height: 12, background: "rgba(186,218,255,0.35)",
            animation: `rainFall ${d.dur}s linear infinite`, animationDelay: `${d.delay}s`,
          }} />
        ))}
      </div>

      {/* Banker's Lamp casting warm yellow light */}
      <div style={{ position: "absolute", left: "8%", top: "20%", zIndex: 3 }}>
        {/* Lamp drawing */}
        <svg width="60" height="120" viewBox="0 0 60 120" style={{ filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.4))" }}>
          {/* Emerald green shade */}
          <path d="M12 40 L48 40 L54 62 L6 62 Z" fill="#065f46" stroke="#047857" strokeWidth="1" />
          <ellipse cx="30" cy="62" rx="24" ry="4" fill="#047857" />
          
          {/* Golden inner shade glow */}
          <ellipse cx="30" cy="62" rx="20" ry="3" fill="#fbbf24" opacity="0.8" />

          {/* Brass rod stand */}
          <path d="M30 62 L30 110" stroke="#ca8a04" strokeWidth="4" />
          <path d="M28 62 C20 62, 20 85, 28 92" stroke="#ca8a04" strokeWidth="2.5" fill="none" />
          
          {/* Base */}
          <rect x="18" y="108" width="24" height="8" rx="2" fill="#ca8a04" stroke="#854d0e" strokeWidth="1" />
        </svg>

        {/* Banker's Lamp radial light beam projection */}
        <div style={{
          position: "absolute", top: 40, left: -140, width: 340, height: 340,
          borderRadius: "50%", 
          background: "radial-gradient(circle, rgba(253,224,71,0.2) 0%, rgba(253,224,71,0.06) 45%, transparent 70%)",
          pointerEvents: "none", 
          mixBlendMode: "screen",
          animation: "glowPulse 4s ease-in-out infinite",
        }} />
      </div>

      {/* Steaming Mug on Desk */}
      <div style={{ position: "absolute", left: "24%", bottom: "32%", zIndex: 3, filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.35))" }}>
        <svg width="48" height="52" viewBox="0 0 48 52">
          {/* Cup */}
          <path d="M6 16 L6 42 Q6 48, 12 48 L30 48 Q36 48, 36 42 L36 16 Z" fill="#b45309" />
          {/* Handle */}
          <path d="M36 22 Q46 22, 46 30 Q46 38, 36 38" stroke="#92400e" strokeWidth="4" fill="none" />
          {/* Lid/Rim */}
          <ellipse cx="21" cy="16" rx="15" ry="3" fill="#d97706" />
          
          {/* Steam loops */}
          {[0, 0.7, 1.4].map((d, i) => (
            <path key={i} d={`M${13 + i * 8} 11 Q${15 + i * 8} 5 ${13 + i * 8} 0`}
              stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" fill="none"
              style={{ animation: `steam 2s ease-out infinite`, animationDelay: `${d}s` }} />
          ))}
        </svg>
      </div>

      {/* Cozy Flickering Candle */}
      <div style={{ position: "absolute", left: "34%", bottom: "32%", zIndex: 3, display: "flex", flexDirection: "column", alignItems: "center" }}>
        {/* Pulsing Flame */}
        <motion.div 
          animate={{ scaleY: [1, 1.25, 0.95, 1.15, 1], scaleX: [1, 0.9, 1.1, 0.95, 1], y: [0, -1, 1, 0] }}
          transition={{ duration: 0.18, repeat: Infinity, ease: "linear" }}
          style={{
            width: 8,
            height: 16,
            borderRadius: "50% 50% 35% 35%",
            background: "radial-gradient(circle at center, #ffffff 15%, #f59e0b 60%, #ef4444 100%)",
            boxShadow: "0 0 10px #f59e0b, 0 0 20px #ef4444",
            marginBottom: -2,
          }}
        />
        {/* Wax base */}
        <div style={{
          width: 14,
          height: 28,
          background: "linear-gradient(90deg, #fef3c7, #fde68a, #fcd34d)",
          borderRadius: 2,
          borderBottom: "1px solid #d97706",
          boxShadow: "0 2px 4px rgba(0,0,0,0.3)",
        }} />
      </div>

      {/* Potted Ivy Plant */}
      <div style={{ position: "absolute", right: "6%", bottom: "32%", zIndex: 3, filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.4))" }}>
        <svg width="56" height="80" viewBox="0 0 56 80">
          {/* Terracotta pot */}
          <polygon points="17,54 39,54 35,76 21,76" fill="#ca8a04" stroke="#854d0e" strokeWidth="1" />
          <rect x="14" y="48" width="28" height="6" rx="1.5" fill="#ca8a04" stroke="#854d0e" strokeWidth="1" />
          
          {/* Leaves */}
          <ellipse cx="16" cy="38" rx="12" ry="7" fill="#047857" transform="rotate(-15 16 38)" />
          <ellipse cx="38" cy="38" rx="11" ry="6" fill="#059669" transform="rotate(15 38 38)" />
          <ellipse cx="27" cy="28" rx="12" ry="9" fill="#047857" />
          <ellipse cx="14" cy="24" rx="9" ry="5" fill="#059669" transform="rotate(-25 14 24)" />
          <ellipse cx="40" cy="24" rx="8" ry="5" fill="#10b981" transform="rotate(25 40 24)" />
        </svg>
      </div>

      {/* Polished Wooden Desk Surface */}
      <div style={{
        position: "absolute", bottom: 0, left: 0, right: 0, height: "34%",
        background: "linear-gradient(180deg, #301d14 0%, #1e110b 100%)",
        borderTop: "5px solid #42281c",
        boxShadow: "0 -8px 30px rgba(0,0,0,0.7), inset 0 2px 4px rgba(255,255,255,0.06)",
        zIndex: 2,
      }}>
        {/* Soft shadow cast by the notebook */}
        <div style={{
          position: "absolute",
          top: 0,
          left: "50%",
          transform: "translateX(-50%)",
          width: opened ? 860 : 480,
          height: 40,
          background: "radial-gradient(ellipse at center, rgba(0,0,0,0.65) 0%, transparent 80%)",
          transition: "width 1.8s ease",
        }} />
      </div>

      {/* THE NOTEBOOK CONTAINER */}
      <div style={{
        position: "absolute",
        left: "50%",
        top: opened ? "50%" : "58%",
        transform: opened ? "translate3d(-50%, -50%, 0) scale(1)" : "translate3d(-75%, -50%, 0) scale(0.6)",
        perspective: 1500,
        zIndex: 100,
        transition: "transform 1.8s cubic-bezier(0.4, 0, 0.2, 1), top 1.8s cubic-bezier(0.4, 0, 0.2, 1)",
      }}>
        <div style={{
          position: "relative",
          width: 840,
          height: 550,
          transformStyle: "preserve-3d",
        }}>
          
          {/* Cover Plate (rotates left) */}
          <div style={{
            position: "absolute",
            left: "50%",
            top: 0,
            width: "50%",
            height: "100%",
            background: "linear-gradient(135deg, #7c2d12 0%, #451a03 100%)",
            borderRadius: "3px 14px 14px 3px",
            transformOrigin: "left center",
            transform: opened ? "rotateY(-180deg)" : "rotateY(0deg)",
            transition: "transform 1.8s cubic-bezier(0.4, 0, 0.2, 1)",
            transformStyle: "preserve-3d",
            zIndex: opened ? 5 : 10,
            boxShadow: opened 
              ? "-12px 16px 45px rgba(0,0,0,0.5)" 
              : "6px 10px 32px rgba(0,0,0,0.7), inset 0 2px 4px rgba(255,255,255,0.15)",
            border: "1px solid #7c2d12",
          }}>
            
            {/* Front Cover artwork */}
            <div 
              onClick={handleOpen}
              style={{
                position: "absolute",
                inset: 0,
                backfaceVisibility: "hidden",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                cursor: opened ? "default" : "pointer",
              }}
            >
              {/* Spine edge thickness */}
              <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 22, background: "linear-gradient(90deg, #451a03, #7c2d12)", borderRadius: "3px 0 0 3px", boxShadow: "inset -2px 0 5px rgba(0,0,0,0.3)" }} />
              
              {/* Gold Foiled Corner Protection Brackets */}
              <div style={{ position: "absolute", top: 12, right: 12, width: 24, height: 24, borderTop: "3px solid #fbbf24", borderRight: "3px solid #fbbf24", borderRadius: "0 4px 0 0", opacity: 0.8 }} />
              <div style={{ position: "absolute", bottom: 12, right: 12, width: 24, height: 24, borderBottom: "3px solid #fbbf24", borderRight: "3px solid #fbbf24", borderRadius: "0 0 4px 0", opacity: 0.8 }} />

              {/* Embossed flower emblem */}
              <div style={{ position: "absolute", top: 40, right: 38, filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.25))" }}>
                <svg width="44" height="44" viewBox="0 0 40 40">
                  {[0, 60, 120, 180, 240, 300].map((a, i) => (
                    <ellipse key={i} cx="20" cy="10" rx="5.5" ry="9.5"
                      fill={["#fbcfe8","#fecdd3","#fde2e4","#f0e6ef","#fae0e4","#f7cad0"][i]}
                      opacity=".9" transform={`rotate(${a} 20 20)`} />
                  ))}
                  <circle cx="20" cy="20" r="5.5" fill="#fef08a" />
                </svg>
              </div>

              {/* Gold foiled header */}
              <div style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontSize: 32,
                fontStyle: "italic",
                color: "#fef08a",
                textShadow: "0 2px 4px rgba(0,0,0,0.5)",
                letterSpacing: 2,
                marginLeft: 14,
                textAlign: "center",
              }}>
                A Little Corner<br/>
                <span style={{ fontSize: 20, letterSpacing: 3, opacity: 0.9 }}>of the Universe</span>
              </div>

              <div style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontSize: 18,
                fontWeight: "bold",
                color: "#ffffff",
                letterSpacing: 1.5,
                marginTop: 24,
                marginLeft: 14,
                borderBottom: "1px solid rgba(255,255,255,0.2)",
                paddingBottom: 4,
              }}>
                SAYANI
              </div>

              <div style={{ fontFamily: "'Caveat', cursive", fontSize: 15, color: "rgba(254,240,138,0.65)", marginTop: 14, marginLeft: 14, animation: "glowPulse 2s ease-in-out infinite" }}>
                click to open ✦
              </div>
            </div>

            {/* Back of cover (inside left notebook flap) */}
            <div style={{
              position: "absolute",
              inset: 0,
              backfaceVisibility: "hidden",
              transform: "rotateY(180deg)",
              background: "#ebd2d8",
              borderRadius: "14px 0 0 14px",
              boxShadow: "inset -12px 0 24px rgba(0,0,0,0.15)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}>
              <div style={{ 
                color: "#7a3a50", 
                fontFamily: "'Caveat', cursive", 
                fontSize: 36, 
                transform: "rotate(-8deg)",
                textShadow: "1px 1px 2px rgba(255,255,255,0.6)",
              }}>
                For Sayani 🌸
              </div>
              
              {/* Left page botanical doodle sketch */}
              <div style={{ position: "absolute", bottom: 20, left: 30, opacity: 0.15, fontSize: 80, transform: "rotate(-10deg)", userSelect: "none" }}>🌿</div>
              
              <div style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: 3, background: "rgba(0,0,0,0.12)" }} />
            </div>
          </div>

          {/* Paper stacks beneath the right page to give thickness */}
          {opened && (
            <>
              <div style={{ position: "absolute", left: "50%", top: 2, width: "49.6%", height: "99%", background: "#e5d8cb", borderRadius: "0 10px 10px 0", zIndex: 1, boxShadow: "4px 4px 10px rgba(0,0,0,0.1)" }} />
              <div style={{ position: "absolute", left: "50%", top: 4, width: "49.2%", height: "98%", background: "#dbcca5", borderRadius: "0 8px 8px 0", zIndex: 2, boxShadow: "8px 8px 15px rgba(0,0,0,0.15)" }} />
            </>
          )}

          {/* Right Page (lined sheet) */}
          {opened && (
            <div 
              className="nb-lines"
              style={{
                position: "absolute",
                left: "50%",
                top: 0,
                width: "50%",
                height: "100%",
                borderRadius: "0 14px 14px 0",
                boxShadow: "12px 12px 40px rgba(0,0,0,0.25)",
                padding: "65px 50px 50px 65px",
                display: "flex",
                flexDirection: "column",
                gap: 20,
                opacity: opened ? 1 : 0,
                transition: "opacity 1.2s ease",
                zIndex: 3,
              }}
            >
              {/* Central Spine shadow crease */}
              <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 26, background: "linear-gradient(90deg, rgba(0,0,0,0.14), transparent)" }} />

              {/* Bookmark Leather/Fabric Ribbon hanging down onto the desk */}
              <div style={{
                position: "absolute",
                left: 0,
                top: 0,
                width: 14,
                height: 590, // extends past book bottom
                background: "linear-gradient(90deg, #991b1b, #ef4444)",
                boxShadow: "2px 4px 8px rgba(0,0,0,0.3)",
                zIndex: 4,
                borderRadius: "0 0 3px 3px",
                pointerEvents: "none",
                transform: "translateX(-50%) rotate(2deg)",
                transformOrigin: "top center",
              }} />

              {phase >= 1 && (
                <div style={{ fontFamily: "'Caveat', cursive", fontSize: 36, color: "#2c1810", lineHeight: 1.4, fontWeight: "bold" }}>
                  {l1.shown}
                  {phase === 1 && !l1.done && <span style={{ borderRight: "2px solid #2c1810", marginLeft: 1, animation: "blink .7s step-end infinite" }} />}
                </div>
              )}
              {phase >= 2 && (
                <div style={{ fontFamily: "'Caveat', cursive", fontSize: 25, color: "#3d2010", lineHeight: 1.75 }}>
                  {l2.shown}
                  {phase === 2 && !l2.done && <span style={{ borderRight: "2px solid #3d2010", marginLeft: 1, animation: "blink .7s step-end infinite" }} />}
                </div>
              )}
              {phase >= 3 && !flipping && (
                <div style={{ position: "absolute", bottom: 45, right: 45 }}>
                  <PageTab onClick={handleTurnPage} />
                </div>
              )}
            </div>
          )}

          {/* Flipping Page Overlay */}
          {flipping && (
            <div style={{
              position: "absolute",
              left: "50%",
              top: 0,
              width: "50%",
              height: "100%",
              transformOrigin: "left center",
              animation: "pageFlip 1.2s cubic-bezier(0.4, 0, 0.2, 1) forwards",
              transformStyle: "preserve-3d",
              zIndex: 99,
            }}>
              {/* Front of flipping sheet */}
              <div 
                className="nb-lines"
                style={{
                  position: "absolute",
                  inset: 0,
                  backfaceVisibility: "hidden",
                  borderRadius: "0 14px 14px 0",
                  padding: "65px 50px 50px 65px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 20,
                }}
              >
                <div style={{ fontFamily: "'Caveat', cursive", fontSize: 36, color: "#2c1810", opacity: 0.6, fontWeight: "bold" }}>Hi Sayani.</div>
                <div style={{ fontFamily: "'Caveat', cursive", fontSize: 25, color: "#3d2010", opacity: 0.6, lineHeight: 1.75 }}>I borrowed you from the world for a little while.</div>
              </div>

              {/* Back of flipping sheet */}
              <div 
                className="paper"
                style={{
                  position: "absolute",
                  inset: 0,
                  backfaceVisibility: "hidden",
                  transform: "rotateY(-180deg)",
                  borderRadius: "14px 0 0 14px",
                  background: "#FAF4E8",
                  boxShadow: "inset -12px 0 24px rgba(0,0,0,0.15)",
                }}
              />
            </div>
          )}
        </div>
      </div>

      <ChLabel text="A Little Corner of the Universe" light />
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
      bx: (Math.random() - .5) * 260,
      by: -(100 + Math.random() * 150),
    }));
    setBts(bs => [...bs, ...newBts]);
    setTimeout(() => setBts(bs => bs.filter(b => !newBts.some(n => n.id === b.id))), 1800);
    if (next.size >= 3) setTimeout(() => setShowNext(true), 1200);
  };

  return (
    <div style={{
      width: "100vw", height: "100vh",
      background: "linear-gradient(180deg, #4c3f68 0%, #685382 30%, #886a9a 65%, #c89ba3 100%)",
      position: "relative", overflow: "hidden", fontFamily: "'Caveat', cursive",
    }}>
      
      {/* Ethereal Sky Nebula glow */}
      <div style={{
        position: "absolute",
        inset: 0,
        background: "radial-gradient(ellipse 60% 40% at 50% 30%, rgba(139, 92, 246, 0.15) 0%, transparent 100%)",
        pointerEvents: "none",
      }} />

      {/* Glowing Crescent Moon */}
      <div style={{ position: "absolute", top: "10%", right: "12%", pointerEvents: "none", opacity: 0.75 }}>
        <svg width="44" height="44" viewBox="0 0 44 44" style={{ filter: "drop-shadow(0 0 8px #fff6d0)" }}>
          <circle cx="22" cy="22" r="16" fill="#fff6d0" />
          <circle cx="28" cy="16" r="16" fill="#4c3f68" />
        </svg>
      </div>

      {/* Star twinkling in dream garden */}
      {STARS_BG.slice(0, 15).map(s => (
        <div key={s.id} style={{
          position: "absolute", left: `${s.x}%`, top: `${s.y * 0.8}%`,
          width: s.size * 0.8, height: s.size * 0.8, borderRadius: "50%", background: "white",
          opacity: .2 + Math.random() * .6,
          animation: `twinkle ${s.dur}s ease-in-out infinite`, animationDelay: `${s.delay}s`,
          pointerEvents: "none",
        }} />
      ))}

      {/* Layered Ethereal Meadow Hills */}
      <svg 
        style={{ position: "absolute", bottom: 0, left: 0, width: "100%", height: "26%", pointerEvents: "none", zIndex: 1 }}
        viewBox="0 0 1000 100" preserveAspectRatio="none"
      >
        <path d="M0 75 Q 250 35, 500 68 T 1000 60 L 1000 100 L 0 100 Z" fill="#203a27" opacity="0.6" />
      </svg>
      <svg 
        style={{ position: "absolute", bottom: 0, left: 0, width: "100%", height: "18%", pointerEvents: "none", zIndex: 2 }}
        viewBox="0 0 1000 100" preserveAspectRatio="none"
      >
        <path d="M0 80 Q 300 50, 600 78 T 1000 70 L 1000 100 L 0 100 Z" fill="#15271a" />
      </svg>

      {/* Meadow flowers */}
      {["🌸","🌼","🌺","🌻","🌸","🌼","🌺","🌻","🌸","🌼","🌺","🌻"].map((f, i) => (
        <div key={i} style={{ 
          position: "absolute", 
          bottom: `${4 + Math.random() * 8}%`, 
          left: `${4 + i * 8}%`, 
          fontSize: "19px",
          zIndex: 3,
          filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.3))",
          animation: "floatUp 4s ease-in-out infinite",
          animationDelay: `${i * 0.25}s`,
          pointerEvents: "none",
        }}>{f}</div>
      ))}

      {/* Clouds - Redesigned to be Fluffy Glassmorphic Elements */}
      {CLOUDS_DATA.map(c => {
        const isBurst = burst.has(c.id);
        return (
          <div key={c.id} style={{
            position: "absolute", 
            left: `${c.x}%`, 
            top: `${c.y}%`,
            width: c.w,
            height: c.w * 0.6,
            cursor: isBurst ? "default" : "pointer",
            zIndex: 4,
          }}
          onClick={() => burstCloud(c)}
          >
            <motion.div
              animate={isBurst ? { scale: 0, opacity: 0 } : { y: [0, -6, 0] }}
              transition={isBurst ? { duration: .35 } : { duration: 3.5 + c.id * 0.6, repeat: Infinity, ease: "easeInOut", delay: c.id * 0.3 }}
              style={{
                width: "100%",
                height: "100%",
                background: "rgba(255, 255, 255, 0.15)",
                border: "1.5px solid rgba(255, 255, 255, 0.35)",
                backdropFilter: "blur(12px)",
                borderRadius: 50,
                boxShadow: "0 10px 32px rgba(90, 60, 140, 0.2), inset 0 4px 12px rgba(255, 255, 255, 0.4)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                position: "relative",
              }}
            >
              {/* Cloud Fluff Overlaps */}
              <div style={{ position: "absolute", top: "-28%", left: "15%", width: "42%", height: "65%", borderRadius: "50%", background: "inherit", borderTop: "1.5px solid rgba(255,255,255,0.35)", backdropFilter: "inherit" }} />
              <div style={{ position: "absolute", top: "-40%", left: "44%", width: "38%", height: "58%", borderRadius: "50%", background: "inherit", borderTop: "1.5px solid rgba(255,255,255,0.35)", backdropFilter: "inherit" }} />
              
              <span style={{ fontSize: 32, zIndex: 5, filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.15))" }}>{c.face}</span>
            </motion.div>
          </div>
        );
      })}

      {/* Swirling Butterfly swarm */}
      {bts.map(b => (
        <motion.div key={b.id}
          initial={{ x: `${b.x}vw`, y: `${b.y}vh`, opacity: 1, scale: 0.6, rotate: 0 }}
          animate={{ 
            x: `calc(${b.x}vw + ${b.bx}px)`, 
            y: `calc(${b.y}vh + ${b.by}px)`, 
            opacity: 0, 
            rotate: [0, 15, -15, 360],
            scale: [0.6, 1.2, 0.4]
          }}
          transition={{ duration: 1.8, ease: "easeOut" }}
          style={{ position: "absolute", top: 0, left: 0, fontSize: 26, pointerEvents: "none", zIndex: 8 }}>
          🦋
        </motion.div>
      ))}

      {/* Floating Compliment paper */}
      <AnimatePresence>
        {msg && (
          <motion.div key={msg}
            initial={{ opacity: 0, y: 25, scale: .92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -25, scale: 0.92 }}
            className="paper"
            style={{ 
              position: "absolute", 
              bottom: "28%", 
              left: "50%", 
              transform: "translateX(-50%)", 
              padding: "18px 30px", 
              borderRadius: 16, 
              boxShadow: "0 10px 30px rgba(0,0,0,0.22)", 
              fontFamily: "'Caveat', cursive", 
              fontSize: 22, 
              color: "#381a4b", 
              textAlign: "center", 
              maxWidth: "76vw",
              background: "#fffdf9",
              border: "1px dashed #d8b4fe",
              zIndex: 5,
            }}
          >
            {msg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Dot progress indicator */}
      <div style={{ position: "absolute", bottom: "17%", left: "50%", transform: "translateX(-50%)", display: "flex", gap: 10, zIndex: 3 }}>
        {CLOUDS_DATA.map(c => (
          <div key={c.id} style={{ width: 8, height: 8, borderRadius: "50%", background: burst.has(c.id) ? "#d8b4fe" : "rgba(255,255,255,0.25)", transition: "background .4s" }} />
        ))}
      </div>

      {showNext && (
        <div style={{ position: "absolute", bottom: "8%", left: "50%", transform: "translateX(-50%)", zIndex: 3 }}>
          <PageTab onClick={onNext} label="Step into the room →" pos="center" />
        </div>
      )}
      <ChLabel text="Chapter II · Dream Cloud Garden" />
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
//  CHAPTER 4 · Sayani's Little Room
// ═════════════════════════════════════════════════════════════════════════════
const POLARS = [
  { id: 0, x: 14, y: 12, rot: -6, caption: "that afternoon that lasted forever", shade: "#fce8f0", img: sayani1 },
  { id: 1, x: 43, y: 7, rot: 3, caption: "the café with the wobbly chair", shade: "#f0e8fc", img: sayani3 },
  { id: 2, x: 68, y: 14, rot: -4, caption: "when you laughed and forgot to be sad", shade: "#e8f0fc", img: sayani2 },
];

function Ch4({ onNext, memory, setMemory }: { onNext: () => void; memory: Memory; setMemory: React.Dispatch<React.SetStateAction<Memory>> }) {
  const [developed, setDeveloped] = useState<Set<number>>(new Set());
  const [catPurring, setCatPurring] = useState(false);
  const [watered, setWatered] = useState(false);
  const [isWatering, setIsWatering] = useState(false);
  const [zoomPolaroid, setZoomPolaroid] = useState<number | null>(null);
  const [showNext, setShowNext] = useState(false);

  const devPolaroid = (id: number) => {
    if (!developed.has(id)) {
      const next = new Set(developed).add(id);
      setDeveloped(next);
      if (next.size >= 2) setTimeout(() => setShowNext(true), 600);
    } else {
      // If already developed, zoom in on click
      setZoomPolaroid(id);
    }
  };

  const petCat = () => {
    setCatPurring(true);
    setMemory(m => ({ ...m, pettedCat: true }));
    setTimeout(() => setCatPurring(false), 2200);
  };

  const waterPlant = () => {
    if (isWatering || watered) return;
    setIsWatering(true);
    setTimeout(() => {
      setWatered(true);
      setIsWatering(false);
      setMemory(m => ({ ...m, wateredFlowers: true }));
    }, 1400);
  };

  return (
    <div style={{
      width: "100vw", height: "100vh",
      background: "linear-gradient(180deg, #ebdcd6 0%, #dec8c0 100%)",
      position: "relative", overflow: "hidden", fontFamily: "'Caveat', cursive",
    }}>
      {/* Wall Panel Pattern (subtle vertical wallpaper stripes) */}
      <div style={{
        position: "absolute",
        inset: 0,
        backgroundImage: "linear-gradient(to right, rgba(0,0,0,0.015) 50%, transparent 50%)",
        backgroundSize: "20px 100%",
        pointerEvents: "none",
      }} />

      {/* Dual Tone Lighting: Fireplace Warmth Overlay (Left) */}
      <div style={{
        position: "absolute",
        inset: 0,
        background: "radial-gradient(circle at 10% 80%, rgba(249, 115, 22, 0.16) 0%, rgba(249, 115, 22, 0.04) 50%, transparent 80%)",
        pointerEvents: "none",
        mixBlendMode: "screen",
        zIndex: 2,
      }} />

      {/* Dual Tone Lighting: Cool Moonlight Beam Overlay (Right) */}
      <div style={{
        position: "absolute",
        inset: 0,
        background: "linear-gradient(135deg, transparent 40%, rgba(186, 230, 253, 0.12) 80%, rgba(186, 230, 253, 0.22) 100%)",
        pointerEvents: "none",
        zIndex: 2,
      }} />

      {/* Polished Hardwood Floor */}
      <div style={{ 
        position: "absolute", 
        bottom: 0, 
        left: 0, 
        right: 0, 
        height: "18%", 
        background: "linear-gradient(180deg, #7c4f30 0%, #4f2d18 100%)",
        boxShadow: "inset 0 6px 15px rgba(0,0,0,0.65)",
        zIndex: 2,
      }}>
        {/* Planks reflection/seams */}
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: "rgba(255,255,255,0.08)" }} />
        {Array.from({ length: 8 }, (_, i) => (
          <div key={i} style={{ position: "absolute", left: `${i * 12.5}%`, top: 0, bottom: 0, width: 1, background: "rgba(0,0,0,0.15)" }} />
        ))}
      </div>

      {/* Wood Baseboard */}
      <div style={{
        position: "absolute",
        bottom: "18%",
        left: 0,
        right: 0,
        height: 10,
        background: "linear-gradient(to bottom, #59351e 0%, #3b1f10 100%)",
        boxShadow: "0 2px 4px rgba(0,0,0,0.15)",
        zIndex: 2,
      }} />

      {/* Scenic Arched Window with Moonlight & Curtains */}
      <div style={{
        position: "absolute", right: "7%", top: "8%",
        width: 130, height: 172,
        border: "7px solid #4a2815",
        borderRadius: "65px 65px 4px 4px",
        background: "linear-gradient(to bottom, #060810 0%, #0d1120 60%, #1c182c 100%)",
        boxShadow: "inset 0 0 15px rgba(0,0,0,0.85), 0 6px 20px rgba(0,0,0,0.3)",
        overflow: "hidden",
        zIndex: 2,
      }}>
        {/* Soft landscape horizon silhouette */}
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 28, background: "#030406" }} />
        <div style={{ position: "absolute", left: "50%", top: 0, bottom: 0, width: 4, background: "#4a2815", transform: "translateX(-50%)" }} />
        <div style={{ position: "absolute", top: "50%", left: 0, right: 0, height: 4, background: "#4a2815", transform: "translateY(-50%)" }} />
        
        {/* Glowing Full Moon */}
        <div style={{
          position: "absolute",
          top: "22%",
          left: "24%",
          width: 26,
          height: 26,
          borderRadius: "50%",
          background: "#fffde7",
          boxShadow: "0 0 15px #fffde7, 0 0 30px rgba(255,253,231,0.6)",
        }} />

        {/* Twinkling stars */}
        {RAIN.slice(0, 10).map(d => (
          <div key={d.id} style={{
            position: "absolute", left: `${d.x}%`, top: `${Math.abs(d.y) * 0.7}%`,
            width: 1.8, height: 1.8, background: "#fff",
            opacity: 0.55,
            animation: "twinkle 2.5s infinite alternate",
            animationDelay: `${d.delay}s`
          }} />
        ))}
      </div>

      {/* Swaying Window Curtain lace */}
      <motion.div 
        animate={{ rotate: [0, 2, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        style={{
          position: "absolute",
          right: "6%",
          top: "7%",
          width: 42,
          height: 176,
          background: "linear-gradient(90deg, rgba(255,255,255,0.12), rgba(255,255,255,0.03))",
          borderLeft: "1px dashed rgba(255,255,255,0.25)",
          borderRadius: "0 0 0 20px",
          transformOrigin: "top right",
          zIndex: 3,
          pointerEvents: "none",
        }}
      />

      {/* Brick Fireplace (Left Wall) */}
      <div style={{
        position: "absolute",
        left: 0,
        bottom: "16%",
        width: 120,
        height: 180,
        background: "linear-gradient(135deg, #4b3621 0%, #36220f 100%)",
        borderRadius: "0 16px 16px 0",
        borderRight: "8px solid #5a3825",
        boxShadow: "5px 10px 25px rgba(0,0,0,0.5)",
        zIndex: 3,
        padding: "35px 10px 0 0",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}>
        {/* Mantel top */}
        <div style={{ position: "absolute", top: 12, left: 0, right: -6, height: 14, background: "#6b4226", borderRadius: "0 4px 4px 0", boxShadow: "0 3px 6px rgba(0,0,0,0.4)" }} />
        
        {/* Firebox cavity */}
        <div style={{
          width: 78,
          height: 95,
          background: "#1c120c",
          borderRadius: "12px 12px 0 0",
          boxShadow: "inset 0 4px 12px rgba(0,0,0,0.85)",
          position: "relative",
          overflow: "hidden",
          marginTop: 15,
          border: "4px solid #2d1e15",
        }}>
          {/* Glowing Coals */}
          <div style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: 24,
            background: "radial-gradient(ellipse at center, #ea580c 0%, #7c2d12 70%, #000 100%)",
            boxShadow: "0 -2px 10px #ea580c",
          }} />

          {/* Dancing Flames */}
          {Array.from({ length: 4 }, (_, i) => (
            <motion.div
              key={i}
              animate={{ 
                scaleY: [1, 1.4, 0.9, 1.25, 1],
                scaleX: [1, 0.85, 1.1, 0.9, 1],
                y: [0, -4, 2, 0]
              }}
              transition={{ duration: 0.15 + i * 0.04, repeat: Infinity, ease: "linear" }}
              style={{
                position: "absolute",
                bottom: 6,
                left: `${18 + i * 14}px`,
                width: 14,
                height: 38,
                borderRadius: "50% 50% 30% 30%",
                background: `radial-gradient(circle at center, #ffffff 10%, #f97316 55%, #dc2626 100%)`,
                boxShadow: "0 0 10px #f97316, 0 0 18px #dc2626",
                transformOrigin: "bottom center",
                mixBlendMode: "screen",
              }}
            />
          ))}
        </div>
      </div>

      {/* Fairy Lights String */}
      <div style={{ position: "absolute", top: "4%", left: "2%", right: "2%", height: 35, zIndex: 3, pointerEvents: "none" }}>
        <svg width="100%" height="100%" viewBox="0 0 1000 30" preserveAspectRatio="none" style={{ position: "absolute", top: 0, left: 0 }}>
          <path d="M 0 10 Q 125 35, 250 15 Q 375 35, 500 15 Q 625 35, 750 15 Q 875 35, 1000 10" fill="none" stroke="#5a3820" strokeWidth="1.5" />
        </svg>
        {Array.from({ length: 14 }, (_, i) => (
          <div key={i} style={{
            position: "absolute",
            left: `${3.5 + i * 7.1}%`,
            top: `${14 + Math.sin(i * 1.4) * 4}px`,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}>
            <div style={{ width: 1.5, height: 7, background: "#5a3820" }} />
            <div style={{
              width: 8, height: 11,
              borderRadius: "50% 50% 50% 50% / 60% 60% 40% 40%",
              background: ["#fff176", "#f8bbd0", "#e1bee7", "#b2dfdb", "#bbdefb"][i % 5],
              boxShadow: `0 0 10px ${["#fbc02d", "#ec407a", "#ab47bc", "#26a69a", "#29b6f6"][i % 5]}`,
              animation: "glowPulse 3s infinite ease-in-out",
              animationDelay: `${i * 0.22}s`,
            }} />
          </div>
        ))}
      </div>

      {/* Cozy Hanging Bookshelf */}
      <div style={{ position: "absolute", right: "6%", top: "14%", width: 95, height: 110, zIndex: 3 }}>
        {/* Wood Board */}
        <div style={{ position: "absolute", bottom: 12, left: 0, right: 0, height: 8, background: "#6b4226", borderRadius: 2, boxShadow: "0 4px 6px rgba(0,0,0,0.3)" }} />
        
        {/* Shaded Vintage Books */}
        <div style={{ position: "absolute", bottom: 20, left: 12, width: 14, height: 55, background: "#a52a2a", borderLeft: "3px solid #7c1c1c", borderRadius: "2px 2px 0 0", boxShadow: "1px 0 3px rgba(0,0,0,0.2)", transform: "rotate(-6deg)" }} />
        <div style={{ position: "absolute", bottom: 20, left: 24, width: 12, height: 62, background: "#0284c7", borderLeft: "3px solid #0369a1", borderRadius: "2px 2px 0 0", boxShadow: "1px 0 3px rgba(0,0,0,0.2)" }} />
        <div style={{ position: "absolute", bottom: 20, left: 38, width: 15, height: 50, background: "#059669", borderLeft: "3px solid #047857", borderRadius: "2px 2px 0 0", boxShadow: "1px 0 3px rgba(0,0,0,0.2)", transform: "rotate(4deg)" }} />
        <div style={{ position: "absolute", bottom: 20, left: 54, width: 13, height: 58, background: "#d97706", borderLeft: "3px solid #b45309", borderRadius: "2px 2px 0 0", boxShadow: "1px 0 3px rgba(0,0,0,0.2)" }} />

        {/* Hanging vine leaf */}
        <div style={{ position: "absolute", bottom: -8, right: 10, fontSize: 13, opacity: 0.85, animation: "sway 4s infinite alternate ease-in-out" }}>🌿</div>
      </div>

      {/* Polaroids hanging from string pins */}
      {POLARS.map(p => {
        const isDeveloped = developed.has(p.id);
        return (
          <div key={p.id} style={{ position: "absolute", left: `${p.x}%`, top: `${p.y + 6}%`, zIndex: 3 }}>
            {/* Black string line */}
            <div style={{ width: 1.5, height: 26, background: "#4a3525", margin: "0 auto" }} />
            
            {/* Cute Clothespin */}
            <div style={{ 
              width: 8, height: 14, 
              background: "#d97706", 
              border: "1px solid #b45309",
              margin: "0 auto -5px", 
              borderRadius: 1.5, 
              position: "relative", 
              zIndex: 4,
              boxShadow: "0 2px 4px rgba(0,0,0,0.2)"
            }} />

            {/* Polaroid Card */}
            <motion.div 
              onClick={() => devPolaroid(p.id)} 
              whileHover={{ scale: 1.05, y: -4, rotate: p.rot * 0.8 }}
              style={{
                width: 116, height: 136,
                background: isDeveloped ? p.shade : "#FAF4E8",
                border: "1px solid rgba(0,0,0,0.06)",
                transform: `rotate(${p.rot}deg)`,
                boxShadow: "4px 6px 20px rgba(0,0,0,0.22)",
                cursor: "pointer", borderRadius: 2,
                display: "flex", flexDirection: "column", alignItems: "center", padding: "10px 10px 22px",
                animation: isDeveloped ? "polarDev 1.5s ease-out forwards" : undefined,
                transition: "box-shadow 0.3s ease",
              }}
            >
              <div style={{ 
                width: "100%", 
                flex: 1, 
                background: isDeveloped ? `url(${p.img}) center/cover no-repeat` : "#d4c8c4", 
                borderRadius: 1, 
                display: "flex", 
                alignItems: "center", 
                justifyContent: "center", 
                fontSize: 28,
                transition: "background 1.2s ease",
              }}>
                {!isDeveloped && "📷"}
              </div>
              {isDeveloped && (
                <div style={{ fontFamily: "'Caveat', cursive", fontSize: 11, color: "#4a3028", marginTop: 6, textAlign: "center", lineHeight: 1.3 }}>{p.caption}</div>
              )}
            </motion.div>
          </div>
        );
      })}

      {/* Boho Patterned Area Rug under Kitten */}
      <div style={{
        position: "absolute",
        right: "6%",
        bottom: "-1%",
        width: 180,
        height: 60,
        borderRadius: "50%",
        background: "radial-gradient(circle, #ea580c 0%, #b45309 60%, #451a03 100%)",
        border: "3.5px dashed #fef3c7",
        boxShadow: "0 6px 12px rgba(0,0,0,0.45)",
        zIndex: 2,
        opacity: 0.9,
      }} />

      {/* Cozy Plant & Copper Watering Can (left) */}
      <div style={{ position: "absolute", left: "14%", bottom: "21%", zIndex: 3 }}>
        <div onClick={waterPlant} style={{ cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center" }}>
          <div style={{ fontSize: 13, color: "#fef3c7", textAlign: "center", marginBottom: 3, textShadow: "0 2px 4px rgba(0,0,0,0.4)" }}>
            {watered ? "🌿 green & happy!" : "🌱 water me?"}
          </div>
          {/* Terracotta Pot */}
          <svg width="56" height="70" viewBox="0 0 56 70" style={{ filter: "drop-shadow(0 4px 6px rgba(0,0,0,0.35))" }}>
            <polygon points="18,44 42,44 38,68 22,68" fill="#d97706" stroke="#b45309" strokeWidth="1" />
            <rect x="15" y="38" width="30" height="6" rx="1.5" fill="#d97706" stroke="#b45309" strokeWidth="1" />
            {watered ? (
              <>
                <ellipse cx="28" cy="22" rx="18" ry="11" fill="#15803d" />
                <ellipse cx="14" cy="29" rx="13" ry="7" fill="#16a34a" transform="rotate(-25 14 29)" />
                <ellipse cx="42" cy="29" rx="13" ry="7" fill="#22c55e" transform="rotate(25 42 29)" />
                <circle cx="28" cy="12" r="9" fill="#4ade80" />
              </>
            ) : (
              <>
                <ellipse cx="28" cy="26" rx="11" ry="8" fill="#166534" opacity="0.85" />
                <ellipse cx="18" cy="31" rx="9" ry="5" fill="#15803d" transform="rotate(-20 18 31)" opacity="0.85" />
                <ellipse cx="38" cy="31" rx="9" ry="5" fill="#16a34a" transform="rotate(20 38 31)" opacity="0.85" />
              </>
            )}
          </svg>
        </div>

        {/* Copper Watering Can next to pot */}
        <motion.div
          animate={isWatering ? {
            y: [-10, -32, -32, -10],
            x: [15, -10, -10, 15],
            rotate: [0, -35, -35, 0],
          } : { y: 0, x: 22, rotate: 0 }}
          transition={{ duration: 1.4, ease: "easeInOut" }}
          onClick={waterPlant}
          style={{
            position: "absolute",
            bottom: 0,
            cursor: "pointer",
            width: 40,
            height: 30,
            zIndex: 4,
          }}
        >
          <svg width="40" height="30" viewBox="0 0 40 30" style={{ filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.3))" }}>
            {/* Can Body */}
            <path d="M12 10 L28 10 L26 26 L14 26 Z" fill="#b45309" stroke="#78350f" strokeWidth="1" />
            {/* Spout */}
            <path d="M12 18 L2 12 L2 15 L12 21" fill="#b45309" stroke="#78350f" strokeWidth="1" />
            {/* Handle */}
            <path d="M28 14 C34 14, 34 22, 28 22" stroke="#b45309" strokeWidth="2.5" fill="none" />
            {/* Top Loop Handle */}
            <path d="M16 10 C16 4, 24 4, 24 10" stroke="#b45309" strokeWidth="2" fill="none" />
          </svg>

          {/* Water drops during animation */}
          {isWatering && (
            <div style={{ position: "absolute", top: 12, left: -6 }}>
              {[0, 0.3, 0.6].map((d, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 1, y: 0, x: 0 }}
                  animate={{ opacity: 0, y: 22, x: -8 }}
                  transition={{ duration: 0.6, repeat: 2, delay: d }}
                  style={{
                    position: "absolute",
                    width: 3.5,
                    height: 6,
                    borderRadius: "50%",
                    background: "#38bdf8",
                  }}
                />
              ))}
            </div>
          )}
        </motion.div>
      </div>

      {/* Sleeping/Petting Cat (right, resting on Boho Rug) */}
      <div onClick={petCat} style={{ position: "absolute", right: "10%", bottom: "4%", cursor: "pointer", zIndex: 3 }}>
        <div style={{ fontFamily: "'Caveat', cursive", fontSize: 13, color: "#fef3c7", textAlign: "center", marginBottom: 3, textShadow: "0 2px 4px rgba(0,0,0,0.4)" }}>
          {catPurring ? "purrrr~ 💕" : memory.pettedCat ? "sleeping 💤" : "pet me?"}
        </div>
        <div style={{ position: "relative" }}>
          {/* Pulsing breathing animation */}
          <motion.div
            animate={{ scaleY: catPurring ? [1, 1.05, 1] : [1, 1.03, 1] }}
            transition={{ duration: catPurring ? 1.2 : 2.5, repeat: Infinity, ease: "easeInOut" }}
          >
            <svg width="68" height="52" viewBox="0 0 68 52" style={{ filter: "drop-shadow(0 4px 6px rgba(0,0,0,0.3))" }}>
              <ellipse cx="34" cy="36" rx="24" ry="14" fill="#a78bfa" />
              <circle cx="34" cy="20" r="13" fill="#a78bfa" />
              <polygon points="23,12 18,3 27,12" fill="#a78bfa" />
              <polygon points="45,12 50,3 41,12" fill="#a78bfa" />
              <path d="M26 21 Q29 24 32 21" stroke="#312e81" strokeWidth="1.5" fill="none" />
              <path d="M36 21 Q39 24 42 21" stroke="#312e81" strokeWidth="1.5" fill="none" />
              <polygon points="33,24 35,24 34,25.5" fill="#f43f5e" />
              <path d="M54 38 C64 35, 60 48, 52 46 C48 45, 46 41, 48 38" stroke="#a78bfa" strokeWidth="6" fill="none" strokeLinecap="round"
                style={{ transformOrigin: "50px 38px", animation: catPurring ? "catTail 1s ease-in-out infinite" : undefined }} />
            </svg>
          </motion.div>
          
          {/* Floating hearts */}
          {catPurring && (
            <motion.div
              initial={{ opacity: 1, y: 0, scale: 0.5 }}
              animate={{ opacity: 0, y: -45, scale: 1.3 }}
              transition={{ duration: 1.5 }}
              style={{ position: "absolute", top: -15, left: 24, fontSize: 18, pointerEvents: "none" }}
            >
              💖
            </motion.div>
          )}
        </div>
      </div>

      {/* Flickering Candle on Floor */}
      <div style={{ position: "absolute", right: "26%", bottom: "17%", zIndex: 3 }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          <motion.div 
            animate={{ scaleY: [1, 1.2, 0.9, 1.15, 1], scaleX: [1, 0.9, 1.1, 0.95, 1], y: [0, -1, 0.5, 0] }}
            transition={{ duration: 0.16, repeat: Infinity, ease: "linear" }}
            style={{
              width: 6,
              height: 12,
              borderRadius: "50% 50% 35% 35%",
              background: "radial-gradient(circle at center, #ffffff 20%, #f59e0b 70%, #ef4444 100%)",
              boxShadow: "0 0 8px #f59e0b, 0 0 16px #ef4444",
              marginBottom: -1,
            }}
          />
          <div style={{
            width: 10,
            height: 22,
            background: "linear-gradient(90deg, #fef3c7, #fde68a, #fcd34d)",
            borderRadius: 1.5,
            boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
          }} />
        </div>
      </div>

      {/* Polaroid Zoom Lightbox Overlay */}
      <AnimatePresence>
        {zoomPolaroid !== null && (() => {
          const p = POLARS.find(x => x.id === zoomPolaroid);
          if (!p) return null;
          return (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setZoomPolaroid(null)}
              style={{
                position: "fixed",
                inset: 0,
                background: "rgba(15, 10, 25, 0.8)",
                backdropFilter: "blur(8px)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 1000,
                cursor: "zoom-out",
              }}
            >
              <motion.div
                initial={{ scale: 0.85, y: 30, rotate: -2 }}
                animate={{ scale: 1.0, y: 0, rotate: 0 }}
                exit={{ scale: 0.85, y: 30, rotate: 2 }}
                transition={{ type: "spring", damping: 25, stiffness: 220 }}
                onClick={(e) => e.stopPropagation()}
                style={{
                  width: 320,
                  height: 380,
                  background: p.shade,
                  borderRadius: 6,
                  padding: "16px 16px 35px",
                  boxShadow: "0 20px 50px rgba(0,0,0,0.65)",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  border: "1px solid rgba(255,255,255,0.15)",
                }}
              >
                {/* Image */}
                <div style={{
                  width: "100%",
                  flex: 1,
                  background: `url(${p.img}) center/cover no-repeat`,
                  borderRadius: 3,
                  boxShadow: "inset 0 0 10px rgba(0,0,0,0.1)",
                }} />
                {/* Handwritten Memory */}
                <div style={{
                  fontFamily: "'Cormorant Garamond', serif",
                  fontSize: 18,
                  fontStyle: "italic",
                  fontWeight: "bold",
                  color: "#3f2d20",
                  marginTop: 18,
                  textAlign: "center",
                  lineHeight: 1.4,
                  letterSpacing: 0.5,
                  padding: "0 10px",
                }}>
                  “{p.caption}”
                </div>
                {/* Close instruction */}
                <div style={{
                  fontFamily: "'Caveat', cursive",
                  fontSize: 13,
                  color: "rgba(63,45,32,0.5)",
                  marginTop: 12,
                }}>
                  click anywhere to close
                </div>
              </motion.div>
            </motion.div>
          );
        })()}
      </AnimatePresence>

      {showNext && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ position: "absolute", bottom: "5%", right: "6%", zIndex: 3 }}>
          <PageTab onClick={onNext} label="Open the box →" />
        </motion.div>
      )}
      <ChLabel text="Chapter III · Sayani's Little Room" />
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
      <ChLabel text="Chapter IV · The Keepsake Box" />
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
  const [capsuleColor, setCapsuleColor] = useState("#ffd700");
  const cid = useRef(0);

  const colors = ["#ffb3ba", "#baffc9", "#bae1ff", "#ffffba", "#ffdfba", "#e8c4ff"];

  const turnHandle = () => {
    if (state !== "idle") return;
    setState("turning");
    const chosenColor = colors[Math.floor(Math.random() * colors.length)];
    setCapsuleColor(chosenColor);

    setTimeout(() => {
      setState("dropping");
      setTimeout(() => {
        setState("open");
        setPrize(GACHA_PRIZES[Math.floor(Math.random() * GACHA_PRIZES.length)]);
        const newConf: ConfEl[] = Array.from({ length: 25 }, () => ({
          id: cid.current++,
          x: 40 + Math.random() * 20,
          col: ["#ffd700", "#ffb3ba", "#bae1ff", "#ffffff", "#ffdfba"][Math.floor(Math.random() * 5)],
          rot: (Math.random() - .5) * 360,
        }));
        setConf(newConf);
        setTimeout(() => setConf([]), 1400);
      }, 1100);
    }, 900);
  };

  const reset = () => {
    setState("idle");
    setPrize(null);
    setPlays(p => p + 1);
  };

  return (
    <div style={{
      width: "100vw", height: "100vh",
      background: "radial-gradient(circle at 50% 35%, #2a201c 0%, #150f0d 100%)",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      fontFamily: "'Caveat', cursive", position: "relative", overflow: "hidden",
    }} className="gacha-chapter">
      
      {/* Warm Ambient Lamp Light */}
      <div style={{
        position: "absolute",
        top: -100,
        right: "-10%",
        width: 500,
        height: 500,
        background: "radial-gradient(circle, rgba(253, 186, 116, 0.15) 0%, rgba(253, 186, 116, 0) 70%)",
        pointerEvents: "none",
        zIndex: 1,
      }} />

      {/* Floating Sparkles in air */}
      {["✦","✦","✦","✦","✦"].map((s, i) => (
        <div key={i} style={{
          position: "absolute",
          fontSize: 16,
          color: "#fde047",
          left: `${15 + i * 18}%`,
          top: `${20 + (i % 2) * 30}%`,
          opacity: 0.35,
          animation: `twinkle ${2.5 + i * 0.5}s ease-in-out infinite`,
        }}>{s}</div>
      ))}

      {/* Chapter Title */}
      <div style={{
        position: "absolute",
        top: "6%",
        fontFamily: "'Cormorant Garamond', serif",
        fontSize: 22,
        color: "#cbb39e",
        letterSpacing: 2,
        fontStyle: "italic",
        opacity: 0.85,
        zIndex: 5,
      }}>
        Chapter V · Gacha of Tiny Joy
      </div>

      {/* Wooden Desk Surface */}
      <div style={{
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        height: "28vh",
        background: "linear-gradient(180deg, #442a1d 0%, #291810 100%)",
        borderTop: "6px solid #583929",
        boxShadow: "0 -8px 30px rgba(0,0,0,0.6)",
        zIndex: 2,
      }}>
        {/* Soft shadow cast by the machine */}
        <div style={{
          position: "absolute",
          top: 0,
          left: "50%",
          transform: "translateX(-50%)",
          width: 280,
          height: 35,
          background: "radial-gradient(ellipse at center, rgba(0,0,0,0.6) 0%, transparent 80%)",
        }} />
      </div>

      {/* Cozy Desk Accessories (Plant, cup) */}
      <div style={{ position: "absolute", bottom: "16vh", left: "10%", display: "flex", gap: 30, zIndex: 3, opacity: 0.85 }}>
        {/* Mini Flower Pot */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          <div style={{ fontSize: 24, transform: "scaleX(-1)", marginBottom: -4 }}>🌱</div>
          <div style={{ width: 22, height: 18, background: "#8c6239", borderRadius: "0 0 8px 8px", border: "2px solid #5c3f24" }} />
        </div>
      </div>
      <div style={{ position: "absolute", bottom: "16vh", right: "12%", zIndex: 3, opacity: 0.85 }}>
        {/* Ornate Brass Lamp silhouette */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          <div style={{ width: 40, height: 26, background: "#eab308", borderRadius: "30px 30px 0 0", boxShadow: "0 0 15px rgba(234,179,8,0.7)", border: "2px solid #ca8a04" }} />
          <div style={{ width: 4, height: 35, background: "#ca8a04" }} />
          <div style={{ width: 28, height: 6, background: "#ca8a04", borderRadius: 3 }} />
        </div>
      </div>

      {/* Main Gacha Machine Container */}
      <div style={{ position: "relative", zIndex: 4, top: "-3vh" }}>
        
        {/* Cute Bunny Sign on Top */}
        <motion.div 
          animate={{ y: [0, -4, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          style={{ fontSize: 34, textAlign: "center", marginBottom: -10, filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.3))" }}
        >
          🐰
        </motion.div>

        {/* Machine Body */}
        <div style={{
          width: 210,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}>
          {/* Glass Globe */}
          <div style={{
            position: "relative",
            width: 176,
            height: 176,
            borderRadius: "50%",
            background: "radial-gradient(circle at 30% 30%, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0.03) 60%, rgba(0,0,0,0.25) 100%)",
            border: "5px solid rgba(245, 158, 11, 0.45)",
            boxShadow: "inset 0 10px 30px rgba(255,255,255,0.15), 0 8px 24px rgba(0,0,0,0.5)",
            overflow: "hidden",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}>
            {/* Glossy Reflection Arc */}
            <div style={{
              position: "absolute",
              top: 10,
              left: 18,
              width: 140,
              height: 70,
              borderRadius: "140px 140px 0 0",
              background: "linear-gradient(180deg, rgba(255,255,255,0.28) 0%, transparent 100%)",
              transform: "rotate(-15deg)",
              pointerEvents: "none",
            }} />

            {/* Capsules inside globe */}
            {[[34,44,"#ffb3ba",-10],[88,32,"#bae1ff",12],[126,52,"#baffc9",-18],[42,88,"#ffffba",22],[84,94,"#ffdfba",-5],[128,96,"#e8c4ff",15]].map(([cx, cy, col, rot], i) => (
              <motion.div
                key={i}
                animate={state === "turning" ? {
                  x: [0, (Math.random() - 0.5) * 16, 0],
                  y: [0, (Math.random() - 0.5) * 16, 0],
                  rotate: [rot, rot + 45, rot],
                } : {
                  y: [0, -3, 0],
                }}
                transition={state === "turning" ? { duration: 0.8, ease: "easeInOut" } : { duration: 2.5 + i * 0.4, repeat: Infinity, ease: "easeInOut" }}
                style={{
                  position: "absolute",
                  left: cx,
                  top: cy,
                  width: 34,
                  height: 28,
                  borderRadius: "50%",
                  background: `linear-gradient(135deg, ${col} 40%, rgba(0,0,0,0.2) 100%)`,
                  border: "1px solid rgba(255,255,255,0.3)",
                  boxShadow: "inset 0 4px 6px rgba(255,255,255,0.4), 0 3px 6px rgba(0,0,0,0.3)",
                  transform: `rotate(${rot}deg)`,
                }}
              />
            ))}
          </div>

          {/* Machine Metal Collar */}
          <div style={{
            width: 110,
            height: 12,
            background: "linear-gradient(90deg, #d97706, #f59e0b, #b45309)",
            borderRadius: "4px 4px 0 0",
            boxShadow: "0 2px 4px rgba(0,0,0,0.3)",
            marginTop: -6,
            zIndex: 3,
          }} />

          {/* Terracotta/Brass Base Panel */}
          <div style={{
            width: 142,
            height: 98,
            background: "linear-gradient(135deg, #d97706 0%, #92400e 100%)",
            borderRadius: "0 0 16px 16px",
            boxShadow: "inset 0 4px 10px rgba(255,255,255,0.25), 0 8px 20px rgba(0,0,0,0.45)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            padding: "8px 10px",
            border: "1px solid #78350f",
            position: "relative",
            zIndex: 2,
          }}>
            
            {/* Ornate Gold Label Panel */}
            <div style={{
              width: 90,
              height: 22,
              background: "linear-gradient(180deg, #fef08a 0%, #ca8a04 100%)",
              border: "1px solid #854d0e",
              borderRadius: 4,
              boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: 12,
              fontWeight: "bold",
              color: "#422006",
              letterSpacing: 1.5,
              textTransform: "uppercase",
            }}>
              ガチャ ✦ JOY
            </div>

            {/* Brass Twist Turn-Handle */}
            <div style={{ position: "relative", marginTop: 12, width: 44, height: 44, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <motion.div
                animate={state === "turning" ? { rotate: 360 } : {}}
                transition={{ duration: 0.9, ease: "easeInOut" }}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  background: "radial-gradient(circle, #fef08a 0%, #a16207 100%)",
                  boxShadow: "0 2px 5px rgba(0,0,0,0.4)",
                  cursor: state === "idle" ? "pointer" : "default",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  border: "2px solid #854d0e",
                }}
                onClick={turnHandle}
              >
                {/* Cross bars of the turn knob */}
                <div style={{ position: "absolute", width: 22, height: 4, background: "#713f12" }} />
                <div style={{ position: "absolute", width: 4, height: 22, background: "#713f12" }} />
              </motion.div>
            </div>

            {/* Coin Slot */}
            <div style={{ position: "absolute", right: 12, top: 38, width: 6, height: 16, background: "#451a03", borderRadius: 1 }} />

            {/* Capsule Tray Chute (Where capsule drops out) */}
            <div style={{
              position: "absolute",
              bottom: -10,
              width: 58,
              height: 24,
              background: "#451a03",
              borderRadius: "10px 10px 0 0",
              boxShadow: "inset 0 3px 6px rgba(0,0,0,0.8)",
              overflow: "hidden",
            }}>
              {/* Soft reflection glow in tray */}
              <div style={{ width: "100%", height: 4, background: "rgba(255,255,255,0.15)" }} />
            </div>

          </div>
        </div>

        {/* Dropping Capsule Animation */}
        {state === "dropping" && (
          <motion.div
            initial={{ y: 220, x: 88, rotate: 0, scale: 0.4 }}
            animate={{
              y: 295,
              x: 88,
              scale: 1,
              rotate: [0, 45, 90],
            }}
            transition={{ duration: 0.65, ease: "easeIn" }}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: 34,
              height: 28,
              borderRadius: "50%",
              background: `linear-gradient(135deg, ${capsuleColor} 45%, rgba(0,0,0,0.2) 100%)`,
              boxShadow: "0 4px 10px rgba(0,0,0,0.4), inset 0 3px 5px rgba(255,255,255,0.4)",
              border: "1.5px solid rgba(255,255,255,0.3)",
              zIndex: 1,
            }}
          />
        )}

        {/* Opened Capsule on Desk (Click to show prize) */}
        {state === "open" && prize && (
          <motion.div
            initial={{ scale: 0.8, y: 295, x: 88 }}
            animate={{ scale: [1, 1.08, 1] }}
            transition={{ repeat: Infinity, duration: 1.6 }}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: 36,
              height: 30,
              borderRadius: "50%",
              background: `linear-gradient(135deg, ${capsuleColor} 45%, rgba(0,0,0,0.25) 100%)`,
              boxShadow: "0 0 15px rgba(253, 224, 71, 0.8), 0 5px 12px rgba(0,0,0,0.4)",
              border: "1.5px solid #fff",
              cursor: "pointer",
              zIndex: 3,
            }}
            onClick={reset}
          />
        )}

        {/* Confetti Explosion */}
        {conf.map(c => (
          <motion.div key={c.id}
            initial={{ y: 285, x: 105, scale: 0.8, opacity: 1 }}
            animate={{ y: 200 + (Math.random() - 0.5) * 120, x: 105 + c.x - 50 + (Math.random() - 0.5) * 120, rotate: c.rot, opacity: 0 }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            style={{ position: "absolute", top: 0, left: 0, width: 8, height: 8, background: c.col, borderRadius: 2, zIndex: 5 }} />
        ))}

      </div>

      {/* Interactive Trigger Button */}
      {state === "idle" && (
        <motion.button 
          initial={{ scale: .92, opacity: 0 }} 
          animate={{ scale: 1, opacity: 1 }} 
          whileHover={{ scale: 1.05 }}
          onClick={turnHandle}
          style={{
            marginTop: 40,
            background: "linear-gradient(135deg, #d97706 0%, #b45309 100%)",
            border: "1px solid #78350f",
            padding: "12px 36px",
            borderRadius: 30,
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: 17,
            letterSpacing: 2,
            textTransform: "uppercase",
            color: "#fef3c7",
            cursor: "pointer",
            boxShadow: "0 6px 20px rgba(0,0,0,0.35)",
            zIndex: 4,
          }}
        >
          {plays > 0 ? "turn again ✦" : "twist the handle ✦"}
        </motion.button>
      )}

      {/* Prize card Envelope Pop-up */}
      <AnimatePresence>
        {state === "open" && prize && (
          <motion.div 
            initial={{ opacity: 0, scale: .8, y: 40 }} 
            animate={{ opacity: 1, scale: 1, y: -20 }}
            exit={{ opacity: 0, scale: 0.8, y: 40 }}
            className="paper"
            style={{
              position: "absolute",
              zIndex: 10,
              padding: "24px 36px",
              borderRadius: 16,
              boxShadow: "0 15px 45px rgba(0,0,0,0.5)",
              textAlign: "center",
              maxWidth: 320,
              fontFamily: "'Caveat', cursive",
              fontSize: 22,
              color: "#3d2b1f",
              lineHeight: 1.5,
              background: "#fff9f0",
              border: "1px dashed #c4a482",
            }}
          >
            {/* Sparkly corner stars */}
            <div style={{ position: "absolute", top: 8, left: 10, fontSize: 13, opacity: 0.4 }}>✦</div>
            <div style={{ position: "absolute", bottom: 8, right: 10, fontSize: 13, opacity: 0.4 }}>✦</div>

            {prize}
            
            <div style={{ marginTop: 20, display: "flex", gap: 14, justifyContent: "center" }}>
              <button onClick={reset} style={{ background: "#efe1d1", border: "none", padding: "6px 18px", borderRadius: 20, fontFamily: "'Caveat', cursive", fontSize: 15, cursor: "pointer", color: "#654020", fontWeight: "bold" }}>another coin</button>
              <button onClick={onNext} style={{ background: "#7c3aed", border: "none", padding: "6px 18px", borderRadius: 20, fontFamily: "'Caveat', cursive", fontSize: 15, cursor: "pointer", color: "white", fontWeight: "bold" }}>to the stars →</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <ChLabel text="Chapter V · Gacha of Tiny Joy" />
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
  [6, 8], // Zosma → Denebola  (connected!)
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
      setTimeout(() => setShowNext(true), 2800);
    }
  }, [clicked, forming]);

  return (
    <div style={{
      width: "100vw", height: "100vh",
      background: "linear-gradient(to bottom, #070913 0%, #0d1222 55%, #1b172a 82%, #2d2033 100%)",
      position: "relative", overflow: "hidden", fontFamily: "'Caveat', cursive",
    }}>
      
      {/* Classic Serif "Leo" header in upper left */}
      <div style={{
        position: "absolute",
        left: "8%",
        top: "14%",
        fontFamily: "'Cormorant Garamond', serif",
        fontSize: 48,
        color: "rgba(255, 255, 255, 0.75)",
        letterSpacing: 2,
        pointerEvents: "none",
        zIndex: 4,
      }}>
        Leo
      </div>

      {/* Deep Space Nebulous dust */}
      <div style={{
        position: "absolute",
        inset: 0,
        background: "radial-gradient(ellipse 70% 50% at 50% 30%, rgba(139, 92, 246, 0.07) 0%, transparent 100%)",
        pointerEvents: "none",
      }} />

      {/* The Red Planet (Mars) */}
      <motion.div
        animate={{ opacity: [0.8, 1, 0.8] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        style={{
          position: "absolute",
          left: "52%",
          top: "64%",
          width: 8,
          height: 8,
          borderRadius: "50%",
          background: "radial-gradient(circle at center, #ffa07a 0%, #d35400 60%, #922b21 100%)",
          boxShadow: "0 0 12px rgba(211, 84, 0, 0.85), 0 0 24px rgba(211, 84, 0, 0.45)",
          transform: "translate(-50%, -50%)",
          pointerEvents: "none",
          zIndex: 8,
        }}
      />

      {/* Realistic Tree Line Silhouette with bottom amber highlight */}
      <div style={{
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        height: "24vh",
        pointerEvents: "none",
        zIndex: 5,
      }}>
        <svg 
          viewBox="0 0 1000 120" 
          preserveAspectRatio="none"
          style={{ width: "100%", height: "100%", display: "block" }}
        >
          <defs>
            <linearGradient id="tree-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#080a14" />
              <stop offset="100%" stopColor="#020306" />
            </linearGradient>
            <linearGradient id="glow-grad" x1="0" y1="1" x2="0" y2="0">
              <stop offset="0%" stopColor="rgba(234, 110, 8, 0.28)" />
              <stop offset="100%" stopColor="rgba(234, 110, 8, 0)" />
            </linearGradient>
          </defs>

          {/* Detailed background trees for depth */}
          <path 
            d="M0 120 L0 80 Q 20 70 40 85 T 80 75 T 120 90 T 160 80 T 200 95 T 240 75 T 280 85 T 320 70 T 360 80 T 400 65 T 440 85 T 480 75 T 520 90 T 560 70 T 600 85 T 640 60 T 680 80 T 720 70 T 760 90 T 800 75 T 840 85 T 880 65 T 920 80 T 960 70 T 1000 85 L1000 120 Z" 
            fill="#05060b" 
            opacity="0.4" 
          />

          {/* Foreground leafy and pine trees */}
          <path 
            d="M0 120 
               L0 85 
               /* Tree 1: Pine */
               L15 65 L20 72 L12 85 L25 80 L35 95 
               /* Tree 2: Leafy bush */
               Q50 75 65 78 T 80 85 T 100 90
               /* Tree 3: Tall Pine */
               L115 50 L122 62 L112 70 L128 65 L120 85 L135 80 L145 95
               /* Tree 4: Leafy */
               Q165 70 180 72 T 200 85 T 220 90
               /* Tree 5: Medium Pine */
               L230 68 L236 75 L228 82 L242 80 L238 92
               /* Trees 6-10: Detailed irregular canopy */
               Q260 70 280 65 T 310 75 T 340 80 T 370 70 T 400 85
               /* Tree 11: Tall Pine */
               L420 45 L428 58 L418 68 L435 62 L425 82 L445 78 L455 95
               /* Canopy */
               Q475 75 495 72 T 525 80 T 555 85 T 585 70 T 615 88
               /* Tree 12: Pine */
               L630 60 L637 70 L628 78 L642 75 L635 92
               /* Canopy */
               Q660 72 680 68 T 710 75 T 740 82 T 770 70 T 800 90
               /* Tree 13: Tall Pine */
               L815 48 L822 60 L812 68 L828 63 L820 83 L835 78 L845 95
               /* Canopy to end */
               Q865 72 885 75 T 915 80 T 945 72 T 975 85 T 1000 80 
               L1000 120 Z" 
            fill="url(#tree-grad)" 
          />

          {/* Warm Amber lights up the trees from below */}
          <path 
            d="M0 120 
               L0 85 
               L15 65 L20 72 L12 85 L25 80 L35 95 
               Q50 75 65 78 T 80 85 T 100 90
               L115 50 L122 62 L112 70 L128 65 L120 85 L135 80 L145 95
               Q165 70 180 72 T 200 85 T 220 90
               L230 68 L236 75 L228 82 L242 80 L238 92
               Q260 70 280 65 T 310 75 T 340 80 T 370 70 T 400 85
               L420 45 L428 58 L418 68 L435 62 L425 82 L445 78 L455 95
               Q475 75 495 72 T 525 80 T 555 85 T 585 70 T 615 88
               L630 60 L637 70 L628 78 L642 75 L635 92
               Q660 72 680 68 T 710 75 T 740 82 T 770 70 T 800 90
               L815 48 L822 60 L812 68 L828 63 L820 83 L835 78 L845 95
               Q865 72 885 75 T 915 80 T 945 72 T 975 85 T 1000 80 
               L1000 120 Z" 
            fill="url(#glow-grad)" 
            style={{ mixBlendMode: "screen" }}
          />
        </svg>
      </div>

      {/* Twinkling ambient stars in background */}
      {UNIVERSE_STARS.map(s => {
        const isInteractive = s.id < 8; // Only Leo stars are clickable
        if (isInteractive) return null;
        return (
          <div key={s.id} style={{
            position: "absolute",
            left: `${s.x}%`, top: `${s.y}%`,
            width: s.size * 0.6, height: s.size * 0.6,
            borderRadius: "50%",
            background: "rgba(255,255,255,0.65)",
            opacity: s.baseOpacity * 0.75,
            animation: `twinkle ${s.dur}s ease-in-out infinite`,
            animationDelay: `${s.delay}s`,
            pointerEvents: "none",
          }} />
        );
      })}

      {/* The Clickable Constellation Stars (Leo) */}
      {LEO_STARS.map(s => {
        const isClicked = clicked.has(s.id);
        return (
          <div key={s.id} style={{ position: "absolute", left: `${s.x}%`, top: `${s.y}%`, transform: "translate(-50%, -50%)", zIndex: 12 }}>
            <motion.div
              onClick={() => clickStar(s.id)}
              whileHover={{ scale: 1.25 }}
              style={{
                width: s.bright ? 16 : 12,
                height: s.bright ? 16 : 12,
                borderRadius: "50%",
                background: isClicked ? "#ffffff" : "rgba(255,255,255,0.25)",
                border: isClicked ? "2px solid #fff" : "1.5px solid rgba(255,255,255,0.4)",
                boxShadow: isClicked 
                  ? "0 0 10px #ffffff, 0 0 20px rgba(255,255,255,0.5)" 
                  : "0 0 4px rgba(255,255,255,0.15)",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 0.5s ease",
              }}
            >
              {/* Core hot spot for clicked stars */}
              {isClicked && (
                <div style={{ width: 4, height: 4, borderRadius: "50%", background: "#fff" }} />
              )}
            </motion.div>

            {/* Constellation Star Label (revealed on click) */}
            <AnimatePresence>
              {isClicked && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 0.75, y: 0 }}
                  style={{
                    position: "absolute",
                    top: "120%",
                    left: "50%",
                    transform: "translateX(-50%)",
                    fontFamily: "'Cormorant Garamond', serif",
                    fontSize: 11,
                    fontWeight: "bold",
                    color: "#fef3c7",
                    textShadow: "0 2px 4px rgba(0,0,0,0.85)",
                    letterSpacing: 1.2,
                    whiteSpace: "nowrap",
                    pointerEvents: "none",
                  }}
                >
                  {s.name}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}

      {/* Connecting Leo Constellation Lines */}
      {forming && (() => {
        const vw = window.innerWidth;
        const vh = window.innerHeight;
        const px = (star: typeof LEO_STARS[0]) => star.x / 100 * vw;
        const py = (star: typeof LEO_STARS[0]) => star.y / 100 * vh;
        return (
          <svg
            width={vw} height={vh}
            style={{ position: "absolute", inset: 0, zIndex: 10, pointerEvents: "none" }}>
            
            {/* Glowing Golden Lines */}
            {LEO_LINES.map(([a, b], i) => (
              <motion.path
                key={i}
                d={`M ${px(LEO_STARS[a])} ${py(LEO_STARS[a])} L ${px(LEO_STARS[b])} ${py(LEO_STARS[b])}`}
                stroke="rgba(255, 255, 255, 0.75)"
                strokeWidth="1.2"
                strokeLinecap="round"
                fill="none"
                style={{ filter: "drop-shadow(0 0 2px rgba(255,255,255,0.5))" }}
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ delay: 0.5 + i * 0.22, duration: 1.1, ease: "easeInOut" }}
              />
            ))}
          </svg>
        );
      })()}

      {/* Interactive Helper Text */}
      {!forming && (
        <motion.div 
          animate={{ opacity: [0.5, 1, 0.5] }} 
          transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
          style={{
            position: "absolute", 
            bottom: "26%", 
            left: "50%", 
            transform: "translateX(-50%)", 
            fontFamily: "'Caveat', cursive", 
            fontSize: 18, 
            color: "#fef3c7", 
            textShadow: "0 2px 8px rgba(0,0,0,0.5)",
            whiteSpace: "nowrap",
            zIndex: 4,
          }}
        >
          click the major stars to chart them ({clicked.size}/8)
        </motion.div>
      )}

      {/* Constellation Reveal Info Panel */}
      {forming && (
        <motion.div
          initial={{ opacity: 0, y: 15 }} 
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 2.8, duration: 1 }}
          style={{ 
            position: "absolute", 
            bottom: "25%", 
            left: "50%", 
            transform: "translateX(-50%)", 
            textAlign: "center",
            zIndex: 4,
          }}
        >
          <div style={{ 
            fontFamily: "'Cormorant Garamond', serif", 
            fontSize: 22, 
            color: "#fef08a", 
            textShadow: "0 0 10px rgba(234,179,8,0.5)", 
            letterSpacing: 4 
          }}>
            ♌ Leo
          </div>
          <div style={{ 
            fontFamily: "'Caveat', cursive", 
            fontSize: 18, 
            color: "#d8b4fe", 
            marginTop: 4,
            textShadow: "0 2px 4px rgba(0,0,0,0.4)"
          }}>
            22 August · the universe remembers you
          </div>
        </motion.div>
      )}

      {/* Navigation Tab */}
      {showNext && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }} 
          animate={{ opacity: 1, y: 0 }} 
          style={{ position: "absolute", bottom: "14%", left: "50%", transform: "translateX(-50%)", zIndex: 4 }}
        >
          <PageTab onClick={onNext} label="Bring the spring →" pos="center" />
        </motion.div>
      )}
      
      <ChLabel text="Chapter VI · A Universe That Remembers You" light />
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
      <ChLabel text="Chapter VII · You Made Spring Come" />
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
      <ChLabel text="Chapter VIII · One Last Request" />
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

  const next = () => setChapter(c => Math.min(c + 1, 7));

  const chapters = [
    <Ch1 key={0} onNext={next} />,
    <Ch3 key={1} onNext={next} setMemory={setMemory} />,
    <Ch4 key={2} onNext={next} memory={memory} setMemory={setMemory} />,
    <Ch5 key={3} onNext={next} />,
    <Ch6 key={4} onNext={next} />,
    <Ch7 key={5} onNext={next} />,
    <Ch8 key={6} onNext={next} />,
    <Ch9 key={7} memory={memory} />,
  ];

  return (
    <div style={{ width: "100vw", height: "100vh", overflow: "hidden", position: "relative" }}>
      <style>{GCSS}</style>
      <Cursor />

      {/* Progress dots */}
      <div style={{ position: "fixed", bottom: 14, left: "50%", transform: "translateX(-50%)", display: "flex", gap: 7, zIndex: 100, pointerEvents: "none" }}>
        {Array.from({ length: 8 }, (_, i) => (
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
