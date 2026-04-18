import { useState, useEffect } from "react";
import Head from "next/head";

const C = {
  bg:"#0f0e0c", card:"#1a1815", cardBorder:"#2a2620",
  accent:"#f5a623", accentDim:"#c47d0e", accentGlow:"rgba(245,166,35,0.15)",
  text:"#f0ebe3", textMuted:"#8a8070", textDim:"#4a4438", surface:"#221f1a",
  danger:"#e05a5a", dangerGlow:"rgba(224,90,90,0.15)",
  green:"#5ab97a", greenGlow:"rgba(90,185,122,0.12)",
  purple:"#a78bfa", purpleGlow:"rgba(167,139,250,0.12)",
};
const DISPLAY = "'Playfair Display', serif";
const BODY = "'DM Sans', sans-serif";

// ── Storage ──────────────────────────────────────────────
const store = {
  profiles: {
    save: (p) => { try { localStorage.setItem("mz_profiles", JSON.stringify(p)); } catch(e) {} },
    load: () => { try { return JSON.parse(localStorage.getItem("mz_profiles") || "[]"); } catch(e) { return []; } },
  },
  recipes: {
    key: (profileId) => `mz_recipes_${profileId || "global"}`,
    save: (profileId, r) => { try { localStorage.setItem(store.recipes.key(profileId), JSON.stringify(r)); } catch(e) {} },
    load: (profileId) => { try { return JSON.parse(localStorage.getItem(store.recipes.key(profileId)) || "[]"); } catch(e) { return []; } },
    allProfileIds: () => {
      try {
        return Object.keys(localStorage).filter(k=>k.startsWith("mz_recipes_")).map(k=>k.replace("mz_recipes_",""));
      } catch(e) { return []; }
    },
  },
  week: {
    key: (profileId) => `mz_week_${profileId || "global"}`,
    save: (profileId, w) => { try { localStorage.setItem(store.week.key(profileId), JSON.stringify(w)); } catch(e) {} },
    load: (profileId) => { try { return JSON.parse(localStorage.getItem(store.week.key(profileId)) || "null"); } catch(e) { return null; } },
  },
};

const DAYS = ["Montag","Dienstag","Mittwoch","Donnerstag","Freitag","Samstag","Sonntag"];

// ── Components ────────────────────────────────────────────
const Chip = ({ label, color, dimColor, glowColor, onRemove }) => (
  <span style={{ display:"inline-flex", alignItems:"center", gap:6, background:glowColor||C.accentGlow, border:`1px solid ${dimColor||C.accentDim}`, borderRadius:20, padding:"5px 12px", fontSize:13, color:color||C.accent, fontWeight:500 }}>
    {label}{onRemove && <button onClick={onRemove} style={{ color:dimColor||C.accentDim, fontSize:16, lineHeight:1 }}>×</button>}
  </span>
);

const TagToggle = ({ label, emoji, selected, color, glowColor, onClick }) => (
  <button onClick={onClick} style={{ padding:"9px 13px", borderRadius:12, fontFamily:BODY, border:`1.5px solid ${selected?(color||C.accent):C.cardBorder}`, background:selected?(glowColor||C.accentGlow):C.card, color:selected?(color||C.accent):C.textMuted, fontSize:13, fontWeight:500, display:"flex", alignItems:"center", gap:7, transition:"all 0.2s" }}>
    <span style={{fontSize:15}}>{emoji}</span>{label}
  </button>
);

const SectionLabel = ({ children }) => (
  <p style={{ color:C.textMuted, fontSize:11, fontWeight:600, letterSpacing:1.5, textTransform:"uppercase", marginBottom:10 }}>{children}</p>
);

const BigButton = ({ label, onClick, disabled, secondary }) => (
  <button onClick={onClick} disabled={disabled} style={{ width:"100%", padding:"16px", borderRadius:50, fontFamily:BODY, background:secondary?"transparent":disabled?C.surface:`linear-gradient(135deg,${C.accent},${C.accentDim})`, color:secondary?C.textMuted:disabled?C.textDim:"#0f0e0c", border:secondary?`1.5px solid ${C.cardBorder}`:"none", fontWeight:700, fontSize:15, transition:"all 0.3s", boxShadow:(!secondary&&!disabled)?`0 8px 32px rgba(245,166,35,0.22)`:"none" }}>
    {label}
  </button>
);

const ProgressBar = ({ step, total }) => (
  <div style={{ display:"flex", gap:6, marginBottom:20 }}>
    {Array.from({length:total}).map((_,i)=>(
      <div key={i} style={{ height:3, flex:1, borderRadius:2, background:i<step?C.accent:C.cardBorder, transition:"background 0.3s" }}/>
    ))}
  </div>
);

const Spinner = ({ size=28, color=C.accent }) => (
  <div style={{ width:size, height:size, borderRadius:"50%", border:`3px solid ${C.cardBorder}`, borderTopColor:color, animation:"spin 0.8s linear infinite", flexShrink:0 }}/>
);

// ── Profile components ────────────────────────────────────
const DIET_OPTIONS = [
  {l:"Vegetarisch",e:"🥦"},{l:"Vegan",e:"🌱"},{l:"Kein Fleisch",e:"🚫🥩"},
  {l:"Kein Fisch",e:"🚫🐟"},{l:"Kein Schweinefleisch",e:"🚫🐷"},{l:"Low Carb",e:"🥑"},
  {l:"Glutenfrei",e:"🌾"},{l:"Laktosefrei",e:"🥛"},{l:"Nussallergie",e:"🥜"},
  {l:"Eierallergie",e:"🥚"},{l:"Sojaallergie",e:"🫘"},{l:"Keine Meeresfrüchte",e:"🦐"},
];

