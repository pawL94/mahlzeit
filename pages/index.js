import { useState, useEffect, useCallback } from "react";
import Head from "next/head";

// ── Design Tokens ─────────────────────────────────────────
const C = {
  bg:"#FEFCF7", card:"#FFFFFF", cardBorder:"#E0D6C8",
  accent:"#2C6E49", accentDim:"#1E4D34", accentGlow:"rgba(44,110,73,0.10)",
  brand:"#D97706",   // amber – nur für Logo/Marke
  text:"#1C1410", textMuted:"#5C5048", textDim:"#8C7E74", surface:"#F4EFE6",
  danger:"#C8392B", dangerGlow:"rgba(200,57,43,0.09)",
  green:"#16A34A", greenGlow:"rgba(22,163,74,0.10)",
  purple:"#6D28D9", purpleGlow:"rgba(109,40,217,0.10)",
  shadow:"0 2px 16px rgba(28,20,16,0.07)",
  shadowMd:"0 6px 32px rgba(28,20,16,0.11)",
};
const D = "'Playfair Display', serif";
const B = "'DM Sans', sans-serif";

// ── Storage ───────────────────────────────────────────────
const store = {
  profiles: {
    save: (p) => { try { localStorage.setItem("mz_profiles", JSON.stringify(p)); } catch(e) {} },
    load: () => { try { return JSON.parse(localStorage.getItem("mz_profiles") || "[]"); } catch(e) { return []; } },
  },
  recipes: {
    save: (pid, r) => { try { localStorage.setItem("mz_recipes_" + (pid||"global"), JSON.stringify(r)); } catch(e) {} },
    load: (pid) => { try { return JSON.parse(localStorage.getItem("mz_recipes_" + (pid||"global")) || "[]"); } catch(e) { return []; } },
  },
  week: {
    save: (pid, w) => { try { localStorage.setItem("mz_week_" + (pid||"global"), JSON.stringify(w)); } catch(e) {} },
    load: (pid) => { try { return JSON.parse(localStorage.getItem("mz_week_" + (pid||"global")) || "null"); } catch(e) { return null; } },
  },
  lastSession: {
    save: (s) => { try { localStorage.setItem("mz_last_session", JSON.stringify(s)); } catch(e) {} },
    load: () => { try { return JSON.parse(localStorage.getItem("mz_last_session") || "null"); } catch(e) { return null; } },
  },
  ingFreq: {
    save: (f) => { try { localStorage.setItem("mz_ing_freq", JSON.stringify(f)); } catch(e) {} },
    load: () => { try { return JSON.parse(localStorage.getItem("mz_ing_freq") || "{}"); } catch(e) { return {}; } },
    bump: (ings) => {
      try {
        const freq = JSON.parse(localStorage.getItem("mz_ing_freq") || "{}");
        ings.forEach(i => { freq[i] = (freq[i] || 0) + 1; });
        localStorage.setItem("mz_ing_freq", JSON.stringify(freq));
      } catch(e) {}
    },
  },
};

const personsKey = (pid) => "mz_persons_" + (pid||"global");
const savePersons = (pid, n) => { try { localStorage.setItem(personsKey(pid), String(n)); } catch(e) {} };
const loadPersons = (pid) => { try { const v = localStorage.getItem(personsKey(pid)); return v ? parseInt(v) : 2; } catch(e) { return 2; } };

const DAYS = ["Montag","Dienstag","Mittwoch","Donnerstag","Freitag","Samstag","Sonntag"];

// ── Constants ──────────────────────────────────────────────
const DIET = [
  {l:"Vegetarisch",e:"🥦"},{l:"Vegan",e:"🌱"},
  {l:"Kein Fisch",e:"🐟"},{l:"Kein Schweinefleisch",e:"🐷"},{l:"Low Carb",e:"🥑"},
  {l:"Glutenfrei",e:"🌾"},{l:"Laktosefrei",e:"🥛"},{l:"Nussallergie",e:"🥜"},
  {l:"Eierallergie",e:"🥚"},{l:"Sojaallergie",e:"🫘"},{l:"Keine Meeresfrüchte",e:"🦐"},
];
const CUISINES = [
  {l:"Deutsch",e:"🥨"},{l:"Italienisch",e:"🍝"},{l:"Spanisch",e:"🥘"},
  {l:"Französisch",e:"🥐"},{l:"Griechisch",e:"🫒"},{l:"Türkisch",e:"🥙"},
  {l:"Asiatisch",e:"🍜"},{l:"Japanisch",e:"🍣"},{l:"Koreanisch",e:"🍱"},
  {l:"Indisch",e:"🍛"},{l:"Mexikanisch",e:"🌮"},{l:"Amerikanisch",e:"🍔"},
  {l:"Mediterran",e:"🐟"},{l:"Libanesisch",e:"🧆"},{l:"Vietnamesisch",e:"🍲"},
];
const DEVICES = [
  {l:"Airfryer (1 Korb)",e:"🌀",sub:null},
  {l:"Airfryer (2 Körbe)",e:"🌀",sub:null},
  {l:"Thermomix",e:"🥘",sub:null},
];
const BASE_SUGGESTIONS = ["Eier","Nudeln","Tomaten","Käse","Hähnchen","Zwiebeln","Knoblauch","Reis","Kartoffeln","Paprika","Speck","Lachs","Tofu","Linsen","Zucchini","Karotten"];
const DISLIKE_OPTIONS = [
  {l:"Pasta",e:"🍝"},{l:"Reis",e:"🍚"},{l:"Hähnchen",e:"🍗"},{l:"Hackfleisch",e:"🥩"},
  {l:"Fisch",e:"🐟"},{l:"Eier",e:"🥚"},{l:"Kartoffeln",e:"🥔"},{l:"Suppe",e:"🍲"},
  {l:"Salat",e:"🥗"},{l:"Pilze",e:"🍄"},{l:"Zwiebeln",e:"🧅"},{l:"Knoblauch",e:"🧄"},
  {l:"Spinat",e:"🥬"},{l:"Brokkoli",e:"🥦"},{l:"Tofu",e:"🫘"},
];

// ── Tiny Components ───────────────────────────────────────
const Chip = ({ label, color, dimColor, glowColor, onRemove }) => (
  <span style={{ display:"inline-flex", alignItems:"center", gap:6, background:glowColor||C.accentGlow, border:`1px solid ${dimColor||C.accentDim}`, borderRadius:20, padding:"5px 12px", fontSize:13, color:color||C.accent, fontWeight:500 }}>
    {label}{onRemove && <button onClick={onRemove} style={{ color:dimColor||C.accentDim, fontSize:16, lineHeight:1 }}>×</button>}
  </span>
);

const TagToggle = ({ label, emoji, selected, color, glowColor, onClick }) => (
  <button onClick={onClick} style={{ padding:"8px 12px", borderRadius:10, fontFamily:B, border:`1.5px solid ${selected?(color||C.accent):C.cardBorder}`, background:selected?(glowColor||C.accentGlow):C.card, color:selected?(color||C.accent):C.textMuted, fontSize:13, fontWeight:500, display:"flex", alignItems:"center", gap:6, transition:"all 0.15s" }}>
    <span style={{fontSize:14}}>{emoji}</span>{label}
  </button>
);

const SL = ({ children }) => <p style={{ color:C.textMuted, fontSize:11, fontWeight:700, letterSpacing:1.5, textTransform:"uppercase", marginBottom:8 }}>{children}</p>;

const BigBtn = ({ label, onClick, disabled, secondary, color }) => (
  <button onClick={onClick} disabled={disabled} style={{ width:"100%", padding:"16px", borderRadius:50, fontFamily:B, background:secondary?C.surface:disabled?C.surface:color?`linear-gradient(135deg,${color},${color}cc)`:`linear-gradient(135deg,${C.accent},${C.accentDim})`, color:secondary?C.textMuted:disabled?"#A09080":"#FFFFFF", border:secondary?`1.5px solid ${C.cardBorder}`:"none", fontWeight:700, fontSize:15, boxShadow:(!secondary&&!disabled)?"0 4px 20px rgba(44,110,73,0.22)":"none", transition:"all 0.2s" }}>
    {label}
  </button>
);

const PBar = ({ step, total }) => (
  <div style={{ display:"flex", gap:5, marginBottom:20 }}>
    {Array.from({length:total}).map((_,i)=>(<div key={i} style={{ height:3, flex:1, borderRadius:2, background:i<step?C.accent:'#D4C8BC', transition:"background 0.3s" }}/>))}
  </div>
);

const Spin = ({ size=28, color=C.accent }) => (
  <div style={{ width:size, height:size, borderRadius:"50%", border:`2.5px solid ${C.cardBorder}`, borderTopColor:color, animation:"spin 0.8s linear infinite", flexShrink:0 }}/>
);

const BackBtn = ({ onClick }) => (
  <button onClick={onClick} style={{ color:C.accent, fontSize:14, marginBottom:14, display:"flex", alignItems:"center", gap:5, fontFamily:B }}>← Zurück</button>
);

