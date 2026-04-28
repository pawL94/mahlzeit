export const C = {
  bg:"#FEFCF7", card:"#FFFFFF", cardBorder:"#E0D6C8",
  accent:"#2C6E49", accentDim:"#1E4D34", accentGlow:"rgba(44,110,73,0.10)",
  brand:"#D97706",
  text:"#1C1410", textMuted:"#5C5048", textDim:"#8C7E74", surface:"#F4EFE6",
  danger:"#C8392B", dangerGlow:"rgba(200,57,43,0.09)",
  green:"#16A34A", greenGlow:"rgba(22,163,74,0.10)",
  purple:"#6D28D9", purpleGlow:"rgba(109,40,217,0.10)",
  shadow:"0 2px 16px rgba(28,20,16,0.07)",
  shadowMd:"0 6px 32px rgba(28,20,16,0.11)",
};
export const D = "'Playfair Display', serif";
export const B = "'DM Sans', sans-serif";

export const Chip = ({ label, color, dimColor, glowColor, onRemove }) => (
  <span style={{ display:"inline-flex", alignItems:"center", gap:6, background:glowColor||C.accentGlow, border:`1px solid ${dimColor||C.accentDim}`, borderRadius:20, padding:"5px 12px", fontSize:13, color:color||C.accent, fontWeight:500 }}>
    {label}{onRemove && <button onClick={onRemove} style={{ color:dimColor||C.accentDim, fontSize:16, lineHeight:1 }}>×</button>}
  </span>
);

export const TagToggle = ({ label, emoji, selected, color, glowColor, onClick }) => (
  <button onClick={onClick} style={{ padding:"8px 12px", borderRadius:10, fontFamily:B, border:`1.5px solid ${selected?(color||C.accent):C.cardBorder}`, background:selected?(glowColor||C.accentGlow):C.card, color:selected?(color||C.accent):C.textMuted, fontSize:13, fontWeight:500, display:"flex", alignItems:"center", gap:6, transition:"all 0.15s" }}>
    <span style={{fontSize:14}}>{emoji}</span>{label}
  </button>
);

export const SL = ({ children }) => (
  <p style={{ color:C.textMuted, fontSize:11, fontWeight:700, letterSpacing:1.5, textTransform:"uppercase", marginBottom:8 }}>{children}</p>
);

export const BigBtn = ({ label, onClick, disabled, secondary, color }) => (
  <button onClick={onClick} disabled={disabled} style={{ width:"100%", padding:"16px", borderRadius:50, fontFamily:B, background:secondary?C.surface:disabled?C.surface:color?`linear-gradient(135deg,${color},${color}cc)`:`linear-gradient(135deg,${C.accent},${C.accentDim})`, color:secondary?C.textMuted:disabled?"#A09080":"#FFFFFF", border:secondary?`1.5px solid ${C.cardBorder}`:"none", fontWeight:700, fontSize:15, boxShadow:(!secondary&&!disabled)?"0 4px 20px rgba(44,110,73,0.22)":"none", transition:"all 0.2s" }}>
    {label}
  </button>
);

export const PBar = ({ step, total }) => (
  <div style={{ display:"flex", gap:5, marginBottom:20 }}>
    {Array.from({length:total}).map((_,i)=>(
      <div key={i} style={{ height:3, flex:1, borderRadius:2, background:i<step?C.accent:"#D4C8BC", transition:"background 0.3s" }}/>
    ))}
  </div>
);

export const Spin = ({ size=28, color=C.accent }) => (
  <div style={{ width:size, height:size, borderRadius:"50%", border:`2.5px solid ${C.cardBorder}`, borderTopColor:color, animation:"spin 0.8s linear infinite", flexShrink:0 }}/>
);

export const BackBtn = ({ onClick }) => (
  <button onClick={onClick} style={{ color:C.accent, fontSize:14, marginBottom:14, display:"flex", alignItems:"center", gap:5, fontFamily:B }}>← Zurück</button>
);