function ProfileEditor({ profile, onSave, onCancel, isNew }) {
  const [name, setName] = useState(profile?.name || "");
  const [emoji, setEmoji] = useState(profile?.emoji || "🧑");
  const [diet, setDiet] = useState(profile?.diet || []);
  const [custom, setCustom] = useState(profile?.custom || []);
  const [customInput, setCustomInput] = useState("");
  const EMOJIS = ["🧑","👩","👨","👧","👦","👶","🧓","👴","👵","🐱","🐶","⭐"];
  const toggle = (val) => setDiet(p => p.includes(val)?p.filter(x=>x!==val):[...p,val]);
  const addCustom = () => { const v=customInput.trim(); if(v&&!custom.includes(v)) setCustom(p=>[...p,v]); setCustomInput(""); };
  return (
    <div style={{ minHeight:"100vh", background:C.bg, padding:"56px 24px 40px", display:"flex", flexDirection:"column", overflowY:"auto" }}>
      <button onClick={onCancel} style={{ color:C.textMuted, fontSize:14, marginBottom:20, display:"flex", alignItems:"center", gap:6 }}>← Zurück</button>
      <h2 style={{ fontFamily:DISPLAY, fontSize:26, fontWeight:700, marginBottom:6 }}>{isNew?"Neues Profil":"Profil bearbeiten"}</h2>
      <p style={{ color:C.textMuted, fontSize:14, marginBottom:24 }}>Einmal einrichten, immer berücksichtigt.</p>
      <div style={{ marginBottom:20 }}>
        <SectionLabel>Name</SectionLabel>
        <div style={{ background:C.card, border:`1.5px solid ${C.cardBorder}`, borderRadius:14, padding:"4px 16px" }}>
          <input value={name} onChange={e=>setName(e.target.value)} placeholder="z.B. Mama, Papa, Ich..." style={{ width:"100%", fontSize:15, padding:"13px 0" }}/>
        </div>
      </div>
      <div style={{ marginBottom:20 }}>
        <SectionLabel>Avatar</SectionLabel>
        <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
          {EMOJIS.map(e=>(<button key={e} onClick={()=>setEmoji(e)} style={{ width:44, height:44, borderRadius:12, fontSize:22, border:`2px solid ${emoji===e?C.accent:C.cardBorder}`, background:emoji===e?C.accentGlow:C.card }}>{e}</button>))}
        </div>
      </div>
      <div style={{ marginBottom:20 }}>
        <SectionLabel>🚫 Ernährung & Unverträglichkeiten</SectionLabel>
        <div style={{ display:"flex", flexWrap:"wrap", gap:8, marginBottom:12 }}>
          {DIET_OPTIONS.map(({l,e})=>(<TagToggle key={l} label={l} emoji={e} selected={diet.includes(l)} color={C.danger} glowColor={C.dangerGlow} onClick={()=>toggle(l)}/>))}
        </div>
        <div style={{ background:C.card, border:`1px solid ${C.cardBorder}`, borderRadius:14, padding:"4px 14px", display:"flex", alignItems:"center", gap:8 }}>
          <input value={customInput} onChange={e=>setCustomInput(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"){e.preventDefault();addCustom();}}} placeholder="Weitere Einschränkung..." style={{ flex:1, fontSize:14, padding:"12px 0" }}/>
          {customInput && <button onClick={addCustom} style={{ background:C.danger, color:"#fff", borderRadius:8, padding:"6px 12px", fontSize:13, fontWeight:600 }}>+</button>}
        </div>
        {custom.length>0 && <div style={{ display:"flex", flexWrap:"wrap", gap:6, marginTop:10 }}>{custom.map(c=><Chip key={c} label={c} color={C.danger} dimColor="#b03030" glowColor={C.dangerGlow} onRemove={()=>setCustom(p=>p.filter(x=>x!==c))}/>)}</div>}
      </div>
      <div style={{flex:1}}/>
      <BigButton label={isNew?"Profil erstellen ✓":"Speichern ✓"} onClick={()=>{ if(name.trim()) onSave({ name:name.trim(), emoji, diet, custom, id:profile?.id||Date.now() }); }} disabled={!name.trim()}/>
    </div>
  );
}

function ProfileManager({ profiles, onSave, onBack }) {
  const [editing, setEditing] = useState(null);
  if (editing) {
    return <ProfileEditor profile={editing==="new"?null:editing} isNew={editing==="new"} onSave={(p)=>{ const updated=editing==="new"?[...profiles,p]:profiles.map(x=>x.id===p.id?p:x); onSave(updated); setEditing(null); }} onCancel={()=>setEditing(null)}/>;
  }
  return (
    <div style={{ minHeight:"100vh", background:C.bg, padding:"56px 24px 40px", display:"flex", flexDirection:"column" }}>
      <button onClick={onBack} style={{ color:C.textMuted, fontSize:14, marginBottom:20, display:"flex", alignItems:"center", gap:6 }}>← Zurück</button>
      <h2 style={{ fontFamily:DISPLAY, fontSize:26, fontWeight:700, marginBottom:6 }}>Profile</h2>
      <p style={{ color:C.textMuted, fontSize:14, marginBottom:28 }}>Jedes Profil hat eigene Rezepte & Einstellungen.</p>
      <div style={{ display:"flex", flexDirection:"column", gap:12, marginBottom:24 }}>
        {profiles.map(p=>(
          <div key={p.id} style={{ background:C.card, border:`1px solid ${C.cardBorder}`, borderRadius:16, padding:"16px 18px", display:"flex", alignItems:"center", gap:14 }}>
            <span style={{fontSize:28}}>{p.emoji}</span>
            <div style={{flex:1}}>
              <p style={{fontWeight:600,fontSize:15}}>{p.name}</p>
              {([...p.diet||[],...p.custom||[]]).length>0 && <p style={{fontSize:12,color:C.textMuted,marginTop:3}}>{[...p.diet,...p.custom].join(" · ")}</p>}
            </div>
            <div style={{display:"flex",gap:8}}>
              <button onClick={()=>setEditing(p)} style={{color:C.accent,fontSize:13,fontFamily:BODY,padding:"6px 12px",background:C.accentGlow,borderRadius:8}}>✏️</button>
              <button onClick={()=>onSave(profiles.filter(x=>x.id!==p.id))} style={{color:C.danger,fontSize:13,fontFamily:BODY,padding:"6px 12px",background:C.dangerGlow,borderRadius:8}}>✕</button>
            </div>
          </div>
        ))}
      </div>
      <button onClick={()=>setEditing("new")} style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:10, padding:"16px", borderRadius:16, border:`1.5px dashed ${C.cardBorder}`, color:C.textMuted, fontSize:15, fontFamily:BODY, background:"transparent", width:"100%" }}>➕ Neues Profil</button>
    </div>
  );
}