// ── Profile Editor ────────────────────────────────────────
function ProfileEditor({ profile, onSave, onCancel, isNew }) {
  const [name, setName] = useState(profile?.name||"");
  const [emoji, setEmoji] = useState(profile?.emoji||"🐱");
  const [diet, setDiet] = useState(profile?.diet||[]);
  const [custom, setCustom] = useState(profile?.custom||[]);
  const [cuisines, setCuisines] = useState(profile?.cuisines||[]);
  const [availability, setAvailability] = useState(profile?.availability||"supermarkt");
  const [ci, setCi] = useState("");
  const EMOJIS = ["🐱","🐶","🦊","🐻","🐼","🐨","🦁","🐯","🐸","🐧","🦋","🌟","🍕","🎮","🎵","🌈"];
  const toggle = (v) => setDiet(p=>p.includes(v)?p.filter(x=>x!==v):[...p,v]);
  const addC = () => { const v=ci.trim(); if(v&&!custom.includes(v)) setCustom(p=>[...p,v]); setCi(""); };

  return (
    <div style={{ minHeight:"100vh", background:C.bg, padding:"56px 24px 40px", display:"flex", flexDirection:"column", overflowY:"auto" }}>
      <BackBtn onClick={onCancel}/>
      <h2 style={{ fontFamily:D, fontSize:26, fontWeight:700, marginBottom:4 }}>{isNew?"Neues Profil":"Profil bearbeiten"}</h2>
      <p style={{ color:C.textMuted, fontSize:14, marginBottom:24 }}>Wird bei jedem Rezept berücksichtigt.</p>

      <div style={{ marginBottom:20 }}>
        <SL>Name</SL>
        <div style={{ background:C.card, border:`1.5px solid ${C.cardBorder}`, borderRadius:14, padding:"4px 16px" }}>
          <input value={name} onChange={e=>setName(e.target.value)} placeholder="z.B. Mama, Papa, Ich..." style={{ width:"100%", fontSize:15, padding:"13px 0", fontFamily:B }}/>
        </div>
      </div>

      <div style={{ marginBottom:20 }}>
        <SL>Avatar</SL>
        <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
          {EMOJIS.map(e=>(<button key={e} onClick={()=>setEmoji(e)} style={{ width:44, height:44, borderRadius:12, fontSize:22, border:`2px solid ${emoji===e?C.accent:C.cardBorder}`, background:emoji===e?C.accentGlow:C.card, display:"flex", alignItems:"center", justifyContent:"center", lineHeight:1 }}>{e}</button>))}
        </div>
      </div>

      <div style={{ marginBottom:20 }}>
        <SL>🚫 Ernährung & Unverträglichkeiten</SL>
        <div style={{ display:"flex", flexWrap:"wrap", gap:7, marginBottom:10 }}>
          {DIET.map(({l,e})=>(<TagToggle key={l} label={l} emoji={e} selected={diet.includes(l)} color={C.danger} glowColor={C.dangerGlow} onClick={()=>toggle(l)}/>))}
        </div>
        <div style={{ background:C.card, border:`1px solid ${C.cardBorder}`, borderRadius:14, padding:"4px 14px", display:"flex", alignItems:"center", gap:8 }}>
          <input value={ci} onChange={e=>setCi(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"){e.preventDefault();addC();}}} placeholder="Weitere Einschränkung..." style={{ flex:1, fontSize:14, padding:"12px 0", fontFamily:B }}/>
          {ci&&<button onClick={addC} style={{ background:C.danger, color:"#fff", borderRadius:8, padding:"5px 10px", fontSize:13, fontWeight:600 }}>+</button>}
        </div>
        {custom.length>0&&<div style={{ display:"flex", flexWrap:"wrap", gap:6, marginTop:8 }}>{custom.map(c=><Chip key={c} label={c} color={C.danger} dimColor="#b03030" glowColor={C.dangerGlow} onRemove={()=>setCustom(p=>p.filter(x=>x!==c))}/>)}</div>}
      </div>

      <div style={{ marginBottom:20 }}>
        <SL>🌍 Lieblingsküchen</SL>
        <p style={{ color:C.textDim, fontSize:12, marginBottom:8 }}>Leer lassen für maximale Vielfalt</p>
        <div style={{ display:"flex", flexWrap:"wrap", gap:7 }}>
          {CUISINES.map(({l,e})=>(<TagToggle key={l} label={l} emoji={e} selected={cuisines.includes(l)} onClick={()=>setCuisines(p=>p.includes(l)?p.filter(x=>x!==l):[...p,l])}/>))}
        </div>
      </div>

      <div style={{ marginBottom:28 }}>
        <SL>🛒 Wo kaufst du ein?</SL>
        <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
          {[["supermarkt","🛒","Basis","Discounter oder kleiner Markt"],["markt","🏪","Standard","Mein Supermarkt ist gut sortiert"],["alles","🌍","Experimentierfreudig","Ich besorge auch spezielle Zutaten"]].map(([val,em,label,desc])=>(
            <button key={val} onClick={()=>setAvailability(val)} style={{ padding:"12px 14px", borderRadius:14, fontFamily:B, border:`1.5px solid ${availability===val?C.accent:C.cardBorder}`, background:availability===val?C.accentGlow:C.card, display:"flex", alignItems:"center", gap:12, textAlign:"left", width:"100%" }}>
              <span style={{fontSize:22,flexShrink:0}}>{em}</span>
              <div style={{flex:1}}><p style={{fontWeight:600,fontSize:14,color:availability===val?C.accent:C.text,marginBottom:1}}>{label}</p><p style={{fontSize:12,color:C.textMuted}}>{desc}</p></div>
              {availability===val&&<span style={{color:C.accent,fontSize:14,flexShrink:0}}>✓</span>}
            </button>
          ))}
        </div>
      </div>

      <BigBtn label={isNew?"Profil erstellen ✓":"Änderungen speichern"} onClick={()=>{ if(name.trim()) onSave({name:name.trim(),emoji,diet,custom,cuisines,availability,id:profile?.id||Date.now()}); }} disabled={!name.trim()}/>
    </div>
  );
}

// ── Profile Manager ───────────────────────────────────────
function ProfileManager({ profiles, onSave, onBack }) {
  const [editing, setEditing] = useState(null);
  if(editing) return <ProfileEditor profile={editing==="new"?null:editing} isNew={editing==="new"} onSave={(p)=>{ const u=editing==="new"?[...profiles,p]:profiles.map(x=>x.id===p.id?p:x); onSave(u); setEditing(null); }} onCancel={()=>setEditing(null)}/>;
  return (
    <div style={{ minHeight:"100vh", background:C.bg, padding:"56px 24px 40px", display:"flex", flexDirection:"column" }}>
      <BackBtn onClick={onBack}/>
      <h2 style={{ fontFamily:D, fontSize:24, fontWeight:700, marginBottom:4 }}>Profile</h2>
      <p style={{ color:C.textMuted, fontSize:14, marginBottom:24 }}>Jedes Profil hat eigene Rezepte & Einstellungen.</p>
      <div style={{ display:"flex", flexDirection:"column", gap:10, marginBottom:16 }}>
        {profiles.map(p=>(
          <div key={p.id} style={{ background:C.card, border:`1px solid ${C.cardBorder}`, borderRadius:16, padding:"14px 16px", display:"flex", alignItems:"center", gap:12 }}>
            <span style={{fontSize:26}}>{p.emoji}</span>
            <div style={{flex:1}}>
              <p style={{fontWeight:600,fontSize:15}}>{p.name}</p>
              {([...(p.diet||[]),...(p.custom||[])]).length>0&&<p style={{fontSize:12,color:C.textMuted,marginTop:2}}>{[...p.diet,...p.custom].join(" · ")}</p>}
            </div>
            <button onClick={()=>setEditing(p)} style={{color:C.accent,fontSize:13,padding:"5px 10px",background:C.accentGlow,borderRadius:8,fontFamily:B}}>✏️</button>
            <button onClick={()=>onSave(profiles.filter(x=>x.id!==p.id))} style={{color:C.danger,fontSize:13,padding:"5px 10px",background:C.dangerGlow,borderRadius:8,fontFamily:B}}>✕</button>
          </div>
        ))}
      </div>
      <button onClick={()=>setEditing("new")} style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:8, padding:"15px", borderRadius:16, border:`1.5px dashed ${C.cardBorder}`, color:C.textMuted, fontSize:14, fontFamily:B, background:"transparent", width:"100%" }}>+ Neues Profil erstellen</button>
    </div>
  );
}

// ── Splash Screen ─────────────────────────────────────────
function SplashScreen({ profiles, onStart, onQuickStart, onManageProfiles, onViewSaved, onWeekPlanner, lastSession }) {
  const [selected, setSelected] = useState(null);
  useEffect(()=>{ if(profiles.length>0) setSelected(profiles[0].id); },[profiles]);
  const active = profiles.find(p=>p.id===selected)||null;
  const moodEmoji = { "Herzhaft":"🥩", "Leicht":"🥗", "Dessert":"🍰", "Überrasch mich!":"🎲" };

  return (
    <div style={{ minHeight:"100vh", background:`radial-gradient(ellipse at 60% 10%, rgba(44,110,73,0.08) 0%, transparent 55%), ${C.bg}`, padding:"48px 24px 40px", display:"flex", flexDirection:"column" }}>

      {/* Header */}
      <div style={{ textAlign:"center", marginBottom:28 }}>
        <span style={{ fontSize:44, display:"block", marginBottom:8, animation:"bounce 2.5s ease-in-out infinite" }}>🍳</span>
        <h1 style={{ fontFamily:D, fontSize:38, fontWeight:700, lineHeight:1, marginBottom:4, color:C.text }}>Mahl<span style={{color:C.brand}}>zeit</span></h1>
        <p style={{ color:C.textMuted, fontSize:13 }}>Nie wieder grübeln was du kochen sollst.</p>
      </div>

      {/* Profile selector */}
      {profiles.length>0 ? (
        <div style={{ marginBottom:16 }}>
          <SL>Wer kocht heute?</SL>
          <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
            {profiles.map(p=>(
              <button key={p.id} onClick={()=>setSelected(p.id)} style={{ display:"flex", alignItems:"center", gap:12, padding:"12px 16px", borderRadius:16, border:`2px solid ${selected===p.id?C.accent:C.cardBorder}`, background:selected===p.id?C.accentGlow:C.card, width:"100%", textAlign:"left", transition:"all 0.15s" }}>
                <span style={{fontSize:26,flexShrink:0}}>{p.emoji}</span>
                <div style={{flex:1}}>
                  <p style={{ fontWeight:600, fontSize:15, color:selected===p.id?C.accent:C.text }}>{p.name}</p>
                  {([...(p.diet||[]),...(p.custom||[])]).length>0&&<p style={{ fontSize:11, color:C.textMuted, marginTop:1 }}>{[...p.diet,...p.custom].slice(0,3).join(" · ")}{[...p.diet,...p.custom].length>3?" …":""}</p>}
                </div>
                {selected===p.id&&<span style={{color:C.accent,fontSize:16,flexShrink:0}}>✓</span>}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <button onClick={onManageProfiles} style={{ marginBottom:16, padding:18, background:C.card, border:`1.5px dashed ${C.cardBorder}`, borderRadius:18, width:"100%", cursor:"pointer", fontFamily:B, textAlign:"center", transition:"border-color 0.2s" }}>
          <p style={{fontSize:28,marginBottom:6}}>👤</p>
          <p style={{color:C.textMuted,fontSize:14,marginBottom:3}}>Noch kein Profil erstellt</p>
          <p style={{color:C.accent,fontSize:13,fontWeight:600}}>Tippe hier um loszulegen →</p>
        </button>
      )}

      {/* Quick Start card */}
      {lastSession && (
        <button onClick={()=>onQuickStart(active, lastSession)} style={{ marginBottom:12, padding:"14px 16px", background:`linear-gradient(135deg,rgba(90,185,122,0.15),rgba(90,185,122,0.05))`, border:`1.5px solid ${C.green}`, borderRadius:16, width:"100%", fontFamily:B, display:"flex", alignItems:"center", gap:12, textAlign:"left" }}>
          <span style={{fontSize:24,flexShrink:0}}>⚡</span>
          <div style={{flex:1}}>
            <p style={{fontWeight:700,fontSize:14,color:C.green,marginBottom:2}}>Schnellstart</p>
            <p style={{fontSize:12,color:C.textMuted}}>Wie zuletzt: {moodEmoji[lastSession.mood]||""} {lastSession.mood} · {lastSession.time} · {lastSession.portion} {lastSession.portion==="1"?"Person":"Personen"}</p>
          </div>
          <span style={{color:C.green,fontSize:18,flexShrink:0}}>→</span>
        </button>
      )}

      {/* Main actions */}
      <button onClick={()=>onStart(active)} style={{ background:`linear-gradient(135deg,${C.accent},${C.accentDim})`, color:"#FFFFFF", fontWeight:700, fontSize:16, padding:"16px", borderRadius:50, fontFamily:B, boxShadow:"0 8px 32px rgba(44,110,73,0.22)", marginBottom:10 }}>
        Rezept finden →
      </button>
      <button onClick={()=>onWeekPlanner(active)} style={{ background:C.card, border:`1.5px solid ${C.cardBorder}`, color:C.text, fontWeight:600, fontSize:15, padding:"14px", borderRadius:50, fontFamily:B, marginBottom:16 }}>
        📅 Wochenplaner
      </button>

      {/* Secondary actions */}
      <div style={{ display:"flex", justifyContent:"center", gap:20 }}>
        <button onClick={onManageProfiles} style={{ color:C.textMuted, fontSize:13, fontFamily:B }}>{profiles.length>0?"⚙️ Profile":"+ Profil erstellen"}</button>
        <button onClick={()=>onViewSaved(active)} style={{ color:C.textMuted, fontSize:13, fontFamily:B }}>📚 Meine Rezepte</button>
      </div>
    </div>
  );
}

// ── Ingredients Screen ────────────────────────────────────
function IngredientsScreen({ onNext, onSkip }) {
  const [input, setInput] = useState("");
  const [ingredients, setIngredients] = useState([]);
  const [mustUse, setMustUse] = useState([]);
  const [noShopping, setNoShopping] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scanDone, setScanDone] = useState(false);
  const [scanError, setScanError] = useState(false);
  const [showScanInfo, setShowScanInfo] = useState(false);
  const [pendingInputId, setPendingInputId] = useState(null);
  const [scanCount, setScanCount] = useState(0);
  const [lastTap, setLastTap] = useState({ing:null,time:0});
  const MAX_SCANS = 3;

  // Dynamic suggestions based on usage frequency
  const freq = store.ingFreq.load();
  const sortedSugg = [...BASE_SUGGESTIONS].sort((a,b)=>(freq[b]||0)-(freq[a]||0));

  const add = () => { const v=input.trim(); if(v&&!ingredients.includes(v)) setIngredients(p=>[...p,v]); setInput(""); };
  const handleKey = e => { if(e.key==="Enter"||e.key===","){e.preventDefault();add();} };

  const handleIngredientTap = (ing) => {
    const now = Date.now();
    if(lastTap.ing===ing && now-lastTap.time<400) {
      setMustUse(p=>p.includes(ing)?p.filter(x=>x!==ing):[...p,ing]);
      setLastTap({ing:null,time:0});
    } else {
      setLastTap({ing,time:now});
    }
  };

  const triggerScan = (inputId) => {
    if(!localStorage.getItem("mz_scan_consent")) { setPendingInputId(inputId); setShowScanInfo(true); }
    else { document.getElementById(inputId)?.click(); }
  };

  const handleScan = async (e) => {
    const file = e.target.files?.[0]; if(!file) return;
    setScanning(true); setScanDone(false); setScanError(false);
    try {
      const comp = await new Promise((res,rej)=>{ const img=new Image(), url=URL.createObjectURL(file); img.onload=()=>{ const c=document.createElement("canvas"),M=1024; let w=img.width,h=img.height; if(w>M||h>M){if(w>h){h=Math.round(h*M/w);w=M;}else{w=Math.round(w*M/h);h=M;}} c.width=w;c.height=h; const ctx=c.getContext("2d"); ctx.drawImage(img,0,0,w,h); let data=c.toDataURL("image/webp",0.7); if(!data.startsWith("data:image/webp")){data=c.toDataURL("image/jpeg",0.65);} URL.revokeObjectURL(url); res(data.split(",")[1]); }; img.onerror=rej; img.src=url; });
      const mimeType = comp.startsWith("/9j") ? "image/jpeg" : "image/webp";
      const resp = await fetch("/api/claude",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({type:"scan",base64:comp,mimeType})});
      const data = await resp.json();
      if(data.ingredients?.length) { setIngredients(prev=>{ const c=[...prev]; data.ingredients.forEach(f=>{if(!c.includes(f))c.push(f);}); return c; }); setScanDone(true); setScanCount(p=>p+1); }
      else setScanError(true);
    } catch(err) { setScanError(true); } finally { setScanning(false); e.target.value=""; }
  };

  return (
    <>
      {/* Privacy modal */}
      {showScanInfo&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.75)",display:"flex",alignItems:"flex-end",zIndex:200}} onClick={()=>setShowScanInfo(false)}>
          <div onClick={e=>e.stopPropagation()} style={{background:C.card,borderRadius:"24px 24px 0 0",padding:"28px 24px 48px",width:"100%",border:`1px solid ${C.cardBorder}`,maxWidth:430,margin:"0 auto"}}>
            <div style={{width:36,height:4,borderRadius:2,background:C.cardBorder,margin:"0 auto 20px"}}/>
            <p style={{fontSize:22,textAlign:"center",marginBottom:10}}>📸</p>
            <h3 style={{fontFamily:D,fontSize:20,fontWeight:700,marginBottom:10,textAlign:"center"}}>Kurzer Hinweis</h3>
            <p style={{color:C.textMuted,fontSize:14,lineHeight:1.7,marginBottom:16}}>Das Foto wird kurz an <strong style={{color:C.text}}>Anthropic</strong> (USA) übermittelt um die Zutaten zu erkennen. Es wird danach <strong style={{color:C.text}}>nicht gespeichert</strong>.</p>
            <p style={{color:C.textMuted,fontSize:14,lineHeight:1.7,marginBottom:24}}>Du kannst Zutaten jederzeit auch manuell eingeben.</p>
            <div style={{display:"flex",flexDirection:"column",gap:10}}>
              <button onClick={()=>{localStorage.setItem("mz_scan_consent","true");setShowScanInfo(false);setTimeout(()=>document.getElementById(pendingInputId||"scan-camera").click(),100);}} style={{width:"100%",padding:"15px",borderRadius:50,background:`linear-gradient(135deg,${C.accent},${C.accentDim})`,color:"#FFFFFF",fontWeight:700,fontSize:15,fontFamily:B}}>Verstanden, weiter</button>
              <button onClick={()=>setShowScanInfo(false)} style={{width:"100%",padding:"14px",borderRadius:50,background:"transparent",border:`1.5px solid ${C.cardBorder}`,color:C.textMuted,fontFamily:B}}>Abbrechen</button>
            </div>
          </div>
        </div>
      )}

      {/* Hidden file inputs */}
      <input id="scan-camera" type="file" accept="image/*" capture="environment" onChange={handleScan} disabled={scanning} style={{display:"none"}}/>
      <input id="scan-gallery" type="file" accept="image/*" onChange={handleScan} disabled={scanning} style={{display:"none"}}/>

      {/* Status */}
      {scanning&&<div style={{background:C.card,border:`1.5px solid ${C.cardBorder}`,borderRadius:16,padding:"14px 16px",marginBottom:12,display:"flex",alignItems:"center",gap:12}}><Spin size={18}/><p style={{color:C.accent,fontWeight:600,fontSize:14}}>KI analysiert Foto...</p></div>}
      {scanDone&&!scanning&&<div style={{background:C.greenGlow,border:`1px solid ${C.green}`,borderRadius:12,padding:"10px 14px",marginBottom:12,display:"flex",alignItems:"center",gap:8}}><span>✅</span><p style={{color:C.green,fontSize:13,fontWeight:500}}>Zutaten erkannt – du kannst weitere Fotos scannen.</p></div>}
      {scanError&&!scanning&&<div style={{background:C.dangerGlow,border:`1px solid ${C.danger}`,borderRadius:12,padding:"10px 14px",marginBottom:12}}><p style={{color:C.danger,fontSize:13}}>Scan fehlgeschlagen – nochmal versuchen oder manuell eingeben.</p></div>}

      {/* Scan buttons */}
      {!scanning&&scanCount<MAX_SCANS&&(
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}>
          <button onClick={()=>triggerScan("scan-camera")} style={{padding:"12px 8px",borderRadius:14,background:`linear-gradient(135deg,rgba(44,110,73,0.10),rgba(30,77,52,0.05))`,border:`1.5px solid ${C.accentDim}`,display:"flex",flexDirection:"column",alignItems:"center",gap:5}}>
            <span style={{fontSize:22}}>📷</span><p style={{color:C.accent,fontWeight:600,fontSize:13}}>Kamera</p><p style={{color:C.textMuted,fontSize:11}}>Direkt fotografieren</p>
          </button>
          <button onClick={()=>triggerScan("scan-gallery")} style={{padding:"12px 8px",borderRadius:14,background:C.card,border:`1.5px solid ${C.cardBorder}`,display:"flex",flexDirection:"column",alignItems:"center",gap:5}}>
            <span style={{fontSize:22}}>🖼️</span><p style={{color:C.text,fontWeight:600,fontSize:13}}>Galerie</p><p style={{color:C.textMuted,fontSize:11}}>Foto auswählen</p>
          </button>
        </div>
      )}
      {!scanning&&<div style={{display:"flex",justifyContent:"space-between",marginBottom:12}}>
        <p style={{color:C.textDim,fontSize:11}}>Bis zu 3 Fotos – z.B. Kühlschrank + Vorratskammer</p>
        {scanCount>0&&<p style={{color:scanCount>=MAX_SCANS?C.danger:C.textMuted,fontSize:11,fontWeight:600,flexShrink:0}}>{scanCount}/{MAX_SCANS} genutzt</p>}
      </div>}

      {/* Manual input */}
      <div style={{background:C.card,border:`1.5px solid ${C.cardBorder}`,borderRadius:16,padding:"4px 16px",display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
        <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={handleKey} placeholder="Zutat manuell eingeben..." style={{flex:1,fontSize:15,padding:"13px 0",fontFamily:B}}/>
        {input&&<button onClick={add} style={{background:C.accent,color:"#FFFFFF",borderRadius:8,padding:"5px 12px",fontWeight:700,fontSize:13}}>+</button>}
      </div>

      {/* Ingredient chips */}
      {ingredients.length>0&&(
        <div style={{marginBottom:10}}>
          <div style={{display:"flex",flexWrap:"wrap",gap:7,marginBottom:5}}>
            {ingredients.map(ing=>(
              <span key={ing} onClick={()=>handleIngredientTap(ing)} style={{display:"inline-flex",alignItems:"center",gap:5,background:mustUse.includes(ing)?"rgba(224,90,90,0.15)":C.accentGlow,border:`1px solid ${mustUse.includes(ing)?C.danger:C.accentDim}`,borderRadius:20,padding:"5px 11px",fontSize:13,color:mustUse.includes(ing)?C.danger:C.accent,fontWeight:500,cursor:"pointer",userSelect:"none",transition:"all 0.15s"}}>
                {mustUse.includes(ing)&&<span style={{fontSize:10}}>&#128308;</span>}{ing}
                <button onClick={e=>{e.stopPropagation();setIngredients(p=>p.filter(i=>i!==ing));setMustUse(p=>p.filter(x=>x!==ing));}} style={{color:mustUse.includes(ing)?C.danger:C.accentDim,fontSize:15,lineHeight:1}}>×</button>
              </span>
            ))}
          </div>
          {mustUse.length>0&&<p style={{color:C.danger,fontSize:11,fontWeight:500}}>&#128308; Diese Zutaten müssen zwingend im Rezept vorkommen</p>}
          {ingredients.length>0&&mustUse.length===0&&<p style={{color:C.textDim,fontSize:11}}>💡 Doppelt antippen = muss im Rezept vorkommen</p>}
        </div>
      )}

      {/* Quick select */}
      <div style={{marginBottom:14}}>
        <SL>Schnellauswahl</SL>
        <div style={{display:"flex",flexWrap:"wrap",gap:7}}>
          {sortedSugg.filter(s=>!ingredients.includes(s)).slice(0,12).map(s=>(<button key={s} onClick={()=>setIngredients(p=>[...p,s])} style={{background:C.surface,border:`1px solid ${C.cardBorder}`,borderRadius:20,padding:"6px 13px",color:C.textMuted,fontSize:13,fontFamily:B}}>{s}</button>))}
        </div>
      </div>

      {/* No shopping toggle */}
      {ingredients.length>0&&(
        <button onClick={()=>setNoShopping(p=>!p)} style={{display:"flex",alignItems:"center",gap:12,padding:"12px 14px",borderRadius:14,background:noShopping?C.greenGlow:C.card,border:`1.5px solid ${noShopping?C.green:C.cardBorder}`,width:"100%",fontFamily:B,marginBottom:14,transition:"all 0.2s"}}>
          <span style={{fontSize:20}}>{noShopping?"🏠":"🛒"}</span>
          <div style={{textAlign:"left",flex:1}}>
            <p style={{fontWeight:600,fontSize:14,color:noShopping?C.green:C.text,marginBottom:1}}>{noShopping?"Nur Vorrat nutzen":"Einkaufen ist ok"}</p>
            <p style={{fontSize:12,color:C.textMuted}}>{noShopping?"Nur vorhandene Zutaten verwenden":"Eine Zutat darf auch zugekauft werden"}</p>
          </div>
          <div style={{width:22,height:22,borderRadius:11,background:noShopping?C.green:C.surface,border:`1.5px solid ${noShopping?C.green:C.cardBorder}`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
            {noShopping&&<span style={{color:"#fff",fontSize:12}}>✓</span>}
          </div>
        </button>
      )}

      <div style={{flex:1}}/>
      <div style={{display:"flex",flexDirection:"column",gap:10}}>
        <BigBtn label="Weiter →" onClick={()=>onNext(ingredients,mustUse,noShopping)} disabled={ingredients.length===0}/>
        <BigBtn label="Ohne Zutaten entdecken" onClick={()=>onSkip([],false)} secondary/>
      </div>
    </>
  );
}

function IngredientsPage({ onNext, onSkip, onBack }) {
  return (
    <div style={{ minHeight:"100vh", background:C.bg, padding:"56px 24px 32px", display:"flex", flexDirection:"column" }}>
      {onBack&&<BackBtn onClick={onBack}/>}
      <PBar step={1} total={2}/>
      <div style={{marginBottom:18}}>
        <h2 style={{fontFamily:D,fontSize:28,fontWeight:700,lineHeight:1.2,marginBottom:4,color:C.text}}>Was hast du im Kühlschrank?</h2>
        <p style={{color:C.textMuted,fontSize:14}}>Foto scannen, eintippen oder überspringen.</p>
      </div>
      <IngredientsScreen onNext={onNext} onSkip={onSkip}/>
    </div>
  );
}

// ── Combined Preferences + Disliked Screen ────────────────
function PreferencesScreen({ profile, onGenerate, onBack, step=2, total=2, defaultPrefs }) {
  const [time, setTime] = useState(defaultPrefs?.time||null);
  const [mood, setMood] = useState(defaultPrefs?.mood||null);
  const [persons, setPersons] = useState(defaultPrefs?.portion||loadPersons(profile?.id));
  const [devices, setDevices] = useState([]);
  const [disliked, setDisliked] = useState([]);
  const [customDis, setCustomDis] = useState([]);
  const [disInput, setDisInput] = useState("");
  const [showDisliked, setShowDisliked] = useState(false);
  const toggleDevice = (v) => setDevices(p=>p.includes(v)?p.filter(x=>x!==v):[...p,v]);
  const toggleDis = (v) => setDisliked(p=>p.includes(v)?p.filter(x=>x!==v):[...p,v]);
  const addDis = () => { const v=disInput.trim(); if(v&&!customDis.includes(v)) setCustomDis(p=>[...p,v]); setDisInput(""); };
  const ready = time && mood;
  const dislikedAll = [...disliked, ...customDis];

  return (
    <div style={{minHeight:"100vh",background:C.bg,padding:"56px 24px 32px",display:"flex",flexDirection:"column",overflowY:"auto"}}>
      <BackBtn onClick={onBack}/>
      <PBar step={step} total={total}/>
      <div style={{marginBottom:22}}>
        <h2 style={{fontFamily:D,fontSize:28,fontWeight:700,lineHeight:1.2,marginBottom:4,color:C.text}}>Wie ist deine Stimmung?</h2>
        {profile&&<p style={{color:C.accent,fontSize:13}}>{profile.emoji} {profile.name}</p>}
        {defaultPrefs&&<div style={{marginTop:8,display:"flex",alignItems:"center",gap:6,padding:"6px 12px",background:C.greenGlow,borderRadius:20,border:`1px solid ${C.green}`,width:"fit-content"}}><span style={{fontSize:12}}>⚡</span><p style={{color:C.green,fontSize:12,fontWeight:600}}>Letzte Einstellungen vorausgefüllt</p></div>}
      </div>

      <div style={{display:"flex",flexDirection:"column",gap:18}}>
        {/* Time */}
        <div>
          <SL>⏱ Wie viel Zeit hast du?</SL>
          <div style={{display:"flex",gap:8}}>
            {[["Schnell","⚡","≤15 Min"],["Normal","🕐","~30 Min"],["Gemütlich","🌿","60+ Min"]].map(([l,e,s])=>(
              <button key={l} onClick={()=>setTime(l)} style={{flex:1,padding:"12px 6px",borderRadius:14,fontFamily:B,border:`1.5px solid ${time===l?C.accent:C.cardBorder}`,background:time===l?C.accentGlow:C.card,color:time===l?C.accent:C.textMuted,fontSize:12,fontWeight:500,display:"flex",flexDirection:"column",alignItems:"center",gap:3,transition:"all 0.15s"}}>
                <span style={{fontSize:20}}>{e}</span><span style={{fontWeight:600}}>{l}</span><span style={{fontSize:10,opacity:0.7}}>{s}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Mood */}
        <div>
          <SL>🍽 Worauf hast du Hunger?</SL>
          <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
            {[["Herzhaft","🥩"],["Leicht","🥗"],["Dessert","🍰"],["Überrasch mich!","🎲"]].map(([l,e])=>(
              <button key={l} onClick={()=>setMood(l)} style={{flex:1,minWidth:"44%",padding:"11px 6px",borderRadius:14,fontFamily:B,border:`1.5px solid ${mood===l?C.accent:C.cardBorder}`,background:mood===l?C.accentGlow:C.card,color:mood===l?C.accent:C.textMuted,fontSize:12,fontWeight:500,display:"flex",flexDirection:"column",alignItems:"center",gap:3,transition:"all 0.15s"}}>
                <span style={{fontSize:20}}>{e}</span>{l}
              </button>
            ))}
          </div>
        </div>

        {/* Persons */}
        <div>
          <SL>👥 Für wie viele Personen?</SL>
          <div style={{display:"flex",gap:6}}>
            {[1,2,3,4,5,6,7,8].map(n=>(
              <button key={n} onClick={()=>{setPersons(n);savePersons(profile?.id,n);}} style={{flex:1,padding:"10px 0",borderRadius:12,fontFamily:B,fontSize:13,fontWeight:600,border:`1.5px solid ${persons===n?C.accent:C.cardBorder}`,background:persons===n?C.accentGlow:C.card,color:persons===n?C.accent:C.textMuted,transition:"all 0.15s"}}>{n}</button>
            ))}
          </div>
        </div>

        {/* Devices */}
        <div>
          <SL>🍳 Küchengerät heute (optional)</SL>
          <div style={{display:"flex",gap:8}}>
            {DEVICES.map(({l,e})=>(
              <button key={l} onClick={()=>toggleDevice(l)} style={{flex:1,padding:"10px 6px",borderRadius:12,fontFamily:B,border:`1.5px solid ${devices.includes(l)?C.accent:C.cardBorder}`,background:devices.includes(l)?C.accentGlow:C.card,color:devices.includes(l)?C.accent:C.textMuted,fontSize:11,fontWeight:500,display:"flex",flexDirection:"column",alignItems:"center",gap:3,transition:"all 0.15s"}}>
                <span style={{fontSize:18}}>{e}</span><span style={{textAlign:"center",lineHeight:1.2}}>{l}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Disliked - collapsible */}
        <div>
          <button onClick={()=>setShowDisliked(p=>!p)} style={{display:"flex",alignItems:"center",justifyContent:"space-between",width:"100%",fontFamily:B,padding:"10px 0"}}>
            <span style={{display:"flex",alignItems:"center",gap:8}}>
              <span style={{color:C.textMuted,fontSize:11,fontWeight:700,letterSpacing:1.5,textTransform:"uppercase"}}>Heute keine Lust auf...</span>
              {dislikedAll.length>0&&<span style={{background:C.danger,color:"#fff",borderRadius:10,padding:"1px 7px",fontSize:11,fontWeight:700}}>{dislikedAll.length}</span>}
            </span>
            <span style={{color:C.textMuted,fontSize:14}}>{showDisliked?"▲":"▼"}</span>
          </button>
          {showDisliked&&(
            <div style={{animation:"fadeUp 0.2s ease"}}>
              <div style={{display:"flex",flexWrap:"wrap",gap:7,marginBottom:8}}>
                {DISLIKE_OPTIONS.map(({l,e})=>(<TagToggle key={l} label={l} emoji={e} selected={disliked.includes(l)} color={C.textMuted} glowColor={C.surface} onClick={()=>toggleDis(l)}/>))}
              </div>
              <div style={{background:C.card,border:`1px solid ${C.cardBorder}`,borderRadius:12,padding:"4px 14px",display:"flex",alignItems:"center",gap:8}}>
                <input value={disInput} onChange={e=>setDisInput(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"){e.preventDefault();addDis();}}} placeholder="Etwas anderes..." style={{flex:1,fontSize:14,padding:"11px 0",fontFamily:B}}/>
                {disInput&&<button onClick={addDis} style={{background:C.textMuted,color:C.bg,borderRadius:8,padding:"5px 10px",fontSize:13,fontWeight:600}}>+</button>}
              </div>
              {customDis.length>0&&<div style={{display:"flex",flexWrap:"wrap",gap:6,marginTop:8}}>{customDis.map(d=><Chip key={d} label={d} color={C.textMuted} dimColor={C.textDim} glowColor={C.surface} onRemove={()=>setCustomDis(p=>p.filter(x=>x!==d))}/>)}</div>}
            </div>
          )}
        </div>
      </div>

      <div style={{flex:1,minHeight:20}}/>
      <BigBtn label="✨ Rezept generieren" onClick={()=>ready&&onGenerate({time,mood,portion:persons,devices,disliked:dislikedAll})} disabled={!ready}/>
    </div>
  );
}

// ── Progressive Loading Screen ────────────────────────────
function parseStreamField(text, field) {
  const re = new RegExp('"' + field + '"\\s*:\\s*"((?:[^"\\\\]|\\\\.)*)"');
  const m = text.match(re); return m ? m[1] : null;
}
function parseStreamArray(text, field) {
  const start = text.indexOf('"' + field + '"'); if(start===-1) return null;
  const arrStart = text.indexOf('[', start); if(arrStart===-1) return null;
  const items = []; const re = /"((?:[^"\\\\]|\\\\.)*)"/g; re.lastIndex = arrStart + 1;
  let m;
  while((m=re.exec(text))!==null) { if(text[m.index-1]===':') continue; items.push(m[1]); }
  return items.length > 0 ? items : null;
}
function parseStreamIngredients(text) {
  const start = text.indexOf('"ingredients"'); if(start===-1) return null;
  const arrStart = text.indexOf('[', start); if(arrStart===-1) return null;
  const items = [];
  const re = /\{"name":"((?:[^"\\\\]|\\\\.)*)","amount":"((?:[^"\\\\]|\\\\.)*)","available":(true|false)\}/g;
  re.lastIndex = arrStart; let m;
  while((m=re.exec(text))!==null) items.push({name:m[1],amount:m[2],available:m[3]==="true"});
  return items.length > 0 ? items : null;
}

function LoadingScreen({ streamText="" }) {
  const name = parseStreamField(streamText, "name");
  const emoji = parseStreamField(streamText, "emoji");
  const description = parseStreamField(streamText, "description");
  const time = parseStreamField(streamText, "time");
  const difficulty = parseStreamField(streamText, "difficulty");
  const calories = parseStreamField(streamText, "calories");
  const ingredients = parseStreamIngredients(streamText);
  const steps = parseStreamArray(streamText, "steps");
  const tip = parseStreamField(streamText, "tip");

  if(!name) return (
    <div style={{minHeight:"100vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:32,textAlign:"center",background:C.bg}}>
      <span style={{fontSize:52,display:"block",marginBottom:24,animation:"bounce 1s ease-in-out infinite"}}>👨‍🍳</span>
      <h2 style={{fontFamily:D,fontSize:24,fontWeight:700,marginBottom:10}}>Ich koche für dich...</h2>
      <p style={{color:C.accent,fontSize:14,fontWeight:500,animation:"pulse 1.5s ease-in-out infinite"}}>Analysiere deine Präferenzen...</p>
      <div style={{display:"flex",gap:5,marginTop:28}}>{[0,1,2].map(i=><div key={i} style={{width:8,height:8,borderRadius:4,background:C.accent,animation:`pulse ${1+i*0.3}s ease-in-out infinite`,animationDelay:`${i*0.2}s`}}/>)}</div>
    </div>
  );

  return (
    <div style={{minHeight:"100vh",background:C.bg,overflowY:"auto"}}>
      <div style={{background:"linear-gradient(180deg,rgba(44,110,73,0.05) 0%,transparent 100%)",padding:"60px 24px 24px",borderBottom:`1px solid ${C.cardBorder}`,animation:"fadeUp 0.4s ease"}}>
        <p style={{color:C.accent,fontSize:11,fontWeight:700,letterSpacing:2,textTransform:"uppercase",marginBottom:6}}>🎯 Dein Rezept</p>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12}}>
          <h1 style={{fontFamily:D,fontSize:26,fontWeight:700,lineHeight:1.2,flex:1,paddingRight:14,color:C.text}}>{name}</h1>
          <div style={{background:C.card,border:`1px solid ${C.cardBorder}`,borderRadius:14,padding:"10px",fontSize:26,flexShrink:0}}>{emoji||"🍽"}</div>
        </div>
        {description&&<p style={{color:C.textMuted,fontSize:14,lineHeight:1.6,marginBottom:12,animation:"fadeUp 0.3s ease"}}>{description}</p>}
        {(time||difficulty||calories)&&<div style={{display:"flex",gap:7,flexWrap:"wrap",animation:"fadeUp 0.3s ease"}}>
          {time&&<div style={{background:C.card,border:`1px solid ${C.cardBorder}`,borderRadius:8,padding:"6px 10px",fontSize:12,color:C.textMuted}}>⏱ {time}</div>}
          {difficulty&&<div style={{background:C.card,border:`1px solid ${C.cardBorder}`,borderRadius:8,padding:"6px 10px",fontSize:12,color:C.textMuted}}>📊 {difficulty}</div>}
          {calories&&<div style={{background:C.card,border:`1px solid ${C.cardBorder}`,borderRadius:8,padding:"6px 10px",fontSize:12,color:C.textMuted}}>🔥 {calories}</div>}
        </div>}
      </div>
      <div style={{padding:"20px 24px 120px",display:"flex",flexDirection:"column",gap:16}}>
        {ingredients&&(
          <div style={{background:C.card,border:`1px solid ${C.cardBorder}`,borderRadius:18,padding:16,boxShadow:C.shadow,animation:"fadeUp 0.3s ease"}}>
            <h3 style={{fontFamily:D,fontSize:16,marginBottom:12,color:C.text}}>🛒 Zutaten</h3>
            {ingredients.map((ing,i)=>(<div key={i} style={{display:"flex",justifyContent:"space-between",padding:"8px 0",borderBottom:i<ingredients.length-1?`1px solid ${C.cardBorder}`:"none"}}><span style={{fontSize:13,color:ing.available?C.text:C.accent}}>{ing.available?"✅":"🛒"} {ing.name}</span><span style={{fontSize:12,color:C.textMuted}}>{ing.amount}</span></div>))}
            {!steps&&<div style={{marginTop:10,display:"flex",alignItems:"center",gap:8}}><Spin size={14}/><p style={{color:C.textMuted,fontSize:12}}>Zubereitung wird geladen...</p></div>}
          </div>
        )}
        {!ingredients&&<div style={{display:"flex",alignItems:"center",gap:10,padding:"16px 0"}}><Spin size={18}/><p style={{color:C.textMuted,fontSize:14}}>Zutaten werden zusammengestellt...</p></div>}
        {steps&&(
          <div style={{background:C.card,border:`1px solid ${C.cardBorder}`,borderRadius:18,padding:16,boxShadow:C.shadow,animation:"fadeUp 0.3s ease"}}>
            <h3 style={{fontFamily:D,fontSize:16,marginBottom:12,color:C.text}}>👨‍🍳 Zubereitung</h3>
            {steps.map((step,i)=>(<div key={i} style={{display:"flex",gap:12,marginBottom:i<steps.length-1?14:0}}><div style={{minWidth:26,height:26,borderRadius:"50%",background:`linear-gradient(135deg,${C.accent},${C.accentDim})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,color:"#FFFFFF",flexShrink:0}}>{i+1}</div><p style={{fontSize:13,color:C.textMuted,lineHeight:1.6,paddingTop:3}}>{step}</p></div>))}
          </div>
        )}
        {tip&&<div style={{background:C.accentGlow,border:`1px solid ${C.accentDim}`,borderRadius:12,padding:12,animation:"fadeUp 0.3s ease"}}><p style={{fontSize:13,color:C.accent,lineHeight:1.6}}>💡 <strong>Tipp:</strong> {tip}</p></div>}
      </div>
    </div>
  );
}

// ── Recipe Screen ─────────────────────────────────────────
function RecipeScreen({ recipe, profile, disliked, onNope, onRestart, onBack, onViewSaved, onRate }) {
  const [showNope, setShowNope] = useState(false);
  const [showShopping, setShowShopping] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveAnim, setSaveAnim] = useState(false);
  const [persons, setPersons] = useState(recipe?.persons||2);
  const [scaledRecipe, setScaledRecipe] = useState(null);
  const [scaling, setScaling] = useState(false);
  const [availOverrides, setAvailOverrides] = useState({});
  const displayRecipe = scaledRecipe || recipe;
  if(!recipe) return null;

  const toggleAvail = (name) => setAvailOverrides(p=>({...p,[name]:p[name]!==undefined?!p[name]:!displayRecipe.ingredients.find(i=>i.name===name)?.available}));
  const getAvail = (ing) => availOverrides[ing.name]!==undefined ? availOverrides[ing.name] : ing.available;
  const missing = displayRecipe.ingredients?.filter(i=>!getAvail(i))||[];
  const allR = [...(profile?.diet||[]),...(profile?.custom||[])];

  const handleSave = () => {
    const rs = store.recipes.load(profile?.id);
    const entry = {...recipe, id:Date.now(), savedAt:new Date().toLocaleDateString("de-DE"), profileId:profile?.id||null, status:"saved", persons};
    store.recipes.save(profile?.id, [entry,...rs.slice(0,49)]);
    setSaved(true); setSaveAnim(true); setTimeout(()=>setSaveAnim(false),600);
  };

  const scaleRecipe = async (newPersons) => {
    setPersons(newPersons); savePersons(profile?.id, newPersons);
    if(newPersons===(recipe.persons||2)){ setScaledRecipe(null); return; }
    setScaling(true);
    try {
      const resp = await fetch("/api/claude",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({type:"scale",recipe,fromPersons:recipe.persons||2,toPersons:newPersons})});
      const data = await resp.json();
      if(data.recipe) {
        const availMap = {};
        recipe.ingredients.forEach(i=>{ availMap[i.name.toLowerCase()]=i.available; });
        const fixed = data.recipe.ingredients.map(i=>({...i,available:availMap[i.name.toLowerCase()]??i.available}));
        setScaledRecipe({...data.recipe,ingredients:fixed,persons:newPersons});
      }
    } catch(e) { console.error(e); } finally { setScaling(false); }
  };

  return (
    <div style={{minHeight:"100vh",background:C.bg}}>
      <div style={{background:"linear-gradient(180deg,rgba(44,110,73,0.05) 0%,transparent 100%)",padding:"56px 24px 24px",borderBottom:`1px solid ${C.cardBorder}`}}>
        <button onClick={onBack} style={{color:C.textMuted,fontSize:14,display:"flex",alignItems:"center",gap:5,marginBottom:14,fontFamily:B}}>← Einstellungen ändern</button>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12}}>
          <div style={{flex:1,paddingRight:14}}>
            <p style={{color:C.accent,fontSize:10,fontWeight:700,letterSpacing:2,textTransform:"uppercase",marginBottom:5}}>🎯 Dein Rezept</p>
            <h1 style={{fontFamily:D,fontSize:25,fontWeight:700,lineHeight:1.2,color:C.text}}>{displayRecipe.name}</h1>
          </div>
          <div style={{background:C.card,border:`1px solid ${C.cardBorder}`,borderRadius:14,padding:"10px",fontSize:26,flexShrink:0}}>{displayRecipe.emoji||"🍽"}</div>
        </div>

        {/* Action buttons */}
        <div style={{display:"flex",gap:8,marginBottom:12,flexWrap:"wrap"}}>
          <button onClick={handleSave} style={{display:"flex",alignItems:"center",gap:5,padding:"7px 14px",borderRadius:50,border:`1.5px solid ${saved?C.green:C.cardBorder}`,background:saved?C.greenGlow:C.card,color:saved?C.green:C.textMuted,fontSize:13,fontWeight:600,fontFamily:B,transform:saveAnim?"scale(1.06)":"scale(1)",transition:"all 0.2s"}}>
            {saved?"✅ Gespeichert":"📥 Speichern"}
          </button>
          <button onClick={onViewSaved} style={{display:"flex",alignItems:"center",gap:5,padding:"7px 14px",borderRadius:50,border:`1px solid ${C.cardBorder}`,background:C.card,color:C.textMuted,fontSize:13,fontFamily:B}}>📚 Meine Rezepte</button>
        </div>

        <p style={{color:C.textMuted,fontSize:14,lineHeight:1.6,marginBottom:12}}>{displayRecipe.description}</p>

        {/* Badges */}
        <div style={{display:"flex",gap:7,flexWrap:"wrap",marginBottom:allR.length>0?10:0}}>
          {[["⏱",displayRecipe.time],["📊",displayRecipe.difficulty],["🔥",displayRecipe.calories]].map(([icon,val])=>val&&(<div key={val} style={{background:C.card,border:`1px solid ${C.cardBorder}`,borderRadius:8,padding:"6px 10px",fontSize:12,color:C.textMuted}}>{icon} {val}</div>))}
        </div>
        {allR.length>0&&<div style={{display:"flex",flexWrap:"wrap",gap:5}}>{allR.map(r=><Chip key={r} label={r} color={C.danger} dimColor="#b03030" glowColor={C.dangerGlow}/>)}</div>}

        {/* Person scaler */}
        <div style={{background:C.card,border:`1px solid ${C.cardBorder}`,borderRadius:12,padding:"12px 14px",marginTop:12}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
            <p style={{fontSize:13,fontWeight:600}}>👥 Personen</p>
            {scaling&&<div style={{display:"flex",alignItems:"center",gap:5,background:C.accentGlow,borderRadius:20,padding:"2px 8px"}}><Spin size={12}/><p style={{fontSize:11,color:C.accent}}>Mengen werden angepasst...</p></div>}
            <p style={{fontSize:15,fontWeight:700,color:C.accent}}>{persons}</p>
          </div>
          <div style={{display:"flex",gap:5}}>
            {[1,2,3,4,5,6,7,8].map(n=>(<button key={n} onClick={()=>scaleRecipe(n)} style={{flex:1,padding:"6px 0",borderRadius:8,fontFamily:B,fontSize:12,fontWeight:600,border:`1.5px solid ${persons===n?C.accent:C.cardBorder}`,background:persons===n?C.accentGlow:C.surface,color:persons===n?C.accent:C.textMuted,transition:"all 0.15s"}}>{n}</button>))}
          </div>
        </div>
      </div>

      <div style={{padding:"20px 24px 140px",display:"flex",flexDirection:"column",gap:16}}>
        {/* Ingredients */}
        <div style={{background:C.card,border:`1px solid ${C.cardBorder}`,borderRadius:18,padding:16,boxShadow:C.shadow}}>
          <h3 style={{fontFamily:D,fontSize:16,marginBottom:4}}>🛒 Zutaten</h3>
          <p style={{color:C.textDim,fontSize:11,marginBottom:10}}>Antippen um Einkaufsstatus zu ändern</p>
          {displayRecipe.ingredients?.map((ing,i)=>{ const avail=getAvail(ing); return (
            <div key={i} onClick={()=>toggleAvail(ing.name)} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 0",borderBottom:i<displayRecipe.ingredients.length-1?`1px solid ${C.cardBorder}`:"none",cursor:"pointer"}}>
              <span style={{fontSize:14,color:avail?C.text:C.accent,transition:"color 0.15s"}}>{avail?"✅":"🛒"} {ing.name}</span>
              <span style={{fontSize:13,color:C.textMuted}}>{ing.amount}</span>
            </div>
          );})}
          {missing.length>0&&(<>
            <button onClick={()=>setShowShopping(!showShopping)} style={{marginTop:10,width:"100%",padding:"9px",borderRadius:10,background:C.accentGlow,border:`1px solid ${C.accentDim}`,color:C.accent,fontSize:13,fontWeight:600,fontFamily:B}}>🛒 Einkaufsliste ({missing.length}) {showShopping?"▲":"▼"}</button>
            {showShopping&&<div style={{marginTop:8,padding:10,background:C.surface,borderRadius:10}}>{missing.map((ing,i)=><div key={i} style={{fontSize:13,color:C.accent,padding:"3px 0"}}>• {ing.name} – {ing.amount}</div>)}</div>}
          </>)}
        </div>

        {/* Steps */}
        <div style={{background:C.card,border:`1px solid ${C.cardBorder}`,borderRadius:18,padding:16,boxShadow:C.shadow}}>
          <h3 style={{fontFamily:D,fontSize:16,marginBottom:14,color:C.text}}>👨‍🍳 Zubereitung</h3>
          {displayRecipe.steps?.map((step,i)=>(<div key={i} style={{display:"flex",gap:12,marginBottom:i<displayRecipe.steps.length-1?14:0}}><div style={{minWidth:26,height:26,borderRadius:"50%",background:`linear-gradient(135deg,${C.accent},${C.accentDim})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,color:"#FFFFFF",flexShrink:0}}>{i+1}</div><p style={{fontSize:14,color:C.textMuted,lineHeight:1.6,paddingTop:2}}>{step}</p></div>))}
        </div>

        {displayRecipe.tip&&<div style={{background:C.accentGlow,border:`1px solid ${C.accentDim}`,borderRadius:12,padding:12}}><p style={{fontSize:13,color:C.accent,lineHeight:1.6}}>💡 <strong>Tipp:</strong> {displayRecipe.tip}</p></div>}
      </div>

      {/* Bottom bar */}
      <div style={{position:"fixed",bottom:0,left:0,right:0,background:`linear-gradient(0deg,${C.bg} 70%,rgba(254,252,247,0) 100%)`,padding:"14px 24px 34px",display:"flex",gap:10,maxWidth:430,margin:"0 auto"}}>
        <button onClick={()=>setShowNope(true)} style={{flex:1,padding:"14px",borderRadius:50,border:`1.5px solid ${C.accent}`,background:C.accentGlow,color:C.accent,fontWeight:700,fontSize:14,fontFamily:B}}>🔄 Neuer Vorschlag</button>
        <button onClick={()=>onRate()} style={{flex:2,padding:"14px",borderRadius:50,background:`linear-gradient(135deg,${C.accent},${C.accentDim})`,color:"#FFFFFF",fontWeight:700,fontSize:15,fontFamily:B,boxShadow:"0 6px 20px rgba(44,110,73,0.22)"}}>Fertig ✓</button>
      </div>

      {/* Nope sheet */}
      {showNope&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.7)",display:"flex",alignItems:"flex-end",zIndex:100}} onClick={()=>setShowNope(false)}>
          <div onClick={e=>e.stopPropagation()} style={{background:C.card,borderRadius:"24px 24px 0 0",padding:"24px 24px 48px",width:"100%",border:`1px solid ${C.cardBorder}`,maxWidth:430,margin:"0 auto"}}>
            <div style={{width:36,height:4,borderRadius:2,background:C.cardBorder,margin:"0 auto 20px"}}/>
            <h3 style={{fontFamily:D,fontSize:19,marginBottom:5,color:C.text}}>Andere Idee?</h3>
            <p style={{color:C.textMuted,fontSize:13,marginBottom:18}}>Was passt dir nicht?</p>
            <div style={{display:"flex",flexDirection:"column",gap:10}}>
              {[{label:"Zu aufwendig",desc:"Zeig mir etwas Einfacheres",emoji:"😌",reason:"zu_aufwendig"},{label:"Anderes Gericht",desc:"Komplett andere Richtung",emoji:"🔄",reason:"anderes_gericht"}].map(({label,desc,emoji,reason})=>(
                <button key={reason} onClick={()=>{setShowNope(false);onNope(reason);}} style={{padding:"13px 16px",borderRadius:14,border:`1.5px solid ${C.cardBorder}`,background:C.surface,fontFamily:B,display:"flex",alignItems:"center",gap:12,textAlign:"left",width:"100%"}}>
                  <span style={{fontSize:24,flexShrink:0}}>{emoji}</span>
                  <div><p style={{fontWeight:600,fontSize:14,marginBottom:2}}>{label}</p><p style={{color:C.textMuted,fontSize:12}}>{desc}</p></div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Post-Recipe Rating Modal ──────────────────────────────
function RatingModal({ recipe, profile, onDone }) {
  const [rated, setRated] = useState(false);

  const rate = (val) => {
    if(rated) return;
    setRated(true);
    const rs = store.recipes.load(profile?.id);
    const existing = rs.find(r=>r.name===recipe.name);
    if(existing) {
      const updated = rs.map(r=>r.name===recipe.name?{...r,status:val==="up"?"loved":"saved",ratedAt:new Date().toLocaleDateString("de-DE")}:r).filter(r=>val!=="down"||r.name!==recipe.name);
      store.recipes.save(profile?.id, updated);
    }
    setTimeout(onDone, 800);
  };

  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.75)",display:"flex",alignItems:"flex-end",zIndex:200}}>
      <div style={{background:C.card,borderRadius:"24px 24px 0 0",padding:"28px 24px 52px",width:"100%",border:`1px solid ${C.cardBorder}`,maxWidth:430,margin:"0 auto",animation:"slideUp 0.35s ease"}}>
        <div style={{width:36,height:4,borderRadius:2,background:C.cardBorder,margin:"0 auto 20px"}}/>
        {rated ? (
          <div style={{textAlign:"center",padding:"10px 0"}}>
            <p style={{fontSize:36,marginBottom:8}}>🙏</p>
            <p style={{fontFamily:D,fontSize:18,fontWeight:700}}>Danke für dein Feedback!</p>
          </div>
        ) : (
          <>
            <h3 style={{fontFamily:D,fontSize:20,fontWeight:700,marginBottom:4,textAlign:"center",color:C.text}}>Hat es geschmeckt?</h3>
            <p style={{color:C.textMuted,fontSize:14,marginBottom:24,textAlign:"center"}}>{recipe.name}</p>
            <div style={{display:"flex",gap:12}}>
              <button onClick={()=>rate("up")} style={{flex:1,padding:"16px",borderRadius:16,background:C.greenGlow,border:`1.5px solid ${C.green}`,color:C.green,fontWeight:700,fontSize:15,fontFamily:B,display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
                <span style={{fontSize:28}}>👍</span>War lecker!
              </button>
              <button onClick={()=>rate("down")} style={{flex:1,padding:"16px",borderRadius:16,background:C.dangerGlow,border:`1.5px solid ${C.danger}`,color:C.danger,fontWeight:700,fontSize:15,fontFamily:B,display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
                <span style={{fontSize:28}}>👎</span>Nicht meins
              </button>
            </div>
            <button onClick={onDone} style={{width:"100%",padding:"12px",marginTop:12,color:C.textDim,fontSize:13,fontFamily:B}}>Überspringen</button>
          </>
        )}
      </div>
    </div>
  );
}

// ── Saved Recipes Screen ──────────────────────────────────
function SavedRecipesScreen({ profile, profiles, onBack, onOpen }) {
  const [recipes, setRecipes] = useState([]);
  const [tab, setTab] = useState("saved");
  const [moveTarget, setMoveTarget] = useState(null);
  useEffect(()=>{ setRecipes(store.recipes.load(profile?.id)); },[profile]);
  const update = (u) => { setRecipes(u); store.recipes.save(profile?.id, u); };
  const rate = (id, val) => {
    const u = recipes.map(r=>{ if(r.id!==id) return r; if(val==="up") return {...r,status:"loved",ratedAt:new Date().toLocaleDateString("de-DE")}; return null; }).filter(Boolean);
    update(u);
  };
  const moveToProfile = (recipe, tid) => { update(recipes.filter(r=>r.id!==recipe.id)); const tr=store.recipes.load(tid); store.recipes.save(tid,[{...recipe,profileId:tid},...tr]); setMoveTarget(null); };
  const shown = tab==="loved" ? recipes.filter(r=>r.status==="loved") : recipes.filter(r=>r.status==="saved");
  const others = profiles.filter(p=>p.id!==(profile?.id||null));

  return (
    <div style={{minHeight:"100vh",background:C.bg,padding:"56px 24px 32px",display:"flex",flexDirection:"column"}}>
      <BackBtn onClick={onBack}/>
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:4}}>
        <h2 style={{fontFamily:D,fontSize:24,fontWeight:700}}>Meine Rezepte</h2>
        {profile&&<span style={{fontSize:20}}>{profile.emoji}</span>}
      </div>
      <p style={{color:C.textMuted,fontSize:13,marginBottom:18}}>Gespeichert auf diesem Gerät.</p>
      <div style={{display:"flex",gap:8,marginBottom:18}}>
        {[["saved","📥 Gespeichert"],["loved","❤️ Lieblingsgerichte"]].map(([val,label])=>(
          <button key={val} onClick={()=>setTab(val)} style={{padding:"8px 16px",borderRadius:50,fontFamily:B,fontSize:13,fontWeight:600,border:`1.5px solid ${tab===val?C.accent:C.cardBorder}`,background:tab===val?C.accentGlow:C.card,color:tab===val?C.accent:C.textMuted,transition:"all 0.15s"}}>{label}</button>
        ))}
      </div>
      {shown.length===0 ? (
        <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:12,textAlign:"center"}}>
          <span style={{fontSize:44}}>{tab==="loved"?"❤️":"📭"}</span>
          <p style={{color:C.textMuted,fontSize:15}}>{tab==="loved"?"Noch keine Lieblingsgerichte":"Noch keine Rezepte gespeichert"}</p>
          <p style={{color:C.textDim,fontSize:13}}>{tab==="loved"?"Bewerte gespeicherte Rezepte mit Daumen hoch":"Tippe beim Rezept auf Speichern"}</p>
        </div>
      ) : (
        <div style={{display:"flex",flexDirection:"column",gap:12,overflowY:"auto"}}>
          {shown.map(r=>(
            <div key={r.id} style={{background:C.card,border:`1px solid ${C.cardBorder}`,borderRadius:18,overflow:"hidden"}}>
              <div style={{padding:"14px 16px"}}>
                <div style={{display:"flex",alignItems:"flex-start",gap:10,marginBottom:8}}>
                  <span style={{fontSize:24,flexShrink:0}}>{r.emoji||"🍽"}</span>
                  <div style={{flex:1}}><p style={{fontFamily:D,fontWeight:700,fontSize:14,lineHeight:1.2,marginBottom:2}}>{r.name}</p><p style={{color:C.textMuted,fontSize:11}}>{r.savedAt} · {r.time} · {r.difficulty}</p></div>
                </div>
                <p style={{color:C.textMuted,fontSize:13,lineHeight:1.5,marginBottom:12}}>{r.description}</p>
                {tab==="saved"&&(
                  <div style={{background:C.surface,borderRadius:10,padding:"10px 12px",marginBottom:10}}>
                    <p style={{color:C.textMuted,fontSize:12,marginBottom:7}}>Hast du es schon gekocht? Wie war's?</p>
                    <div style={{display:"flex",gap:8}}>
                      <button onClick={()=>rate(r.id,"up")} style={{flex:1,padding:"9px",borderRadius:10,background:C.greenGlow,border:`1px solid ${C.green}`,color:C.green,fontSize:13,fontFamily:B,fontWeight:600}}>👍 Lecker!</button>
                      <button onClick={()=>rate(r.id,"down")} style={{flex:1,padding:"9px",borderRadius:10,background:C.dangerGlow,border:`1px solid ${C.danger}`,color:C.danger,fontSize:13,fontFamily:B,fontWeight:600}}>👎 Nicht meins</button>
                    </div>
                  </div>
                )}
                <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                  <button onClick={()=>onOpen(r)} style={{flex:1,padding:"9px",borderRadius:12,background:`linear-gradient(135deg,${C.accent},${C.accentDim})`,color:"#FFFFFF",fontWeight:700,fontSize:13,fontFamily:B}}>Rezept öffnen →</button>
                  {others.length>0&&<button onClick={()=>setMoveTarget(moveTarget?.id===r.id?null:r)} style={{padding:"9px 12px",borderRadius:12,background:C.purpleGlow,color:C.purple,fontSize:13,fontFamily:B,border:`1px solid ${C.purple}`}}>↗️</button>}
                  <button onClick={()=>update(recipes.filter(x=>x.id!==r.id))} style={{padding:"9px 12px",borderRadius:12,background:C.dangerGlow,color:C.danger,fontSize:13,fontFamily:B}}>🗑</button>
                </div>
                {moveTarget?.id===r.id&&others.length>0&&(
                  <div style={{marginTop:10,padding:10,background:C.surface,borderRadius:10}}>
                    <p style={{color:C.textMuted,fontSize:12,marginBottom:7}}>In welches Profil verschieben?</p>
                    {others.map(p=>(<button key={p.id} onClick={()=>moveToProfile(r,p.id)} style={{padding:"9px 12px",borderRadius:10,background:C.card,border:`1px solid ${C.cardBorder}`,color:C.text,fontSize:13,fontFamily:B,display:"flex",alignItems:"center",gap:8,width:"100%",marginBottom:5}}><span style={{fontSize:18}}>{p.emoji}</span>{p.name}</button>))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Week Planner ──────────────────────────────────────────
function WeekPlanner({ profile, onBack }) {
  const empty = () => DAYS.map((day,i)=>({day,recipe:null,loading:false,time:i>=5?"Gemütlich":"Normal",device:null}));
  const [phase, setPhase] = useState("setup-ingredients");
  const [wIng, setWIng] = useState([]);
  const [wPrefs, setWPrefs] = useState(null);
  const [week, setWeek] = useState(()=>store.week.load(profile?.id)||empty());
  const [genAll, setGenAll] = useState(false);
  const [viewIdx, setViewIdx] = useState(null);
  const [showShopping, setShowShopping] = useState(false);
  const [shoppingList, setShoppingList] = useState(null);
  const [loadingShopping, setLoadingShopping] = useState(false);
  const [devicePickerIdx, setDevicePickerIdx] = useState(null);

  const genDay = async (idx, cur, prefs, ing, dis, nope=null) => {
    const p = prefs||wPrefs||{time:"Normal",mood:"Herzhaft",portion:2};
    const i = ing!==undefined?ing:wIng;
    const d = dis!==undefined?dis:[];
    setWeek(prev=>prev.map((x,j)=>j===idx?{...x,loading:true}:x));
    const restr = [...(profile?.diet||[]),...(profile?.custom||[])];
    const loved = store.recipes.load(profile?.id).filter(r=>r.status==="loved").slice(0,8).map(r=>r.name);
    const used = (cur||week).filter((_,j)=>j!==idx).map(x=>x.recipe?.name).filter(Boolean);
    const dayTime = cur?(cur[idx]?.time||"Normal"):(week[idx]?.time||"Normal");
    const dayDevice = cur?(cur[idx]?.device?[cur[idx].device]:[]):(week[idx]?.device?[week[idx].device]:[]);
    try {
      const resp = await fetch("/api/claude",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({type:"recipe",ingredients:i,time:p.time||dayTime,mood:p.mood||"Herzhaft",portion:p.portion||2,intolerances:restr,disliked:d,nope,lovedRecipes:loved,avoidNames:used,weekMode:true,preferredCuisines:profile?.cuisines||[],availability:profile?.availability||"supermarkt",devices:dayDevice})});
      const data = await resp.json();
      if(data.recipe){ setWeek(prev=>{ const u=prev.map((x,j)=>j===idx?{...x,recipe:data.recipe,loading:false}:x); store.week.save(profile?.id,u); return u; }); }
      else setWeek(prev=>prev.map((x,j)=>j===idx?{...x,loading:false}:x));
    } catch(e) { setWeek(prev=>prev.map((x,j)=>j===idx?{...x,loading:false}:x)); }
  };

  const generateAll = async (prefs, ing, dis) => {
    setGenAll(true);
    const fresh = empty(); setWeek(fresh);
    const generated = [...fresh];
    for(let i=0;i<7;i++){
      await genDay(i,generated,prefs,ing,dis);
      setWeek(prev=>{ generated.splice(0,7,...prev); return prev; });
      await new Promise(r=>setTimeout(r,100));
    }
    setGenAll(false);
  };

  const saveR = (recipe) => {
    const rs = store.recipes.load(profile?.id);
    store.recipes.save(profile?.id,[{...recipe,id:Date.now(),savedAt:new Date().toLocaleDateString("de-DE"),profileId:profile?.id||null,status:"saved"},...rs.slice(0,49)]);
  };

  const combineShoppingList = async () => {
    setLoadingShopping(true); setShoppingList(null);
    const items = [];
    week.forEach(d=>{ if(d.recipe?.ingredients) d.recipe.ingredients.filter(i=>!i.available).forEach(i=>{ items.push({name:i.name,amount:i.amount,day:d.day}); }); });
    if(items.length===0){ setShoppingList({categories:[]}); setLoadingShopping(false); return; }
    try {
      const resp = await fetch("/api/claude",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({type:"combine-shopping",items})});
      const data = await resp.json();
      setShoppingList(data);
    } catch(e) { console.error(e); } finally { setLoadingShopping(false); }
  };

  if(viewIdx!==null&&week[viewIdx]?.recipe){
    return <RecipeScreen recipe={week[viewIdx].recipe} profile={profile} disliked={[]}
      onNope={(reason)=>{ genDay(viewIdx,week,wPrefs,wIng,[],reason); setViewIdx(null); }}
      onBack={()=>setViewIdx(null)} onRestart={()=>setViewIdx(null)} onViewSaved={()=>setViewIdx(null)}
      onRate={()=>setViewIdx(null)}/>;
  }

  if(phase==="setup-ingredients") return (
    <div style={{minHeight:"100vh",background:C.bg,padding:"56px 24px 32px",display:"flex",flexDirection:"column"}}>
      <BackBtn onClick={onBack}/>
      <PBar step={1} total={3}/>
      <div style={{marginBottom:18}}><h2 style={{fontFamily:D,fontSize:28,fontWeight:700,lineHeight:1.2,marginBottom:4,color:C.text}}>Was ist diese Woche im Kühlschrank?</h2><p style={{color:C.textMuted,fontSize:14}}>Gilt als Basis für alle Tage.</p></div>
      <IngredientsScreen onNext={(ings,must,noShop)=>{setWIng(ings);setPhase("setup-prefs");}} onSkip={()=>{setWIng([]);setPhase("setup-prefs");}}/>
    </div>
  );

  if(phase==="setup-prefs") return (
    <PreferencesScreen profile={profile} step={2} total={3}
      onGenerate={p=>{setWPrefs(p);setPhase("week");generateAll(p,wIng,[]);}}
      onBack={()=>setPhase("setup-ingredients")}/>
  );

  return (
    <div style={{minHeight:"100vh",background:C.bg,padding:"56px 24px 32px",display:"flex",flexDirection:"column"}}>
      <BackBtn onClick={onBack}/>
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:4}}>
        <h2 style={{fontFamily:D,fontSize:24,fontWeight:700}}>Wochenplaner</h2>
        {profile&&<span style={{fontSize:18}}>{profile.emoji}</span>}
      </div>
      <p style={{color:C.textMuted,fontSize:13,marginBottom:14}}>Tippe auf ein Gericht für Details & Nope.</p>

      <div style={{display:"flex",gap:8,marginBottom:10}}>
        <button onClick={()=>setPhase("setup-ingredients")} style={{flex:1,padding:"10px",borderRadius:50,background:C.card,border:`1.5px solid ${C.cardBorder}`,color:C.textMuted,fontWeight:600,fontSize:13,fontFamily:B}}>← Neu planen</button>
        <button onClick={()=>generateAll(wPrefs,wIng,[])} disabled={genAll} style={{flex:2,padding:"10px",borderRadius:50,background:genAll?C.surface:`linear-gradient(135deg,${C.accent},${C.accentDim})`,color:genAll?"#A09080":"#1C1410",fontWeight:700,fontSize:13,fontFamily:B,boxShadow:genAll?"none":"0 4px 16px rgba(44,110,73,0.22)"}}>
          {genAll?"Generiert...":"✨ Alle neu"}
        </button>
      </div>

      {week.some(d=>d.recipe?.ingredients?.some(i=>!i.available))&&(
        <button onClick={()=>{setShowShopping(!showShopping);if(!showShopping&&!shoppingList)combineShoppingList();}} style={{width:"100%",padding:"11px",borderRadius:14,background:showShopping?C.accentGlow:C.card,border:`1.5px solid ${showShopping?C.accent:C.cardBorder}`,color:showShopping?C.accent:C.textMuted,fontWeight:600,fontSize:14,fontFamily:B,marginBottom:10,display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
          🛒 {showShopping?"Einkaufsliste ausblenden":"Wocheneinkaufsliste"}
        </button>
      )}

      {showShopping&&(
        <div style={{background:C.card,border:`1px solid ${C.cardBorder}`,borderRadius:18,padding:16,marginBottom:12}}>
          {loadingShopping?(<div style={{display:"flex",alignItems:"center",gap:10}}><Spin size={18}/><p style={{color:C.textMuted,fontSize:14}}>Liste wird zusammengefasst...</p></div>)
          :shoppingList?.categories?.length===0?(<p style={{color:C.textMuted,fontSize:14}}>Alle Zutaten vorhanden!</p>)
          :shoppingList?(
            <>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
                <h3 style={{fontFamily:D,fontSize:16}}>🛒 Wocheneinkauf</h3>
                <button onClick={combineShoppingList} style={{color:C.accent,fontSize:12,fontFamily:B,padding:"4px 10px",background:C.accentGlow,borderRadius:8}}>↻</button>
              </div>
              {shoppingList.categories.map((cat,ci)=>(
                <div key={ci} style={{marginBottom:14}}>
                  <p style={{color:C.accent,fontSize:10,fontWeight:700,letterSpacing:1.5,textTransform:"uppercase",marginBottom:7}}>{cat.name}</p>
                  {cat.items.map((item,ii)=>(<div key={ii} style={{display:"flex",justifyContent:"space-between",padding:"6px 0",borderBottom:`1px solid ${C.cardBorder}`}}><span style={{fontSize:13}}>🛒 {item.name}</span><span style={{fontSize:12,color:C.textMuted}}>{item.amount}</span></div>))}
                </div>
              ))}
              <button onClick={()=>{ const t=shoppingList.categories.map(c=>c.name+":\n"+c.items.map(i=>"- "+i.name+": "+i.amount).join("\n")).join("\n\n"); navigator.clipboard.writeText(t).catch(()=>{}); }} style={{marginTop:6,width:"100%",padding:"9px",borderRadius:10,background:C.surface,border:`1px solid ${C.cardBorder}`,color:C.textMuted,fontSize:13,fontFamily:B,fontWeight:600}}>📋 Liste kopieren</button>
            </>
          ):null}
        </div>
      )}

      <div style={{display:"flex",flexDirection:"column",gap:10,overflowY:"auto"}}>
        {week.map((d,i)=>(
          <div key={d.day} style={{background:C.card,border:`1px solid ${C.cardBorder}`,borderRadius:18,padding:"14px 16px"}}>
            <div style={{marginBottom:8}}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:6}}>
                <p style={{fontWeight:700,fontSize:15,color:C.accent}}>{d.day}</p>
                <div style={{display:"flex",gap:7}}>
                  {d.recipe&&<button onClick={()=>saveR(d.recipe)} style={{color:C.green,fontSize:12,fontFamily:B,padding:"4px 9px",background:C.greenGlow,borderRadius:8}}>📥</button>}
                  <button onClick={()=>genDay(i,week)} disabled={d.loading||genAll} style={{padding:"5px 11px",borderRadius:10,background:C.accentGlow,border:`1px solid ${C.accentDim}`,color:C.accent,fontSize:12,fontFamily:B,fontWeight:600}}>{d.loading?"...":d.recipe?"🔄":"Generieren"}</button>
                </div>
              </div>
              <div style={{display:"flex",gap:5,marginBottom:6}}>
                {[["Schnell","⚡"],["Normal","🕐"],["Gemütlich","🌿"]].map(([t,e])=>(
                  <button key={t} onClick={()=>setWeek(prev=>{const u=prev.map((x,j)=>j===i?{...x,time:t}:x);store.week.save(profile?.id,u);return u;})} style={{flex:1,padding:"4px 3px",borderRadius:7,fontFamily:B,fontSize:10,fontWeight:500,border:`1px solid ${d.time===t?C.accent:C.cardBorder}`,background:d.time===t?C.accentGlow:C.surface,color:d.time===t?C.accent:C.textMuted,display:"flex",alignItems:"center",justifyContent:"center",gap:2}}><span>{e}</span>{t}</button>
                ))}
              </div>
              <button onClick={()=>setDevicePickerIdx(devicePickerIdx===i?null:i)} style={{padding:"4px 12px",borderRadius:8,fontFamily:B,fontSize:11,fontWeight:500,border:`1px solid ${d.device?C.accent:C.cardBorder}`,background:d.device?C.accentGlow:C.surface,color:d.device?C.accent:C.textMuted,display:"flex",alignItems:"center",gap:5}}>
                {d.device?(DEVICES.find(x=>x.l===d.device)?.e+" "+d.device):"🍳 Gerät (optional)"}
              </button>
              {devicePickerIdx===i&&(
                <div style={{marginTop:6,background:C.surface,borderRadius:10,padding:8,display:"flex",flexWrap:"wrap",gap:6}}>
                  {d.device&&<button onClick={()=>{setWeek(prev=>{const u=prev.map((x,j)=>j===i?{...x,device:null}:x);store.week.save(profile?.id,u);return u;});setDevicePickerIdx(null);}} style={{padding:"5px 10px",borderRadius:8,fontFamily:B,fontSize:12,border:`1px solid ${C.danger}`,background:C.dangerGlow,color:C.danger}}>✕ Kein Gerät</button>}
                  {DEVICES.map(({l,e})=>(<button key={l} onClick={()=>{setWeek(prev=>{const u=prev.map((x,j)=>j===i?{...x,device:l}:x);store.week.save(profile?.id,u);return u;});setDevicePickerIdx(null);}} style={{padding:"5px 10px",borderRadius:8,fontFamily:B,fontSize:12,border:`1px solid ${d.device===l?C.accent:C.cardBorder}`,background:d.device===l?C.accentGlow:C.card,color:d.device===l?C.accent:C.textMuted,display:"flex",alignItems:"center",gap:4}}><span>{e}</span>{l}</button>))}
                </div>
              )}
            </div>
            {d.loading?(<div style={{display:"flex",alignItems:"center",gap:8,padding:"6px 0"}}><Spin size={16}/><p style={{color:C.textMuted,fontSize:13}}>Wird generiert...</p></div>)
            :d.recipe?(<button onClick={()=>setViewIdx(i)} style={{width:"100%",textAlign:"left",background:"transparent",fontFamily:B,padding:0,cursor:"pointer"}}>
                <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:4}}>
                  <span style={{fontSize:20}}>{d.recipe.emoji||"🍽"}</span>
                  <div style={{flex:1}}><p style={{fontWeight:600,fontSize:14,color:C.text}}>{d.recipe.name}</p><p style={{color:C.textMuted,fontSize:12}}>{d.recipe.time} · {d.recipe.difficulty}</p></div>
                  <span style={{color:C.accent,fontSize:16}}>›</span>
                </div>
                <p style={{color:C.textMuted,fontSize:13,lineHeight:1.5}}>{d.recipe.description}</p>
              </button>)
            :(<p style={{color:C.textMuted,fontSize:13,marginTop:4}}>Noch kein Gericht geplant</p>)}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main App ──────────────────────────────────────────────
export default function Mahlzeit() {
  const [screen, setScreen] = useState("splash");
  const [profiles, setProfiles] = useState([]);
  const [activeProfile, setActiveProfile] = useState(null);
  const [ingredients, setIngredients] = useState([]);
  const [mustUse, setMustUse] = useState([]);
  const [noShopping, setNoShopping] = useState(false);
  const [prefs, setPrefs] = useState(null);
  const [recipe, setRecipe] = useState(null);
  const [streamText, setStreamText] = useState("");
  const [rejectedRecipes, setRejectedRecipes] = useState([]);
  const [viewingRecipe, setViewingRecipe] = useState(null);
  const [savedProfile, setSavedProfile] = useState(null);
  const [showRating, setShowRating] = useState(false);
  const [lastSession, setLastSession] = useState(null);

  useEffect(()=>{ setProfiles(store.profiles.load()); setLastSession(store.lastSession.load()); },[]);
  const saveProfiles = (u) => { setProfiles(u); store.profiles.save(u); };

  const callAPI = useCallback(async (finalPrefs, nope=null) => {
    setScreen("loading");
    const restr = [...(activeProfile?.diet||[]),...(activeProfile?.custom||[])];
    const loved = store.recipes.load(activeProfile?.id).filter(r=>r.status==="loved").slice(0,8).map(r=>r.name);
    const lastRecipe = nope && recipe ? recipe.name : null;
    if(nope && recipe) setRejectedRecipes(prev=>[...new Set([...prev, recipe.name])]);
    setStreamText("");

    try {
      const timeMap={"Schnell":"maximal 15 Minuten","Normal":"maximal 30 Minuten","Gemütlich":"60 bis 90 Minuten"};
      const timeLimit=timeMap[finalPrefs.time]||"maximal 30 Minuten";
      const allCuisines=["Italienisch","Asiatisch","Mexikanisch","Mediterran","Deutsch","Indisch","Amerikanisch","Französisch","Griechisch","Japanisch","Marokkanisch","Türkisch","Spanisch","Koreanisch","Vietnamesisch","Libanesisch"];
      const cuisinePool=(activeProfile?.cuisines?.length>0)?activeProfile.cuisines:allCuisines;
      const cuisine=cuisinePool[Math.floor(Math.random()*cuisinePool.length)];
      const reqId=Math.random().toString(36).substring(7);
      const ingList=ingredients?.length>0?ingredients.join(", "):"keine – wähle ein kreatives Gericht";
      const intolHint=restr.length>0?"UNVERTRÄGLICHKEITEN: "+restr.map(i=>({
        "Laktosefrei":"KEIN normaler Käse/Milch/Sahne/Joghurt – laktosefrei oder weglassen",
        "Glutenfrei":"Kein Weizen/Gluten – glutenfrei oder weglassen",
        "Vegetarisch":"Kein Fleisch, kein Fisch","Vegan":"Keine tierischen Produkte",
        "Kein Fisch":"Kein Fisch","Kein Schweinefleisch":"Kein Schweinefleisch",
        "Nussallergie":"Keine Nüsse","Eierallergie":"Keine Eier","Sojaallergie":"Kein Soja","Keine Meeresfrüchte":"Keine Meeresfrüchte",
      }[i]||"Vermeiden: "+i)).join(" | "):"";
      const availHint=activeProfile?.availability==="supermarkt"?"Nur Zutaten aus normalem Supermarkt.":activeProfile?.availability==="markt"?"Gut sortierter Supermarkt ok.":"Alle Zutaten erlaubt.";
      const lines=[availHint];
      if(intolHint) lines.push(intolHint);
      if(finalPrefs.disliked?.length>0) lines.push("Heute nicht: "+finalPrefs.disliked.join(", "));
      if(mustUse?.length>0) lines.push("PFLICHT – diese Zutaten MÜSSEN im Rezept vorkommen: "+mustUse.join(", "));
      if(noShopping) lines.push("KEIN EINKAUF: Nur vorhandene Zutaten. Grundzutaten wie Salz, Pfeffer, Öl, Butter, Mehl, Gewürze darf die KI voraussetzen.");
      if(nope==="zu_aufwendig") lines.push("Einfacheres Gericht bitte.");
      if(nope==="anderes_gericht") lines.push("VÖLLIG andere Küche: "+cuisine);
      const allAvoided=[...rejectedRecipes,...(lastRecipe?[lastRecipe]:[])];
      if(allAvoided.length>0) lines.push("NICHT: "+allAvoided.join(", "));
      if(loved.length>0) lines.push("Lieblingsgerichte (Stil nutzen, nicht wiederholen): "+loved.join(", "));
      if(finalPrefs.devices?.length>0) lines.push("Gerät: "+finalPrefs.devices.join(", "));

      const prompt=`Du bist ein kreativer Küchenchef. [${reqId}]\n\nZutaten: ${ingList}\nZEITLIMIT: ${timeLimit}\nStimmung: ${finalPrefs.mood} | Personen: ${finalPrefs.portion}\n${lines.join("\n")}\n\nREGELN:\n1. Zeitlimit ${timeLimit} einhalten.\n2. Max 1-2 Zutaten nutzen.\n3. available:true NUR wenn Zutat exakt in der Zutatenliste des Nutzers steht. Wenn keine Zutaten angegeben wurden ist available IMMER false.\n4. Küche: ${nope==="anderes_gericht"?cuisine+" – PFLICHT!":cuisine}\n5. Kreativ, kein 08/15-Gericht.\n6. Zutaten nicht still ersetzen.\n7. Unverträglichkeiten haben absolute Priorität.\n8. PORTIONSMENGEN: Realistische Haushaltsmengen – z.B. 80-100g Pasta, 150g Fleisch pro Person.\n\nAntworte NUR mit JSON:\n{"name":"...","emoji":"...","description":"...","time":"...","difficulty":"...","calories":"...","ingredients":[{"name":"...","amount":"...","available":true}],"steps":["..."],"tip":"..."}`;

      const resp = await fetch("/api/stream",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({prompt})});
      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let fullText = ""; let buf = "";
      while(true) {
        const {done,value} = await reader.read(); if(done) break;
        buf += decoder.decode(value,{stream:true});
        const lines2 = buf.split("\n"); buf = lines2.pop()||"";
        for(const line of lines2) {
          if(line.startsWith("data: ")){ try { const d=JSON.parse(line.slice(6)); if(d.text){fullText+=d.text;setStreamText(fullText);} } catch(e){} }
          if(line.startsWith("event: error")) throw new Error("Stream error");
        }
      }
      if(!fullText.trim()){ setScreen("streamError"); return; }
      try {
        const cleaned = fullText.replace(/```json|```/g,"").trim();
        const r = JSON.parse(cleaned);
        setRecipe(r); setScreen("recipe");
        // Save session for quick start
        store.lastSession.save({time:finalPrefs.time,mood:finalPrefs.mood,portion:finalPrefs.portion,devices:finalPrefs.devices||[]});
        setLastSession({time:finalPrefs.time,mood:finalPrefs.mood,portion:finalPrefs.portion});
        // Bump ingredient frequency
        if(ingredients.length>0) store.ingFreq.bump(ingredients);
      } catch(parseErr) {
        try {
          const match = fullText.match(/\{[\s\S]*"name"[\s\S]*"steps"[\s\S]*\]/);
          if(match){ const r=JSON.parse(match[0]+',"tip":"Guten Appetit!"}'); setRecipe(r); setScreen("recipe"); }
          else setScreen("streamError");
        } catch(e) { setScreen("streamError"); }
      }
    } catch(err) { console.error("Stream error:", err.message); setScreen("streamError"); }
  }, [activeProfile, ingredients, mustUse, noShopping, recipe, rejectedRecipes]);

  const handleRate = () => {
    if(recipe) setShowRating(true);
    else { setRecipe(null); setIngredients([]); setMustUse([]); setNoShopping(false); setRejectedRecipes([]); setStreamText(""); setScreen("splash"); }
  };

  const handleRateDone = () => {
    setShowRating(false);
    setRecipe(null); setIngredients([]); setMustUse([]); setNoShopping(false); setRejectedRecipes([]); setStreamText("");
    setScreen("splash");
  };

  return (
    <>
      <Head>
        <title>Mahlzeit</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1"/>
        <meta name="theme-color" content="#2C6E49"/>
        <link rel="manifest" href="/manifest.json"/>
        <meta name="apple-mobile-web-app-capable" content="yes"/>
        <link rel="preconnect" href="https://fonts.googleapis.com"/>
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous"/>
        <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet"/>
        <style>{`
          * { margin:0; padding:0; box-sizing:border-box; -webkit-tap-highlight-color:transparent; }
          body { background:#FEFCF7; color:#1C1410; font-family:'DM Sans',sans-serif; }
          input, button, textarea { background:none; border:none; outline:none; color:inherit; cursor:pointer; }
          h1,h2,h3,h4 { color:#1C1410; }
          @keyframes spin { to { transform:rotate(360deg); } }
          @keyframes bounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
          @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
          @keyframes fadeUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
          @keyframes slideUp { from{transform:translateY(100%)} to{transform:translateY(0)} }
        `}</style>
      </Head>
      <div style={{maxWidth:430,margin:"0 auto",minHeight:"100vh",background:C.bg,overflowX:"hidden"}}>
        {screen==="splash"&&<SplashScreen profiles={profiles} lastSession={lastSession} onStart={(p)=>{setActiveProfile(p);setScreen("ingredients");}} onQuickStart={(p,session)=>{setActiveProfile(p);setPrefs(session);setScreen("ingredients");}} onManageProfiles={()=>setScreen("profiles")} onViewSaved={(p)=>{setSavedProfile(p);setScreen("saved");}} onWeekPlanner={(p)=>{setActiveProfile(p);setScreen("week");}}/>}
        {screen==="profiles"&&<ProfileManager profiles={profiles} onSave={saveProfiles} onBack={()=>setScreen("splash")}/>}
        {screen==="ingredients"&&<IngredientsPage onNext={(ings,must,noShop)=>{setIngredients(ings);setMustUse(must||[]);setNoShopping(noShop||false);setScreen("preferences");}} onSkip={(ings,noShop)=>{setIngredients([]);setMustUse([]);setNoShopping(false);setScreen("preferences");}}/>}
        {screen==="preferences"&&<PreferencesScreen profile={activeProfile} defaultPrefs={prefs} onGenerate={p=>{setPrefs(p);callAPI(p);}} onBack={()=>setScreen("ingredients")}/>}
        {screen==="loading"&&<LoadingScreen streamText={streamText}/>}
        {screen==="recipe"&&<RecipeScreen recipe={recipe} profile={activeProfile} disliked={prefs?.disliked||[]} onNope={r=>callAPI(prefs,r)} onBack={()=>setScreen("preferences")} onRestart={()=>{setRecipe(null);setIngredients([]);setMustUse([]);setNoShopping(false);setRejectedRecipes([]);setStreamText("");setScreen("splash");}} onViewSaved={()=>{setSavedProfile(activeProfile);setScreen("saved");}} onRate={handleRate}/>}
        {screen==="streamError"&&(
          <div style={{minHeight:"100vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:32,textAlign:"center",background:C.bg}}>
            <span style={{fontSize:48,marginBottom:20}}>😕</span>
            <h2 style={{fontFamily:D,fontSize:24,fontWeight:700,marginBottom:10}}>Etwas ist schiefgelaufen</h2>
            <p style={{color:C.textMuted,fontSize:14,lineHeight:1.6,marginBottom:28,maxWidth:280}}>Das Rezept konnte nicht geladen werden – meistens liegt das an einer instabilen Verbindung.</p>
            <button onClick={()=>{setStreamText("");callAPI(prefs);}} style={{background:`linear-gradient(135deg,${C.accent},${C.accentDim})`,color:"#FFFFFF",fontWeight:700,fontSize:15,padding:"15px 40px",borderRadius:50,fontFamily:B,marginBottom:12}}>🔄 Nochmal versuchen</button>
            <button onClick={()=>{setStreamText("");setScreen("preferences");}} style={{color:C.textMuted,fontSize:14,padding:"10px",fontFamily:B}}>← Einstellungen ändern</button>
          </div>
        )}
        {screen==="saved"&&<SavedRecipesScreen profile={savedProfile} profiles={profiles} onBack={()=>setScreen(recipe?"recipe":"splash")} onOpen={(r)=>{setViewingRecipe(r);setScreen("viewRecipe");}}/>}
        {screen==="viewRecipe"&&viewingRecipe&&<RecipeScreen recipe={viewingRecipe} profile={activeProfile} disliked={[]} onNope={()=>setScreen("saved")} onBack={()=>setScreen("saved")} onRestart={()=>{setViewingRecipe(null);setScreen("splash");}} onViewSaved={()=>setScreen("saved")} onRate={()=>setScreen("saved")}/>}
        {screen==="week"&&<WeekPlanner profile={activeProfile} onBack={()=>setScreen("splash")}/>}
      </div>
      {showRating&&recipe&&<RatingModal recipe={recipe} profile={activeProfile} onDone={handleRateDone}/>}
    </>
  );
}