// ── Splash ────────────────────────────────────────────────
function SplashScreen({ profiles, onStart, onManageProfiles, onViewSaved, onWeekPlanner }) {
  const [selected, setSelected] = useState(null);
  useEffect(()=>{ if(profiles.length>0) setSelected(profiles[0].id); },[profiles]);
  return (
    <div style={{ minHeight:"100vh", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", background:`radial-gradient(ellipse at 60% 20%, rgba(245,166,35,0.08) 0%, transparent 60%), ${C.bg}`, padding:32, textAlign:"center" }}>
      <div style={{ animation:"bounce 2s ease-in-out infinite", marginBottom:20 }}><span style={{fontSize:56}}>🍳</span></div>
      <h1 style={{ fontFamily:DISPLAY, fontSize:42, fontWeight:700, lineHeight:1.1, marginBottom:6 }}>Mahl<span style={{color:C.accent}}>zeit</span></h1>
      <p style={{ color:C.textMuted, fontSize:14, marginBottom:32 }}>Nie wieder grübeln was du kochen sollst.</p>
      {profiles.length>0 ? (
        <div style={{ width:"100%", maxWidth:320, marginBottom:24 }}>
          <SectionLabel>Wer kocht heute?</SectionLabel>
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            {profiles.map(p=>(
              <button key={p.id} onClick={()=>setSelected(p.id)} style={{ display:"flex", alignItems:"center", gap:14, padding:"14px 18px", borderRadius:16, border:`2px solid ${selected===p.id?C.accent:C.cardBorder}`, background:selected===p.id?C.accentGlow:C.card, width:"100%", textAlign:"left" }}>
                <span style={{fontSize:28}}>{p.emoji}</span>
                <div style={{flex:1}}>
                  <p style={{ fontWeight:600, fontSize:15, color:selected===p.id?C.accent:C.text }}>{p.name}</p>
                  {([...p.diet||[],...p.custom||[]]).length>0 && <p style={{ fontSize:12, color:C.textMuted, marginTop:2 }}>{[...p.diet,...p.custom].slice(0,3).join(" · ")}{[...p.diet,...p.custom].length>3?" …":""}</p>}
                </div>
                {selected===p.id && <span style={{color:C.accent,fontSize:18}}>✓</span>}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div style={{ marginBottom:24, padding:20, background:C.card, border:`1px dashed ${C.cardBorder}`, borderRadius:18, maxWidth:300 }}>
          <p style={{ color:C.textMuted, fontSize:14, lineHeight:1.6 }}>Erstelle ein Profil um Unverträglichkeiten und Rezepte dauerhaft zu speichern.</p>
        </div>
      )}
      <div style={{ display:"flex", flexDirection:"column", gap:10, width:"100%", maxWidth:320 }}>
        <button onClick={()=>onStart(profiles.find(p=>p.id===selected)||null)} style={{ background:`linear-gradient(135deg,${C.accent},${C.accentDim})`, color:"#0f0e0c", fontWeight:700, fontSize:16, padding:"16px 52px", borderRadius:50, fontFamily:BODY, boxShadow:`0 8px 32px rgba(245,166,35,0.3)` }}>Los geht's →</button>
        <button onClick={()=>onWeekPlanner(profiles.find(p=>p.id===selected)||null)} style={{ background:C.card, border:`1.5px solid ${C.cardBorder}`, color:C.text, fontWeight:600, fontSize:15, padding:"14px", borderRadius:50, fontFamily:BODY }}>📅 Wochenplaner</button>
        <button onClick={onManageProfiles} style={{ color:C.textMuted, fontSize:14, padding:"10px", fontFamily:BODY }}>{profiles.length>0?"⚙️ Profile verwalten":"➕ Profil erstellen"}</button>
        <button onClick={()=>onViewSaved(profiles.find(p=>p.id===selected)||null)} style={{ color:C.textMuted, fontSize:14, padding:"6px", fontFamily:BODY }}>📚 Meine Rezepte</button>
      </div>
      <p style={{ color:C.textDim, fontSize:12, marginTop:16 }}>Powered by Claude AI</p>
    </div>
  );
}

// ── Ingredients ───────────────────────────────────────────
function IngredientsScreen({ onNext, onSkip }) {
  const [input, setInput] = useState(""); const [ingredients, setIngredients] = useState([]);
  const [scanning, setScanning] = useState(false); const [scanDone, setScanDone] = useState(false); const [scanError, setScanError] = useState(false);
  const add = () => { const v=input.trim(); if(v&&!ingredients.includes(v)) setIngredients(p=>[...p,v]); setInput(""); };
  const handleKey = e => { if(e.key==="Enter"||e.key===","){e.preventDefault();add();} };
  const handleScan = async (e) => {
    const file=e.target.files?.[0]; if(!file) return;
    setScanning(true); setScanDone(false); setScanError(false);
    try {
      const compressed = await new Promise((res,rej)=>{ const img=new Image(),url=URL.createObjectURL(file); img.onload=()=>{ const c=document.createElement("canvas"),MAX=1024;let w=img.width,h=img.height;if(w>MAX||h>MAX){if(w>h){h=Math.round(h*MAX/w);w=MAX;}else{w=Math.round(w*MAX/h);h=MAX;}}c.width=w;c.height=h;c.getContext("2d").drawImage(img,0,0,w,h);URL.revokeObjectURL(url);res(c.toDataURL("image/jpeg",0.8).split(",")[1]);};img.onerror=rej;img.src=url; });
      const resp=await fetch("/api/claude",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({type:"scan",base64:compressed,mimeType:"image/jpeg"})});
      const data=await resp.json();
      if(data.ingredients?.length){ setIngredients(prev=>{const c=[...prev];data.ingredients.forEach(f=>{if(!c.includes(f))c.push(f);});return c;}); setScanDone(true); } else setScanError(true);
    } catch(err){ setScanError(true); } finally{ setScanning(false); e.target.value=""; }
  };
  const suggestions=["Eier","Nudeln","Tomaten","Käse","Hähnchen","Zwiebeln","Knoblauch","Reis","Kartoffeln","Paprika","Speck","Lachs","Tofu","Linsen"];
  return (
    <div style={{ minHeight:"100vh", background:C.bg, padding:"56px 24px 32px", display:"flex", flexDirection:"column" }}>
      <ProgressBar step={1} total={3}/>
      <div style={{ marginBottom:20 }}><h2 style={{ fontFamily:DISPLAY, fontSize:28, fontWeight:700, lineHeight:1.2, marginBottom:6 }}>Was hast du im Kühlschrank?</h2><p style={{ color:C.textMuted, fontSize:14 }}>Foto scannen, eintippen – oder überspringen.</p></div>
      <label style={{ background:scanning?C.surface:`linear-gradient(135deg,rgba(245,166,35,0.18),rgba(196,125,14,0.1))`, border:`1.5px dashed ${scanning?C.cardBorder:scanError?C.danger:C.accentDim}`, borderRadius:18, padding:"18px 16px", marginBottom:14, display:"flex", alignItems:"center", gap:14, width:"100%", cursor:scanning?"default":"pointer", boxSizing:"border-box" }}>
        <input type="file" accept="image/*" onChange={handleScan} disabled={scanning} style={{display:"none"}}/>
        {scanning?(<><Spinner/><div><p style={{color:C.accent,fontWeight:600,fontSize:14,marginBottom:2}}>KI analysiert Foto...</p><p style={{color:C.textMuted,fontSize:12}}>Zutaten werden erkannt</p></div></>)
        :scanDone?(<><div style={{width:36,height:36,borderRadius:12,background:C.greenGlow,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20}}>✅</div><div><p style={{color:C.green,fontWeight:600,fontSize:14,marginBottom:2}}>Zutaten erkannt!</p><p style={{color:C.textMuted,fontSize:12}}>Erneut scannen für mehr</p></div></>)
        :scanError?(<><div style={{width:36,height:36,borderRadius:12,background:C.dangerGlow,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20}}>❌</div><div><p style={{color:C.danger,fontWeight:600,fontSize:14,marginBottom:2}}>Scan fehlgeschlagen</p><p style={{color:C.textMuted,fontSize:12}}>Erneut versuchen oder manuell eingeben</p></div></>)
        :(<><div style={{width:36,height:36,borderRadius:12,background:C.accentGlow,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20}}>📸</div><div><p style={{color:C.accent,fontWeight:600,fontSize:14,marginBottom:2}}>Kühlschrank / Vorratskammer scannen</p><p style={{color:C.textMuted,fontSize:12}}>KI erkennt Zutaten automatisch</p></div></>)}
      </label>
      <div style={{ background:C.card, border:`1.5px solid ${C.cardBorder}`, borderRadius:18, padding:"4px 16px", display:"flex", alignItems:"center", gap:10, marginBottom:14 }}>
        <span style={{fontSize:18}}>✏️</span>
        <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={handleKey} placeholder="Oder manuell eingeben..." style={{flex:1,fontSize:15,padding:"14px 0"}}/>
        {input&&<button onClick={add} style={{background:C.accent,color:"#0f0e0c",borderRadius:8,padding:"6px 14px",fontWeight:700,fontSize:13}}>+</button>}
      </div>
      {ingredients.length>0&&<div style={{display:"flex",flexWrap:"wrap",gap:8,marginBottom:14}}>{ingredients.map(ing=><Chip key={ing} label={ing} onRemove={()=>setIngredients(p=>p.filter(i=>i!==ing))}/>)}</div>}
      <div style={{marginBottom:24}}><SectionLabel>Schnellauswahl</SectionLabel><div style={{display:"flex",flexWrap:"wrap",gap:8}}>{suggestions.filter(s=>!ingredients.includes(s)).map(s=>(<button key={s} onClick={()=>setIngredients(p=>[...p,s])} style={{background:C.surface,border:`1px solid ${C.cardBorder}`,borderRadius:20,padding:"7px 14px",color:C.textMuted,fontSize:13,fontFamily:BODY}}>{s}</button>))}</div></div>
      <div style={{flex:1}}/>
      <div style={{display:"flex",flexDirection:"column",gap:10}}>
        <BigButton label="Weiter →" onClick={()=>onNext(ingredients)} disabled={ingredients.length===0}/>
        <BigButton label="🔍 Ohne Zutaten entdecken" onClick={onSkip} secondary/>
      </div>
    </div>
  );
}

// ── Disliked ──────────────────────────────────────────────
function DislikedScreen({ onNext, onBack }) {
  const [disliked,setDisliked]=useState([]); const [customInput,setCustomInput]=useState("");
  const DISLIKE=[{l:"Rosenkohl",e:"🥦"},{l:"Leber",e:"🫀"},{l:"Fenchel",e:"🌿"},{l:"Oliven",e:"🫒"},{l:"Pilze",e:"🍄"},{l:"Aubergine",e:"🍆"},{l:"Spinat",e:"🥬"},{l:"Knoblauch",e:"🧄"},{l:"Zwiebeln",e:"🧅"},{l:"Koriander",e:"🌿"},{l:"Rosinen",e:"🍇"},{l:"Sardinen",e:"🐟"}];
  const toggle=(val)=>setDisliked(p=>p.includes(val)?p.filter(x=>x!==val):[...p,val]);
  const addCustom=()=>{const v=customInput.trim();if(v&&!disliked.includes(v))setDisliked(p=>[...p,v]);setCustomInput("");};
  return (
    <div style={{ minHeight:"100vh", background:C.bg, padding:"56px 24px 32px", display:"flex", flexDirection:"column" }}>
      <button onClick={onBack} style={{ color:C.textMuted, fontSize:14, marginBottom:14, display:"flex", alignItems:"center", gap:6 }}>← Zurück</button>
      <ProgressBar step={2} total={3}/>
      <div style={{ marginBottom:24 }}><h2 style={{ fontFamily:DISPLAY, fontSize:28, fontWeight:700, lineHeight:1.2, marginBottom:6 }}>Heute keine Lust auf...?</h2><p style={{ color:C.textMuted, fontSize:14 }}>Optional – nur für heute.</p></div>
      <div style={{display:"flex",flexWrap:"wrap",gap:8,marginBottom:14}}>{DISLIKE.map(({l,e})=><TagToggle key={l} label={l} emoji={e} selected={disliked.includes(l)} color={C.textMuted} glowColor={C.surface} onClick={()=>toggle(l)}/>)}</div>
      <div style={{ background:C.card, border:`1px solid ${C.cardBorder}`, borderRadius:14, padding:"4px 14px", display:"flex", alignItems:"center", gap:8, marginBottom:14 }}>
        <input value={customInput} onChange={e=>setCustomInput(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"){e.preventDefault();addCustom();}}} placeholder="Etwas anderes..." style={{flex:1,fontSize:14,padding:"12px 0"}}/>
        {customInput&&<button onClick={addCustom} style={{background:C.textMuted,color:C.bg,borderRadius:8,padding:"6px 12px",fontSize:13,fontWeight:600}}>+</button>}
      </div>
      {disliked.length>0&&<div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:14}}>{disliked.map(d=><Chip key={d} label={d} color={C.textMuted} dimColor={C.textDim} glowColor={C.surface} onRemove={()=>setDisliked(p=>p.filter(x=>x!==d))}/>)}</div>}
      <div style={{flex:1}}/><BigButton label="Weiter →" onClick={()=>onNext(disliked)}/>
    </div>
  );
}

// ── Preferences ───────────────────────────────────────────
function PreferencesScreen({ profile, onGenerate, onBack }) {
  const [time,setTime]=useState(null); const [mood,setMood]=useState(null); const [portion,setPortion]=useState(null);
  const ready=time&&mood&&portion;
  return (
    <div style={{ minHeight:"100vh", background:C.bg, padding:"56px 24px 32px", display:"flex", flexDirection:"column" }}>
      <button onClick={onBack} style={{ color:C.textMuted, fontSize:14, marginBottom:14, display:"flex", alignItems:"center", gap:6 }}>← Zurück</button>
      <ProgressBar step={3} total={3}/>
      <div style={{ marginBottom:26 }}><h2 style={{ fontFamily:DISPLAY, fontSize:28, fontWeight:700, lineHeight:1.2, marginBottom:6 }}>Wie ist deine Stimmung?</h2>{profile&&<p style={{color:C.accent,fontSize:13}}>{profile.emoji} {profile.name}</p>}</div>
      <div style={{display:"flex",flexDirection:"column",gap:22}}>
        <div><SectionLabel>⏱ Wie viel Zeit hast du?</SectionLabel><div style={{display:"flex",gap:8}}>{[["Schnell","⚡","≤15 Min"],["Normal","🕐","30 Min"],["Gemütlich","🌿","60+ Min"]].map(([l,e,s])=>(<button key={l} onClick={()=>setTime(l)} style={{flex:1,padding:"13px 8px",borderRadius:14,fontFamily:BODY,border:`1.5px solid ${time===l?C.accent:C.cardBorder}`,background:time===l?C.accentGlow:C.card,color:time===l?C.accent:C.textMuted,fontSize:12,fontWeight:500,display:"flex",flexDirection:"column",alignItems:"center",gap:4}}><span style={{fontSize:22}}>{e}</span><span style={{fontWeight:600}}>{l}</span><span style={{fontSize:11,opacity:0.7}}>{s}</span></button>))}</div></div>
        <div><SectionLabel>🍽 Worauf hast du Hunger?</SectionLabel><div style={{display:"flex",gap:8,flexWrap:"wrap"}}>{[["Herzhaft","🥩"],["Leicht","🥗"],["Comfort","🫕"],["Überrasch mich!","🎲"]].map(([l,e])=>(<button key={l} onClick={()=>setMood(l)} style={{flex:1,minWidth:"45%",padding:"12px 6px",borderRadius:14,fontFamily:BODY,border:`1.5px solid ${mood===l?C.accent:C.cardBorder}`,background:mood===l?C.accentGlow:C.card,color:mood===l?C.accent:C.textMuted,fontSize:12,fontWeight:500,display:"flex",flexDirection:"column",alignItems:"center",gap:4}}><span style={{fontSize:20}}>{e}</span>{l}</button>))}</div></div>
        <div><SectionLabel>👥 Für wie viele Personen?</SectionLabel><div style={{display:"flex",gap:8}}>{[["1","🧑"],["2","👫"],["3–4","👨‍👩‍👧"],["5+","🎉"]].map(([l,e])=>(<button key={l} onClick={()=>setPortion(l)} style={{flex:1,padding:"13px 8px",borderRadius:14,fontFamily:BODY,border:`1.5px solid ${portion===l?C.accent:C.cardBorder}`,background:portion===l?C.accentGlow:C.card,color:portion===l?C.accent:C.textMuted,fontSize:13,fontWeight:500,display:"flex",flexDirection:"column",alignItems:"center",gap:4}}><span style={{fontSize:22}}>{e}</span>{l}</button>))}</div></div>
      </div>
      <div style={{flex:1}}/><BigButton label="✨ Rezept generieren" onClick={()=>ready&&onGenerate({time,mood,portion})} disabled={!ready} style={{marginTop:24}}/>
    </div>
  );
}

// ── Loading ───────────────────────────────────────────────
function LoadingScreen({ message="Ich koche für dich..." }) {
  const [step,setStep]=useState(0);
  const steps=["Analysiere deine Präferenzen...","Kreiere das perfekte Rezept...","Fast fertig..."];
  useEffect(()=>{const t1=setTimeout(()=>setStep(1),1800);const t2=setTimeout(()=>setStep(2),3500);return()=>{clearTimeout(t1);clearTimeout(t2);};},[]);
  return (
    <div style={{minHeight:"100vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:32,textAlign:"center",background:`radial-gradient(ellipse at 50% 40%, rgba(245,166,35,0.06) 0%, transparent 60%), ${C.bg}`}}>
      <span style={{fontSize:56,display:"block",marginBottom:32,animation:"bounce 1s ease-in-out infinite"}}>👨‍🍳</span>
      <h2 style={{fontFamily:DISPLAY,fontSize:26,fontWeight:700,marginBottom:12}}>{message}</h2>
      <p style={{color:C.accent,fontSize:14,fontWeight:500,animation:"pulse 1.5s ease-in-out infinite"}}>{steps[step]}</p>
      <div style={{display:"flex",gap:6,marginTop:32}}>{steps.map((_,i)=><div key={i} style={{width:i<=step?24:8,height:8,borderRadius:4,background:i<=step?C.accent:C.cardBorder,transition:"all 0.4s"}}/>)}</div>
    </div>
  );
}

// ── Recipe Screen ─────────────────────────────────────────
function RecipeScreen({ recipe, profile, disliked, onNope, onRestart, onBack, onViewSaved }) {
  const [showNope,setShowNope]=useState(false); const [showShopping,setShowShopping]=useState(false);
  const [saved,setSaved]=useState(false); const [saveAnim,setSaveAnim]=useState(false);
  if(!recipe) return null;
  const missing=recipe.ingredients?.filter(i=>!i.available)||[];
  const allRestrictions=[...(profile?.diet||[]),...(profile?.custom||[])];

  const handleSave = () => {
    const recipes=store.recipes.load(profile?.id);
    const entry={...recipe, id:Date.now(), savedAt:new Date().toLocaleDateString("de-DE"), profileId:profile?.id||null, status:"saved"};
    store.recipes.save(profile?.id,[entry,...recipes.slice(0,49)]);
    setSaved(true); setSaveAnim(true); setTimeout(()=>setSaveAnim(false),800);
  };

  return (
    <div style={{minHeight:"100vh",background:C.bg}}>
      <div style={{background:`linear-gradient(180deg,rgba(245,166,35,0.1) 0%,transparent 100%)`,padding:"60px 24px 28px",borderBottom:`1px solid ${C.cardBorder}`,animation:"fadeUp 0.5s ease"}}>
        <button onClick={onBack} style={{color:C.textMuted,fontSize:14,display:"flex",alignItems:"center",gap:6,marginBottom:14}}>← Einstellungen ändern</button>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:14}}>
          <div style={{flex:1,paddingRight:16}}>
            <p style={{color:C.accent,fontSize:11,fontWeight:700,letterSpacing:2,textTransform:"uppercase",marginBottom:6}}>🎯 Dein Rezept</p>
            <h1 style={{fontFamily:DISPLAY,fontSize:26,fontWeight:700,lineHeight:1.2}}>{recipe.name}</h1>
          </div>
          <div style={{background:C.card,border:`1px solid ${C.cardBorder}`,borderRadius:14,padding:"10px 12px",fontSize:28,flexShrink:0}}>{recipe.emoji||"🍽"}</div>
        </div>
        <div style={{display:"flex",gap:8,marginBottom:14,flexWrap:"wrap"}}>
          <button onClick={handleSave} style={{display:"flex",alignItems:"center",gap:6,padding:"8px 14px",borderRadius:50,border:`1.5px solid ${saved?C.green:C.cardBorder}`,background:saved?C.greenGlow:C.card,color:saved?C.green:C.textMuted,fontSize:13,fontWeight:600,fontFamily:BODY,transition:"all 0.3s",transform:saveAnim?"scale(1.08)":"scale(1)"}}>
            {saved?"✅ Gespeichert":"📥 Speichern"}
          </button>
          <button onClick={onViewSaved} style={{display:"flex",alignItems:"center",gap:6,padding:"8px 14px",borderRadius:50,border:`1px solid ${C.cardBorder}`,background:C.card,color:C.textMuted,fontSize:13,fontFamily:BODY}}>📚 Meine Rezepte</button>
        </div>
        <p style={{color:C.textMuted,fontSize:14,lineHeight:1.6,marginBottom:14}}>{recipe.description}</p>
        <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:(allRestrictions.length||disliked?.length)?12:0}}>
          {[["⏱",recipe.time],["📊",recipe.difficulty],["🔥",recipe.calories]].map(([icon,val])=>(<div key={val} style={{background:C.card,border:`1px solid ${C.cardBorder}`,borderRadius:10,padding:"7px 12px",display:"flex",alignItems:"center",gap:5,fontSize:12,color:C.textMuted}}>{icon} {val}</div>))}
        </div>
        {(allRestrictions.length>0||disliked?.length>0)&&<div style={{display:"flex",flexWrap:"wrap",gap:6}}>{allRestrictions.map(r=><Chip key={r} label={r} color={C.danger} dimColor="#b03030" glowColor={C.dangerGlow}/>)}{disliked?.map(d=><Chip key={d} label={`Kein ${d}`} color={C.textMuted} dimColor={C.textDim} glowColor={C.surface}/>)}</div>}
      </div>

      <div style={{padding:"22px 24px 140px",display:"flex",flexDirection:"column",gap:18}}>
        <div style={{background:C.card,border:`1px solid ${C.cardBorder}`,borderRadius:18,padding:18}}>
          <h3 style={{fontFamily:DISPLAY,fontSize:17,marginBottom:14}}>🛒 Zutaten</h3>
          {recipe.ingredients?.map((ing,i)=>(<div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"9px 0",borderBottom:i<recipe.ingredients.length-1?`1px solid ${C.cardBorder}`:"none"}}><span style={{fontSize:14,color:ing.available?C.text:C.accent}}>{ing.available?"✅":"🛒"} {ing.name}</span><span style={{fontSize:13,color:C.textMuted}}>{ing.amount}</span></div>))}
          {missing.length>0&&(<><button onClick={()=>setShowShopping(!showShopping)} style={{marginTop:12,width:"100%",padding:"10px",borderRadius:10,background:C.accentGlow,border:`1px solid ${C.accentDim}`,color:C.accent,fontSize:13,fontWeight:600,fontFamily:BODY}}>🛒 Einkaufsliste ({missing.length}) {showShopping?"▲":"▼"}</button>{showShopping&&<div style={{marginTop:10,padding:12,background:C.surface,borderRadius:10}}>{missing.map((ing,i)=><div key={i} style={{fontSize:13,color:C.accent,padding:"4px 0"}}>• {ing.name} – {ing.amount}</div>)}</div>}</>)}
        </div>
        <div style={{background:C.card,border:`1px solid ${C.cardBorder}`,borderRadius:18,padding:18}}>
          <h3 style={{fontFamily:DISPLAY,fontSize:17,marginBottom:14}}>👨‍🍳 Zubereitung</h3>
          <div style={{display:"flex",flexDirection:"column",gap:16}}>{recipe.steps?.map((step,i)=>(<div key={i} style={{display:"flex",gap:14,alignItems:"flex-start"}}><div style={{minWidth:28,height:28,borderRadius:"50%",background:`linear-gradient(135deg,${C.accent},${C.accentDim})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:700,color:"#0f0e0c",flexShrink:0}}>{i+1}</div><p style={{fontSize:14,color:C.textMuted,lineHeight:1.6,paddingTop:4}}>{step}</p></div>))}</div>
        </div>
        {recipe.tip&&<div style={{background:C.accentGlow,border:`1px solid ${C.accentDim}`,borderRadius:14,padding:14}}><p style={{fontSize:13,color:C.accent,lineHeight:1.6}}>💡 <strong>Tipp:</strong> {recipe.tip}</p></div>}
      </div>

      <div style={{position:"fixed",bottom:0,left:0,right:0,background:`linear-gradient(0deg,${C.bg} 70%,transparent)`,padding:"16px 24px 36px",display:"flex",gap:10,maxWidth:430,margin:"0 auto"}}>
        <button onClick={()=>setShowNope(true)} style={{flex:1,padding:"15px",borderRadius:50,border:`1.5px solid ${C.cardBorder}`,background:C.card,color:C.textMuted,fontWeight:600,fontSize:15,fontFamily:BODY}}>😑 Nope</button>
        <button onClick={onRestart} style={{flex:2,padding:"15px",borderRadius:50,background:`linear-gradient(135deg,${C.accent},${C.accentDim})`,color:"#0f0e0c",fontWeight:700,fontSize:15,fontFamily:BODY,boxShadow:`0 8px 24px rgba(245,166,35,0.3)`}}>Fertig ✓</button>
      </div>

      {showNope&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.7)",display:"flex",alignItems:"flex-end",zIndex:100}} onClick={()=>setShowNope(false)}>
          <div onClick={e=>e.stopPropagation()} style={{background:C.card,borderRadius:"24px 24px 0 0",padding:"28px 24px 52px",width:"100%",border:`1px solid ${C.cardBorder}`,animation:"slideUp 0.35s ease",maxWidth:430,margin:"0 auto"}}>
            <div style={{width:36,height:4,borderRadius:2,background:C.cardBorder,margin:"0 auto 24px"}}/>
            <h3 style={{fontFamily:DISPLAY,fontSize:20,marginBottom:6}}>Kein Hunger drauf?</h3>
            <p style={{color:C.textMuted,fontSize:14,marginBottom:20}}>Was ist das Problem?</p>
            <div style={{display:"flex",flexDirection:"column",gap:10}}>
              {[{label:"Zu aufwendig",desc:"Zeig mir was Schnelleres",emoji:"😴",reason:"zu_aufwendig"},{label:"Anderes Gericht",desc:"Komplett andere Küche und Stil",emoji:"🔄",reason:"anderes_gericht"},{label:"Lieber bestellen",desc:"Öffnet Lieferando",emoji:"🛵",reason:"bestellen"}].map(({label,desc,emoji,reason})=>(
                <button key={reason} onClick={()=>{setShowNope(false);if(reason==="bestellen"){window.open("https://www.lieferando.de","_blank");}else{onNope(reason);}}} style={{padding:"14px 16px",borderRadius:14,border:`1.5px solid ${C.cardBorder}`,background:C.surface,color:C.text,fontFamily:BODY,display:"flex",alignItems:"center",gap:14,textAlign:"left",width:"100%"}}>
                  <span style={{fontSize:26,flexShrink:0}}>{emoji}</span><div><p style={{fontWeight:600,fontSize:14,marginBottom:2}}>{label}</p><p style={{color:C.textMuted,fontSize:12}}>{desc}</p></div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Saved Recipes Screen ──────────────────────────────────
function SavedRecipesScreen({ profile, profiles, onBack, onOpen }) {
  const [recipes,setRecipes]=useState([]);
  const [tab,setTab]=useState("saved"); // saved | loved
  const [moveTarget,setMoveTarget]=useState(null); // recipe being moved

  useEffect(()=>{ setRecipes(store.recipes.load(profile?.id)); },[profile]);

  const updateRecipes = (updated) => { setRecipes(updated); store.recipes.save(profile?.id, updated); };

  const rate = (id, rating) => {
    const updated = recipes.map(r => {
      if(r.id!==id) return r;
      if(rating==="up") return {...r, status:"loved", ratedAt:new Date().toLocaleDateString("de-DE")};
      return null; // thumbs down = delete
    }).filter(Boolean);
    updateRecipes(updated);
  };

  const deleteRecipe = (id) => updateRecipes(recipes.filter(r=>r.id!==id));

  const moveToProfile = (recipe, targetProfileId) => {
    // Remove from current profile
    updateRecipes(recipes.filter(r=>r.id!==recipe.id));
    // Add to target profile
    const targetRecipes = store.recipes.load(targetProfileId);
    store.recipes.save(targetProfileId, [{...recipe, profileId:targetProfileId}, ...targetRecipes]);
    setMoveTarget(null);
  };

  const shown = tab==="loved" ? recipes.filter(r=>r.status==="loved") : recipes.filter(r=>r.status==="saved");
  const otherProfiles = profiles.filter(p=>p.id!==(profile?.id||null));

  return (
    <div style={{minHeight:"100vh",background:C.bg,padding:"56px 24px 32px",display:"flex",flexDirection:"column"}}>
      <button onClick={onBack} style={{color:C.textMuted,fontSize:14,marginBottom:20,display:"flex",alignItems:"center",gap:6}}>← Zurück</button>
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:4}}>
        <h2 style={{fontFamily:DISPLAY,fontSize:24,fontWeight:700}}>Meine Rezepte</h2>
        {profile&&<span style={{fontSize:20}}>{profile.emoji}</span>}
      </div>
      <p style={{color:C.textMuted,fontSize:13,marginBottom:20}}>Gespeichert auf diesem Gerät.</p>

      <div style={{display:"flex",gap:8,marginBottom:20}}>
        {[["saved","📥 Gespeichert"],["loved","❤️ Lieblingsgerichte"]].map(([val,label])=>(
          <button key={val} onClick={()=>setTab(val)} style={{padding:"9px 16px",borderRadius:50,fontFamily:BODY,fontSize:13,fontWeight:600,border:`1.5px solid ${tab===val?C.accent:C.cardBorder}`,background:tab===val?C.accentGlow:C.card,color:tab===val?C.accent:C.textMuted,transition:"all 0.2s"}}>{label}</button>
        ))}
      </div>

      {shown.length===0 ? (
        <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:12,textAlign:"center"}}>
          <span style={{fontSize:48}}>{tab==="loved"?"❤️":"📭"}</span>
          <p style={{color:C.textMuted,fontSize:15}}>{tab==="loved"?"Noch keine Lieblingsgerichte":"Noch keine Rezepte gespeichert"}</p>
          <p style={{color:C.textDim,fontSize:13}}>{tab==="loved"?"Bewerte gespeicherte Rezepte mit 👍":"Tippe beim Rezept auf „Speichern""}</p>
        </div>
      ) : (
        <div style={{display:"flex",flexDirection:"column",gap:12,overflowY:"auto"}}>
          {shown.map(r=>(
            <div key={r.id} style={{background:C.card,border:`1px solid ${C.cardBorder}`,borderRadius:18,overflow:"hidden"}}>
              <div style={{padding:"16px 18px"}}>
                <div style={{display:"flex",alignItems:"flex-start",gap:12,marginBottom:8}}>
                  <span style={{fontSize:26,flexShrink:0}}>{r.emoji||"🍽"}</span>
                  <div style={{flex:1}}>
                    <p style={{fontFamily:DISPLAY,fontWeight:700,fontSize:15,lineHeight:1.2,marginBottom:3}}>{r.name}</p>
                    <p style={{color:C.textMuted,fontSize:12}}>{r.savedAt} · {r.time} · {r.difficulty}</p>
                  </div>
                </div>
                <p style={{color:C.textMuted,fontSize:13,lineHeight:1.5,marginBottom:12}}>{r.description}</p>

                {/* Rating buttons for "saved" tab */}
                {tab==="saved" && (
                  <div style={{background:C.surface,borderRadius:12,padding:"12px 14px",marginBottom:12}}>
                    <p style={{color:C.textMuted,fontSize:12,marginBottom:8}}>Hast du es schon gekocht? Wie war's?</p>
                    <div style={{display:"flex",gap:8}}>
                      <button onClick={()=>rate(r.id,"up")} style={{flex:1,padding:"10px",borderRadius:10,background:C.greenGlow,border:`1px solid ${C.green}`,color:C.green,fontSize:14,fontFamily:BODY,fontWeight:600}}>
                        👍 Hat geschmeckt!
                      </button>
                      <button onClick={()=>rate(r.id,"down")} style={{flex:1,padding:"10px",borderRadius:10,background:C.dangerGlow,border:`1px solid ${C.danger}`,color:C.danger,fontSize:14,fontFamily:BODY,fontWeight:600}}>
                        👎 Nicht meins
                      </button>
                    </div>
                  </div>
                )}

                <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                  <button onClick={()=>onOpen(r)} style={{flex:1,padding:"10px",borderRadius:12,background:`linear-gradient(135deg,${C.accent},${C.accentDim})`,color:"#0f0e0c",fontWeight:700,fontSize:13,fontFamily:BODY}}>Rezept öffnen →</button>
                  {otherProfiles.length>0 && (
                    <button onClick={()=>setMoveTarget(moveTarget?.id===r.id?null:r)} style={{padding:"10px 12px",borderRadius:12,background:C.purpleGlow,color:C.purple,fontSize:13,fontFamily:BODY,border:`1px solid ${C.purple}`}}>↗️</button>
                  )}
                  <button onClick={()=>deleteRecipe(r.id)} style={{padding:"10px 12px",borderRadius:12,background:C.dangerGlow,color:C.danger,fontSize:13,fontFamily:BODY}}>🗑</button>
                </div>

                {/* Move to profile panel */}
                {moveTarget?.id===r.id && otherProfiles.length>0 && (
                  <div style={{marginTop:10,padding:12,background:C.surface,borderRadius:12,animation:"fadeIn 0.2s ease"}}>
                    <p style={{color:C.textMuted,fontSize:12,marginBottom:8}}>In welches Profil verschieben?</p>
                    <div style={{display:"flex",flexDirection:"column",gap:6}}>
                      {otherProfiles.map(p=>(
                        <button key={p.id} onClick={()=>moveToProfile(r,p.id)} style={{padding:"10px 14px",borderRadius:10,background:C.card,border:`1px solid ${C.cardBorder}`,color:C.text,fontSize:13,fontFamily:BODY,display:"flex",alignItems:"center",gap:10,textAlign:"left"}}>
                          <span style={{fontSize:20}}>{p.emoji}</span>{p.name}
                        </button>
                      ))}
                    </div>
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
  const emptyWeek = () => DAYS.map(day=>({day, recipe:null, loading:false}));
  const [week,setWeek]=useState(()=>store.week.load(profile?.id)||emptyWeek());
  const [generatingAll,setGeneratingAll]=useState(false);

  const saveWeek = (w) => { setWeek(w); store.week.save(profile?.id, w); };

  const generateDay = async (dayIndex, existing=[]) => {
    setWeek(prev=>prev.map((d,i)=>i===dayIndex?{...d,loading:true}:d));
    const restrictions=[...(profile?.diet||[]),...(profile?.custom||[])];
    const lovedRecipes=store.recipes.load(profile?.id).filter(r=>r.status==="loved").slice(0,8).map(r=>r.name);
    const usedThisWeek=existing.filter((_,i)=>i!==dayIndex).map(d=>d.recipe?.name).filter(Boolean);
    try {
      const resp=await fetch("/api/claude",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({type:"recipe",ingredients:[],time:"Normal",mood:"Herzhaft",portion:"2",intolerances:restrictions,disliked:[],nope:null,lovedRecipes,avoidNames:usedThisWeek,weekMode:true})});
      const data=await resp.json();
      if(data.recipe){
        setWeek(prev=>{const updated=prev.map((d,i)=>i===dayIndex?{...d,recipe:data.recipe,loading:false}:d);store.week.save(profile?.id,updated);return updated;});
      }
    } catch(e){ setWeek(prev=>prev.map((d,i)=>i===dayIndex?{...d,loading:false}:d)); }
  };

  const generateAll = async () => {
    setGeneratingAll(true);
    const current=week.map(d=>({...d,recipe:null,loading:false}));
    setWeek(current);
    for(let i=0;i<7;i++){
      await generateDay(i, current.map((d,idx)=>idx<i?week[idx]:d));
    }
    setGeneratingAll(false);
  };

  const saveRecipe = (recipe) => {
    const recipes=store.recipes.load(profile?.id);
    const entry={...recipe,id:Date.now(),savedAt:new Date().toLocaleDateString("de-DE"),profileId:profile?.id||null,status:"saved"};
    store.recipes.save(profile?.id,[entry,...recipes.slice(0,49)]);
  };

  return (
    <div style={{minHeight:"100vh",background:C.bg,padding:"56px 24px 32px",display:"flex",flexDirection:"column"}}>
      <button onClick={onBack} style={{color:C.textMuted,fontSize:14,marginBottom:20,display:"flex",alignItems:"center",gap:6}}>← Zurück</button>
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:6}}>
        <h2 style={{fontFamily:DISPLAY,fontSize:26,fontWeight:700}}>Wochenplaner</h2>
        {profile&&<span style={{fontSize:20}}>{profile.emoji}</span>}
      </div>
      <p style={{color:C.textMuted,fontSize:13,marginBottom:20}}>KI plant deine Woche – einzelne Tage neu generieren.</p>

      <button onClick={generateAll} disabled={generatingAll} style={{display:"flex",alignItems:"center",justifyContent:"center",gap:10,padding:"14px",borderRadius:50,background:generatingAll?C.surface:`linear-gradient(135deg,${C.accent},${C.accentDim})`,color:generatingAll?C.textDim:"#0f0e0c",fontWeight:700,fontSize:15,fontFamily:BODY,marginBottom:24,boxShadow:generatingAll?"none":`0 8px 24px rgba(245,166,35,0.25)`}}>
        {generatingAll?<><Spinner size={20} color={C.textDim}/> Wird generiert...</>:"✨ Ganze Woche generieren"}
      </button>

      <div style={{display:"flex",flexDirection:"column",gap:12,overflowY:"auto"}}>
        {week.map((d,i)=>(
          <div key={d.day} style={{background:C.card,border:`1px solid ${C.cardBorder}`,borderRadius:18,padding:"16px 18px"}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:d.recipe?12:0}}>
              <p style={{fontWeight:700,fontSize:15,color:C.accent}}>{d.day}</p>
              <div style={{display:"flex",gap:8,alignItems:"center"}}>
                {d.recipe&&<button onClick={()=>saveRecipe(d.recipe)} style={{color:C.green,fontSize:12,fontFamily:BODY,padding:"5px 10px",background:C.greenGlow,borderRadius:8}}>📥</button>}
                <button onClick={()=>generateDay(i,week)} disabled={d.loading||generatingAll} style={{display:"flex",alignItems:"center",gap:6,padding:"7px 12px",borderRadius:10,background:C.accentGlow,border:`1px solid ${C.accentDim}`,color:C.accent,fontSize:12,fontFamily:BODY,fontWeight:600}}>
                  {d.loading?<Spinner size={14}/>:"🔄"} {d.recipe?"Neu":"Generieren"}
                </button>
              </div>
            </div>
            {d.loading ? (
              <div style={{display:"flex",alignItems:"center",gap:10,padding:"8px 0"}}>
                <Spinner size={18}/><p style={{color:C.textMuted,fontSize:13}}>Wird generiert...</p>
              </div>
            ) : d.recipe ? (
              <div>
                <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:6}}>
                  <span style={{fontSize:24}}>{d.recipe.emoji||"🍽"}</span>
                  <div>
                    <p style={{fontWeight:600,fontSize:14}}>{d.recipe.name}</p>
                    <p style={{color:C.textMuted,fontSize:12}}>{d.recipe.time} · {d.recipe.difficulty}</p>
                  </div>
                </div>
                <p style={{color:C.textMuted,fontSize:13,lineHeight:1.5}}>{d.recipe.description}</p>
              </div>
            ) : (
              <p style={{color:C.textDim,fontSize:13,marginTop:6}}>Noch kein Gericht geplant</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main App ──────────────────────────────────────────────
export default function Mahlzeit() {
  const [screen,setScreen]=useState("splash");
  const [profiles,setProfiles]=useState([]);
  const [activeProfile,setActiveProfile]=useState(null);
  const [ingredients,setIngredients]=useState([]);
  const [disliked,setDisliked]=useState([]);
  const [prefs,setPrefs]=useState(null);
  const [recipe,setRecipe]=useState(null);
  const [viewingRecipe,setViewingRecipe]=useState(null);
  const [savedProfile,setSavedProfile]=useState(null);

  useEffect(()=>{ setProfiles(store.profiles.load()); },[]);

  const saveProfiles=(updated)=>{ setProfiles(updated); store.profiles.save(updated); };

  const callAPI=async(finalPrefs,nope=null)=>{
    setScreen("loading");
    const restrictions=[...(activeProfile?.diet||[]),...(activeProfile?.custom||[])];
    const lovedRecipes=store.recipes.load(activeProfile?.id).filter(r=>r.status==="loved").slice(0,8).map(r=>r.name);
    try {
      const resp=await fetch("/api/claude",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({type:"recipe",ingredients,time:finalPrefs.time,mood:finalPrefs.mood,portion:finalPrefs.portion,intolerances:restrictions,disliked,nope,lovedRecipes})});
      const data=await resp.json();
      if(data.recipe){setRecipe(data.recipe);setScreen("recipe");}
    } catch(err){
      setRecipe({name:"Pasta Aglio e Olio",emoji:"🍝",description:"Klassisch italienisch. Wenige Zutaten, maximaler Geschmack.",time:"20 Min",difficulty:"Einfach",calories:"ca. 420 kcal",ingredients:[{name:"Spaghetti",amount:"200g",available:true},{name:"Knoblauch",amount:"4 Zehen",available:true},{name:"Olivenöl",amount:"4 EL",available:false},{name:"Petersilie",amount:"1 Bund",available:false}],steps:["Pasta al dente kochen.","Knoblauch in Öl goldbraun anbraten.","Pasta abgießen, Kochwasser aufheben.","Alles vermengen und servieren."],tip:"Das Kochwasser macht die Sauce cremig!"});
      setScreen("recipe");
    }
  };

  return (
    <>
      <Head>
        <title>Mahlzeit</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1"/>
        <meta name="theme-color" content="#f5a623"/>
        <link rel="manifest" href="/manifest.json"/>
        <meta name="apple-mobile-web-app-capable" content="yes"/>
      </Head>
      <div style={{maxWidth:430,margin:"0 auto",minHeight:"100vh",background:C.bg,overflowX:"hidden"}}>
        {screen==="splash"&&<SplashScreen profiles={profiles} onStart={(p)=>{setActiveProfile(p);setScreen("ingredients");}} onManageProfiles={()=>setScreen("profiles")} onViewSaved={(p)=>{setSavedProfile(p);setScreen("saved");}} onWeekPlanner={(p)=>{setActiveProfile(p);setScreen("week");}}/>}
        {screen==="profiles"&&<ProfileManager profiles={profiles} onSave={saveProfiles} onBack={()=>setScreen("splash")}/>}
        {screen==="ingredients"&&<IngredientsScreen onNext={ings=>{setIngredients(ings);setScreen("disliked");}} onSkip={()=>{setIngredients([]);setScreen("disliked");}}/>}
        {screen==="disliked"&&<DislikedScreen onNext={d=>{setDisliked(d);setScreen("preferences");}} onBack={()=>setScreen("ingredients")}/>}
        {screen==="preferences"&&<PreferencesScreen profile={activeProfile} onGenerate={p=>{setPrefs(p);callAPI(p);}} onBack={()=>setScreen("disliked")}/>}
        {screen==="loading"&&<LoadingScreen/>}
        {screen==="recipe"&&<RecipeScreen recipe={recipe} profile={activeProfile} disliked={disliked} onNope={r=>callAPI(prefs,r)} onBack={()=>setScreen("preferences")} onRestart={()=>{setRecipe(null);setIngredients([]);setDisliked([]);setScreen("splash");}} onViewSaved={()=>{setSavedProfile(activeProfile);setScreen("saved");}}/>}
        {screen==="saved"&&<SavedRecipesScreen profile={savedProfile} profiles={profiles} onBack={()=>setScreen(recipe?"recipe":"splash")} onOpen={(r)=>{setViewingRecipe(r);setScreen("viewRecipe");}}/>}
        {screen==="viewRecipe"&&viewingRecipe&&<RecipeScreen recipe={viewingRecipe} profile={activeProfile} disliked={[]} onNope={()=>setScreen("saved")} onBack={()=>setScreen("saved")} onRestart={()=>{setViewingRecipe(null);setScreen("splash");}} onViewSaved={()=>setScreen("saved")}/>}
        {screen==="week"&&<WeekPlanner profile={activeProfile} onBack={()=>setScreen("splash")}/>}
      </div>
    </>
  );
}
