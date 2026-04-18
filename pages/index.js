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
const D = "'Playfair Display', serif";
const B = "'DM Sans', sans-serif";

const store = {
  profiles: {
    save: (p) => { try { localStorage.setItem("mz_profiles", JSON.stringify(p)); } catch(e) {} },
    load: () => { try { return JSON.parse(localStorage.getItem("mz_profiles") || "[]"); } catch(e) { return []; } },
  },
  recipes: {
    save: (pid, r) => { try { localStorage.setItem("mz_recipes_" + (pid || "global"), JSON.stringify(r)); } catch(e) {} },
    load: (pid) => { try { return JSON.parse(localStorage.getItem("mz_recipes_" + (pid || "global")) || "[]"); } catch(e) { return []; } },
  },
  week: {
    save: (pid, w) => { try { localStorage.setItem("mz_week_" + (pid || "global"), JSON.stringify(w)); } catch(e) {} },
    load: (pid) => { try { return JSON.parse(localStorage.getItem("mz_week_" + (pid || "global")) || "null"); } catch(e) { return null; } },
  },
};

const DAYS = ["Montag","Dienstag","Mittwoch","Donnerstag","Freitag","Samstag","Sonntag"];

const Chip = ({ label, color, dimColor, glowColor, onRemove }) => (
  <span style={{ display:"inline-flex", alignItems:"center", gap:6, background:glowColor||C.accentGlow, border:`1px solid ${dimColor||C.accentDim}`, borderRadius:20, padding:"5px 12px", fontSize:13, color:color||C.accent, fontWeight:500 }}>
    {label}{onRemove && <button onClick={onRemove} style={{ color:dimColor||C.accentDim, fontSize:16, lineHeight:1 }}>x</button>}
  </span>
);

const TagToggle = ({ label, emoji, selected, color, glowColor, onClick }) => (
  <button onClick={onClick} style={{ padding:"9px 13px", borderRadius:12, fontFamily:B, border:`1.5px solid ${selected?(color||C.accent):C.cardBorder}`, background:selected?(glowColor||C.accentGlow):C.card, color:selected?(color||C.accent):C.textMuted, fontSize:13, fontWeight:500, display:"flex", alignItems:"center", gap:7, transition:"all 0.2s" }}>
    <span style={{fontSize:15}}>{emoji}</span>{label}
  </button>
);

const SL = ({ children }) => <p style={{ color:C.textMuted, fontSize:11, fontWeight:600, letterSpacing:1.5, textTransform:"uppercase", marginBottom:10 }}>{children}</p>;

const BigBtn = ({ label, onClick, disabled, secondary }) => (
  <button onClick={onClick} disabled={disabled} style={{ width:"100%", padding:"16px", borderRadius:50, fontFamily:B, background:secondary?"transparent":disabled?C.surface:`linear-gradient(135deg,${C.accent},${C.accentDim})`, color:secondary?C.textMuted:disabled?C.textDim:"#0f0e0c", border:secondary?`1.5px solid ${C.cardBorder}`:"none", fontWeight:700, fontSize:15, transition:"all 0.3s", boxShadow:(!secondary&&!disabled)?"0 8px 32px rgba(245,166,35,0.22)":"none" }}>{label}</button>
);

const PBar = ({ step, total }) => (
  <div style={{ display:"flex", gap:6, marginBottom:20 }}>
    {Array.from({length:total}).map((_,i)=>(<div key={i} style={{ height:3, flex:1, borderRadius:2, background:i<step?C.accent:C.cardBorder }}/>))}
  </div>
);

const Spin = ({ size=28 }) => <div style={{ width:size, height:size, borderRadius:"50%", border:`3px solid ${C.cardBorder}`, borderTopColor:C.accent, animation:"spin 0.8s linear infinite", flexShrink:0 }}/>;

const DIET = [
  {l:"Vegetarisch",e:"🥦"},{l:"Vegan",e:"🌱"},{l:"Kein Fleisch",e:"🚫"},
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

// ── Profile Editor ────────────────────────────────────────
function ProfileEditor({ profile, onSave, onCancel, isNew }) {
  const [name,setName]=useState(profile?.name||"");
  const [emoji,setEmoji]=useState(profile?.emoji||"🧑");
  const [diet,setDiet]=useState(profile?.diet||[]);
  const [custom,setCustom]=useState(profile?.custom||[]);
  const [ci,setCi]=useState("");
  const [cuisines,setCuisines]=useState(profile?.cuisines||[]);
  const [availability,setAvailability]=useState(profile?.availability||"supermarkt");
  const EMOJIS=["🧑","👩","👨","👧","👦","👶","🧓","👴","👵","🐱","🐶","⭐"];
  const toggle=(v)=>setDiet(p=>p.includes(v)?p.filter(x=>x!==v):[...p,v]);
  const addC=()=>{const v=ci.trim();if(v&&!custom.includes(v))setCustom(p=>[...p,v]);setCi("");};
  return (
    <div style={{ minHeight:"100vh", background:C.bg, padding:"56px 24px 40px", display:"flex", flexDirection:"column", overflowY:"auto" }}>
      <button onClick={onCancel} style={{ color:C.textMuted, fontSize:14, marginBottom:20, display:"flex", alignItems:"center", gap:6 }}>← Zurück</button>
      <h2 style={{ fontFamily:D, fontSize:26, fontWeight:700, marginBottom:6 }}>{isNew?"Neues Profil":"Profil bearbeiten"}</h2>
      <p style={{ color:C.textMuted, fontSize:14, marginBottom:24 }}>Einmal einrichten, immer berücksichtigt.</p>
      <div style={{ marginBottom:20 }}>
        <SL>Name</SL>
        <div style={{ background:C.card, border:`1.5px solid ${C.cardBorder}`, borderRadius:14, padding:"4px 16px" }}>
          <input value={name} onChange={e=>setName(e.target.value)} placeholder="z.B. Mama, Papa, Ich..." style={{ width:"100%", fontSize:15, padding:"13px 0" }}/>
        </div>
      </div>
      <div style={{ marginBottom:20 }}>
        <SL>Avatar</SL>
        <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
          {EMOJIS.map(e=>(<button key={e} onClick={()=>setEmoji(e)} style={{ width:44, height:44, borderRadius:12, fontSize:22, border:`2px solid ${emoji===e?C.accent:C.cardBorder}`, background:emoji===e?C.accentGlow:C.card }}>{e}</button>))}
        </div>
      </div>
      <div style={{ marginBottom:20 }}>
        <SL>🚫 Ernährung & Unverträglichkeiten</SL>
        <div style={{ display:"flex", flexWrap:"wrap", gap:8, marginBottom:12 }}>
          {DIET.map(({l,e})=>(<TagToggle key={l} label={l} emoji={e} selected={diet.includes(l)} color={C.danger} glowColor={C.dangerGlow} onClick={()=>toggle(l)}/>))}
        </div>
        <div style={{ background:C.card, border:`1px solid ${C.cardBorder}`, borderRadius:14, padding:"4px 14px", display:"flex", alignItems:"center", gap:8 }}>
          <input value={ci} onChange={e=>setCi(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"){e.preventDefault();addC();}}} placeholder="Weitere Einschränkung..." style={{ flex:1, fontSize:14, padding:"12px 0" }}/>
          {ci&&<button onClick={addC} style={{ background:C.danger, color:"#fff", borderRadius:8, padding:"6px 12px", fontSize:13, fontWeight:600 }}>+</button>}
        </div>
        {custom.length>0&&<div style={{ display:"flex", flexWrap:"wrap", gap:6, marginTop:10 }}>{custom.map(c=><Chip key={c} label={c} color={C.danger} dimColor="#b03030" glowColor={C.dangerGlow} onRemove={()=>setCustom(p=>p.filter(x=>x!==c))}/>)}</div>}
      </div>
      <div style={{ marginBottom:20 }}>
        <SL>🌍 Lieblingsküchen</SL>
        <p style={{color:C.textMuted,fontSize:12,marginBottom:10}}>Die KI bevorzugt diese Küchen – leer lassen für maximale Vielfalt.</p>
        <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
          {CUISINES.map(({l,e})=>(<TagToggle key={l} label={l} emoji={e} selected={cuisines.includes(l)} color={C.accent} glowColor={C.accentGlow} onClick={()=>setCuisines(p=>p.includes(l)?p.filter(x=>x!==l):[...p,l])}/>))}
        </div>
      </div>
      <div style={{ marginBottom:20 }}>
        <SL>🛒 Zutaten-Verfügbarkeit</SL>
        <p style={{color:C.textMuted,fontSize:12,marginBottom:12}}>Wie exotisch dürfen die Zutaten sein?</p>
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          {[
            ["supermarkt","🛒","Basis","Ich kaufe nur im Discounter oder kleinen Märkten"],
            ["markt","🏪","Standard","Mein Supermarkt ist gut sortiert"],
            ["alles","🌍","Experimentierfreudig","Ich besorge auch spezielle Zutaten gerne"],
          ].map(([val,emoji,label,desc])=>(
            <button key={val} onClick={()=>setAvailability(val)} style={{padding:"12px 16px",borderRadius:14,fontFamily:B,border:`1.5px solid ${availability===val?C.accent:C.cardBorder}`,background:availability===val?C.accentGlow:C.card,display:"flex",alignItems:"center",gap:12,textAlign:"left",width:"100%",transition:"all 0.2s"}}>
              <span style={{fontSize:24,flexShrink:0}}>{emoji}</span>
              <div>
                <p style={{fontWeight:600,fontSize:14,color:availability===val?C.accent:C.text,marginBottom:2}}>{label}</p>
                <p style={{fontSize:12,color:C.textMuted}}>{desc}</p>
              </div>
              {availability===val&&<span style={{marginLeft:"auto",color:C.accent,fontSize:16,flexShrink:0}}>✓</span>}
            </button>
          ))}
        </div>
      </div>
      <div style={{flex:1}}/>
      <BigBtn label={isNew?"Profil erstellen ✓":"Speichern ✓"} onClick={()=>{if(name.trim())onSave({name:name.trim(),emoji,diet,custom,cuisines,availability,id:profile?.id||Date.now()});}} disabled={!name.trim()}/>
    </div>
  );
}

function ProfileManager({ profiles, onSave, onBack }) {
  const [editing,setEditing]=useState(null);
  if(editing) return <ProfileEditor profile={editing==="new"?null:editing} isNew={editing==="new"} onSave={(p)=>{const u=editing==="new"?[...profiles,p]:profiles.map(x=>x.id===p.id?p:x);onSave(u);setEditing(null);}} onCancel={()=>setEditing(null)}/>;
  return (
    <div style={{ minHeight:"100vh", background:C.bg, padding:"56px 24px 40px", display:"flex", flexDirection:"column" }}>
      <button onClick={onBack} style={{ color:C.textMuted, fontSize:14, marginBottom:20, display:"flex", alignItems:"center", gap:6 }}>← Zurück</button>
      <h2 style={{ fontFamily:D, fontSize:26, fontWeight:700, marginBottom:6 }}>Profile</h2>
      <p style={{ color:C.textMuted, fontSize:14, marginBottom:28 }}>Jedes Profil hat eigene Rezepte & Einstellungen.</p>
      <div style={{ display:"flex", flexDirection:"column", gap:12, marginBottom:24 }}>
        {profiles.map(p=>(
          <div key={p.id} style={{ background:C.card, border:`1px solid ${C.cardBorder}`, borderRadius:16, padding:"16px 18px", display:"flex", alignItems:"center", gap:14 }}>
            <span style={{fontSize:28}}>{p.emoji}</span>
            <div style={{flex:1}}><p style={{fontWeight:600,fontSize:15}}>{p.name}</p>{([...(p.diet||[]),...(p.custom||[])]).length>0&&<p style={{fontSize:12,color:C.textMuted,marginTop:3}}>{[...p.diet,...p.custom].join(" · ")}</p>}</div>
            <div style={{display:"flex",gap:8}}>
              <button onClick={()=>setEditing(p)} style={{color:C.accent,fontSize:13,fontFamily:B,padding:"6px 12px",background:C.accentGlow,borderRadius:8}}>✏️</button>
              <button onClick={()=>onSave(profiles.filter(x=>x.id!==p.id))} style={{color:C.danger,fontSize:13,fontFamily:B,padding:"6px 12px",background:C.dangerGlow,borderRadius:8}}>✕</button>
            </div>
          </div>
        ))}
      </div>
      <button onClick={()=>setEditing("new")} style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:10, padding:"16px", borderRadius:16, border:`1.5px dashed ${C.cardBorder}`, color:C.textMuted, fontSize:15, fontFamily:B, background:"transparent", width:"100%" }}>➕ Neues Profil</button>
    </div>
  );
}

// ── Splash ────────────────────────────────────────────────
function SplashScreen({ profiles, onStart, onManageProfiles, onViewSaved, onWeekPlanner }) {
  const [selected,setSelected]=useState(null);
  useEffect(()=>{if(profiles.length>0)setSelected(profiles[0].id);},[profiles]);
  const active = profiles.find(p=>p.id===selected)||null;
  return (
    <div style={{ minHeight:"100vh", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", background:`radial-gradient(ellipse at 60% 20%, rgba(245,166,35,0.08) 0%, transparent 60%), ${C.bg}`, padding:32, textAlign:"center" }}>
      <div style={{ animation:"bounce 2s ease-in-out infinite", marginBottom:20 }}><span style={{fontSize:56}}>🍳</span></div>
      <h1 style={{ fontFamily:D, fontSize:42, fontWeight:700, lineHeight:1.1, marginBottom:6 }}>Mahl<span style={{color:C.accent}}>zeit</span></h1>
      <p style={{ color:C.textMuted, fontSize:14, marginBottom:32 }}>Nie wieder grübeln was du kochen sollst.</p>
      {profiles.length>0?(
        <div style={{ width:"100%", maxWidth:320, marginBottom:24 }}>
          <SL>Wer kocht heute?</SL>
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            {profiles.map(p=>(
              <button key={p.id} onClick={()=>setSelected(p.id)} style={{ display:"flex", alignItems:"center", gap:14, padding:"14px 18px", borderRadius:16, border:`2px solid ${selected===p.id?C.accent:C.cardBorder}`, background:selected===p.id?C.accentGlow:C.card, width:"100%", textAlign:"left" }}>
                <span style={{fontSize:28}}>{p.emoji}</span>
                <div style={{flex:1}}>
                  <p style={{ fontWeight:600, fontSize:15, color:selected===p.id?C.accent:C.text }}>{p.name}</p>
                  {([...(p.diet||[]),...(p.custom||[])]).length>0&&<p style={{ fontSize:12, color:C.textMuted, marginTop:2 }}>{[...p.diet,...p.custom].slice(0,3).join(" · ")}{[...p.diet,...p.custom].length>3?" …":""}</p>}
                </div>
                {selected===p.id&&<span style={{color:C.accent,fontSize:18}}>✓</span>}
              </button>
            ))}
          </div>
        </div>
      ):(
        <div style={{ marginBottom:24, padding:20, background:C.card, border:`1px dashed ${C.cardBorder}`, borderRadius:18, maxWidth:300 }}>
          <p style={{ color:C.textMuted, fontSize:14, lineHeight:1.6 }}>Erstelle ein Profil um Unverträglichkeiten und Rezepte dauerhaft zu speichern.</p>
        </div>
      )}
      <div style={{ display:"flex", flexDirection:"column", gap:10, width:"100%", maxWidth:320 }}>
        <button onClick={()=>onStart(active)} style={{ background:`linear-gradient(135deg,${C.accent},${C.accentDim})`, color:"#0f0e0c", fontWeight:700, fontSize:16, padding:"16px 52px", borderRadius:50, fontFamily:B, boxShadow:"0 8px 32px rgba(245,166,35,0.3)" }}>Los geht's →</button>
        <button onClick={()=>onWeekPlanner(active)} style={{ background:C.card, border:`1.5px solid ${C.cardBorder}`, color:C.text, fontWeight:600, fontSize:15, padding:"14px", borderRadius:50, fontFamily:B }}>📅 Wochenplaner</button>
        <button onClick={onManageProfiles} style={{ color:C.textMuted, fontSize:14, padding:"10px", fontFamily:B }}>{profiles.length>0?"⚙️ Profile verwalten":"➕ Profil erstellen"}</button>
        <button onClick={()=>onViewSaved(active)} style={{ color:C.textMuted, fontSize:14, padding:"6px", fontFamily:B }}>📚 Meine Rezepte</button>
      </div>
      <p style={{ color:C.textDim, fontSize:12, marginTop:16 }}>Powered by Claude AI</p>
    </div>
  );
}

// ── Ingredients (reusable) ────────────────────────────────
function IngredientsScreen({ onNext, onSkip }) {
  const [input,setInput]=useState(""); const [ingredients,setIngredients]=useState([]);
  const [scanning,setScanning]=useState(false); const [scanDone,setScanDone]=useState(false); const [scanError,setScanError]=useState(false);
  const [showScanInfo,setShowScanInfo]=useState(false);
  const [pendingInputId,setPendingInputId]=useState(null);
  const [scanCount,setScanCount]=useState(0);
  const MAX_SCANS=3;
  const triggerScan=(inputId)=>{
    if(!localStorage.getItem("mz_scan_consent")){setPendingInputId(inputId);setShowScanInfo(true);}
    else{document.getElementById(inputId)?.click();}
  };
  const add=()=>{const v=input.trim();if(v&&!ingredients.includes(v))setIngredients(p=>[...p,v]);setInput("");};
  const handleKey=e=>{if(e.key==="Enter"||e.key===","){e.preventDefault();add();}};
  const handleScan=async(e)=>{
    const file=e.target.files?.[0];if(!file)return;
    setScanning(true);setScanDone(false);setScanError(false);
    try{
      const comp=await new Promise((res,rej)=>{const img=new Image(),url=URL.createObjectURL(file);img.onload=()=>{
        // Step 1: Resize to max 768px (still enough for label reading, costs ~30% less tokens)
        const c=document.createElement("canvas"),M=768;let w=img.width,h=img.height;
        if(w>M||h>M){if(w>h){h=Math.round(h*M/w);w=M;}else{w=Math.round(w*M/h);h=M;}}
        c.width=w;c.height=h;
        const ctx=c.getContext("2d");
        ctx.drawImage(img,0,0,w,h);
        // Step 2: Try WebP first (50% smaller than JPEG at same quality), fallback to JPEG
        let data=c.toDataURL("image/webp",0.7);
        if(!data.startsWith("data:image/webp")){data=c.toDataURL("image/jpeg",0.65);}
        URL.revokeObjectURL(url);
        res(data.split(",")[1]);
      };img.onerror=rej;img.src=url;});
      // Determine actual mime type used
      const mimeType = comp.startsWith("/9j") ? "image/jpeg" : "image/webp";
      const resp=await fetch("/api/claude",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({type:"scan",base64:comp,mimeType})});
      const data=await resp.json();
      if(data.ingredients?.length){setIngredients(prev=>{const c=[...prev];data.ingredients.forEach(f=>{if(!c.includes(f))c.push(f);});return c;});setScanDone(true);setScanCount(p=>p+1);}else setScanError(true);
    }catch(err){setScanError(true);}finally{setScanning(false);e.target.value="";}
  };
  const sugg=["Eier","Nudeln","Tomaten","Käse","Hähnchen","Zwiebeln","Knoblauch","Reis","Kartoffeln","Paprika","Speck","Lachs","Tofu","Linsen"];
  return (
    <>
      {/* Privacy notice modal */}
      {showScanInfo&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.75)",display:"flex",alignItems:"flex-end",zIndex:200}} onClick={()=>setShowScanInfo(false)}>
          <div onClick={e=>e.stopPropagation()} style={{background:C.card,borderRadius:"24px 24px 0 0",padding:"28px 24px 48px",width:"100%",border:`1px solid ${C.cardBorder}`,maxWidth:430,margin:"0 auto"}}>
            <div style={{width:36,height:4,borderRadius:2,background:C.cardBorder,margin:"0 auto 24px"}}/>
            <p style={{fontSize:22,textAlign:"center",marginBottom:12}}>📸</p>
            <h3 style={{fontFamily:D,fontSize:20,fontWeight:700,marginBottom:12,textAlign:"center"}}>Hinweis zum Foto-Scan</h3>
            <p style={{color:C.textMuted,fontSize:14,lineHeight:1.7,marginBottom:20}}>
              Das Foto wird zur Erkennung der Zutaten kurz an <strong style={{color:C.text}}>Anthropic</strong> (USA) übermittelt. Es wird dort <strong style={{color:C.text}}>nicht gespeichert</strong> – nur der erkannte Text wird zurückgesendet.
            </p>
            <p style={{color:C.textMuted,fontSize:14,lineHeight:1.7,marginBottom:28}}>
              Der Scan ist freiwillig – du kannst Zutaten jederzeit auch manuell eingeben.
            </p>
            <div style={{display:"flex",flexDirection:"column",gap:10}}>
              <button onClick={()=>{localStorage.setItem("mz_scan_consent","true");setShowScanInfo(false);setTimeout(()=>document.getElementById(pendingInputId||"scan-camera").click(),100);}} style={{width:"100%",padding:"15px",borderRadius:50,background:`linear-gradient(135deg,${C.accent},${C.accentDim})`,color:"#0f0e0c",fontWeight:700,fontSize:15,fontFamily:B,boxShadow:"0 8px 24px rgba(245,166,35,0.3)"}}>
                Verstanden, weiter
              </button>
              <button onClick={()=>setShowScanInfo(false)} style={{width:"100%",padding:"14px",borderRadius:50,background:"transparent",border:`1.5px solid ${C.cardBorder}`,color:C.textMuted,fontWeight:600,fontSize:14,fontFamily:B}}>
                Abbrechen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Scan status bar */}
      {scanning&&(
        <div style={{background:C.card,border:`1.5px solid ${C.cardBorder}`,borderRadius:18,padding:"16px 18px",marginBottom:14,display:"flex",alignItems:"center",gap:14}}>
          <Spin/><div><p style={{color:C.accent,fontWeight:600,fontSize:14,marginBottom:2}}>KI analysiert Foto...</p><p style={{color:C.textMuted,fontSize:12}}>Zutaten werden erkannt</p></div>
        </div>
      )}
      {scanError&&!scanning&&(
        <div style={{background:C.dangerGlow,border:`1px solid ${C.danger}`,borderRadius:14,padding:"12px 16px",marginBottom:14,display:"flex",alignItems:"center",gap:10}}>
          <span style={{fontSize:18}}>❌</span><p style={{color:C.danger,fontSize:13}}>Scan fehlgeschlagen – erneut versuchen oder manuell eingeben.</p>
        </div>
      )}
      {scanDone&&!scanning&&(
        <div style={{background:C.greenGlow,border:`1px solid ${C.green}`,borderRadius:14,padding:"12px 16px",marginBottom:14,display:"flex",alignItems:"center",gap:10}}>
          <span style={{fontSize:18}}>✅</span><p style={{color:C.green,fontSize:13,fontWeight:500}}>Zutaten erkannt und hinzugefügt – du kannst weitere Fotos scannen.</p>
        </div>
      )}

      {/* Hidden file inputs */}
      <input id="scan-camera" type="file" accept="image/*" capture="environment" onChange={handleScan} disabled={scanning} style={{display:"none"}}/>
      <input id="scan-gallery" type="file" accept="image/*" onChange={handleScan} disabled={scanning} style={{display:"none"}}/>

      {/* Two scan buttons */}
      {!scanning&&(
        <>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:8}}>
            <button onClick={()=>scanCount<MAX_SCANS&&triggerScan("scan-camera")} disabled={scanCount>=MAX_SCANS} style={{padding:"14px 10px",borderRadius:16,background:scanCount>=MAX_SCANS?C.surface:`linear-gradient(135deg,rgba(245,166,35,0.18),rgba(196,125,14,0.1))`,border:`1.5px solid ${scanCount>=MAX_SCANS?C.cardBorder:C.accentDim}`,display:"flex",flexDirection:"column",alignItems:"center",gap:6,cursor:scanCount>=MAX_SCANS?"default":"pointer",opacity:scanCount>=MAX_SCANS?0.5:1}}>
              <span style={{fontSize:24}}>📷</span>
              <p style={{color:scanCount>=MAX_SCANS?C.textMuted:C.accent,fontWeight:600,fontSize:13}}>Kamera</p>
              <p style={{color:C.textMuted,fontSize:11}}>Direkt fotografieren</p>
            </button>
            <button onClick={()=>scanCount<MAX_SCANS&&triggerScan("scan-gallery")} disabled={scanCount>=MAX_SCANS} style={{padding:"14px 10px",borderRadius:16,background:scanCount>=MAX_SCANS?C.surface:C.card,border:`1.5px solid ${C.cardBorder}`,display:"flex",flexDirection:"column",alignItems:"center",gap:6,cursor:scanCount>=MAX_SCANS?"default":"pointer",opacity:scanCount>=MAX_SCANS?0.5:1}}>
              <span style={{fontSize:24}}>🖼️</span>
              <p style={{color:scanCount>=MAX_SCANS?C.textMuted:C.text,fontWeight:600,fontSize:13}}>Galerie</p>
              <p style={{color:C.textMuted,fontSize:11}}>Foto auswählen</p>
            </button>
          </div>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
            <p style={{color:C.textDim,fontSize:11}}>Kühlschrank und Vorratskammer separat scannen – Zutaten werden addiert.</p>
            <p style={{color:scanCount>=MAX_SCANS?C.danger:C.textDim,fontSize:11,fontWeight:600,flexShrink:0,marginLeft:8}}>{scanCount}/{MAX_SCANS} Scans</p>
          </div>
          {scanCount>=MAX_SCANS&&<p style={{color:C.danger,fontSize:12,textAlign:"center",marginBottom:10}}>Maximale Anzahl an Scans erreicht. Zutaten bitte manuell ergänzen.</p>}
        </>
      )}
      <div style={{ background:C.card, border:`1.5px solid ${C.cardBorder}`, borderRadius:18, padding:"4px 16px", display:"flex", alignItems:"center", gap:10, marginBottom:14 }}>
        <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={handleKey} placeholder="Oder manuell eingeben..." style={{flex:1,fontSize:15,padding:"14px 0"}}/>
        {input&&<button onClick={add} style={{background:C.accent,color:"#0f0e0c",borderRadius:8,padding:"6px 14px",fontWeight:700,fontSize:13}}>+</button>}
      </div>
      {ingredients.length>0&&<div style={{display:"flex",flexWrap:"wrap",gap:8,marginBottom:14}}>{ingredients.map(ing=><Chip key={ing} label={ing} onRemove={()=>setIngredients(p=>p.filter(i=>i!==ing))}/>)}</div>}
      <div style={{marginBottom:24}}><SL>Schnellauswahl</SL><div style={{display:"flex",flexWrap:"wrap",gap:8}}>{sugg.filter(s=>!ingredients.includes(s)).map(s=>(<button key={s} onClick={()=>setIngredients(p=>[...p,s])} style={{background:C.surface,border:`1px solid ${C.cardBorder}`,borderRadius:20,padding:"7px 14px",color:C.textMuted,fontSize:13,fontFamily:B}}>{s}</button>))}</div></div>
      <div style={{flex:1}}/>
      <div style={{display:"flex",flexDirection:"column",gap:10}}>
        <BigBtn label="Weiter →" onClick={()=>onNext(ingredients)} disabled={ingredients.length===0}/>
        <BigBtn label="Ohne Zutaten entdecken" onClick={onSkip} secondary/>
      </div>
    </>
  );
}

function IngredientsPage({ onNext, onSkip, onBack, step=1, total=3, title="Was hast du im Kühlschrank?", subtitle="Foto scannen, eintippen oder überspringen." }) {
  return (
    <div style={{ minHeight:"100vh", background:C.bg, padding:"56px 24px 32px", display:"flex", flexDirection:"column" }}>
      {onBack&&<button onClick={onBack} style={{ color:C.textMuted, fontSize:14, marginBottom:14, display:"flex", alignItems:"center", gap:6 }}>← Zurück</button>}
      <PBar step={step} total={total}/>
      <div style={{ marginBottom:20 }}><h2 style={{ fontFamily:D, fontSize:28, fontWeight:700, lineHeight:1.2, marginBottom:6 }}>{title}</h2><p style={{ color:C.textMuted, fontSize:14 }}>{subtitle}</p></div>
      <IngredientsScreen onNext={onNext} onSkip={onSkip}/>
    </div>
  );
}

// ── Disliked ──────────────────────────────────────────────
function DislikedScreen({ onNext, onBack, step=2, total=3 }) {
  const [disliked,setDisliked]=useState([]); const [ci,setCi]=useState("");
  const DIS=[{l:"Rosenkohl",e:"🥦"},{l:"Leber",e:"🫀"},{l:"Fenchel",e:"🌿"},{l:"Oliven",e:"🫒"},{l:"Pilze",e:"🍄"},{l:"Aubergine",e:"🍆"},{l:"Spinat",e:"🥬"},{l:"Knoblauch",e:"🧄"},{l:"Zwiebeln",e:"🧅"},{l:"Koriander",e:"🌿"},{l:"Rosinen",e:"🍇"},{l:"Sardinen",e:"🐟"}];
  const toggle=(v)=>setDisliked(p=>p.includes(v)?p.filter(x=>x!==v):[...p,v]);
  const addC=()=>{const v=ci.trim();if(v&&!disliked.includes(v))setDisliked(p=>[...p,v]);setCi("");};
  return (
    <div style={{ minHeight:"100vh", background:C.bg, padding:"56px 24px 32px", display:"flex", flexDirection:"column" }}>
      <button onClick={onBack} style={{ color:C.textMuted, fontSize:14, marginBottom:14, display:"flex", alignItems:"center", gap:6 }}>← Zurück</button>
      <PBar step={step} total={total}/>
      <div style={{ marginBottom:24 }}><h2 style={{ fontFamily:D, fontSize:28, fontWeight:700, lineHeight:1.2, marginBottom:6 }}>Heute keine Lust auf...?</h2><p style={{ color:C.textMuted, fontSize:14 }}>Optional – nur für heute.</p></div>
      <div style={{display:"flex",flexWrap:"wrap",gap:8,marginBottom:14}}>{DIS.map(({l,e})=><TagToggle key={l} label={l} emoji={e} selected={disliked.includes(l)} color={C.textMuted} glowColor={C.surface} onClick={()=>toggle(l)}/>)}</div>
      <div style={{ background:C.card, border:`1px solid ${C.cardBorder}`, borderRadius:14, padding:"4px 14px", display:"flex", alignItems:"center", gap:8, marginBottom:14 }}>
        <input value={ci} onChange={e=>setCi(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"){e.preventDefault();addC();}}} placeholder="Etwas anderes..." style={{flex:1,fontSize:14,padding:"12px 0"}}/>
        {ci&&<button onClick={addC} style={{background:C.textMuted,color:C.bg,borderRadius:8,padding:"6px 12px",fontSize:13,fontWeight:600}}>+</button>}
      </div>
      {disliked.length>0&&<div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:14}}>{disliked.map(d=><Chip key={d} label={d} color={C.textMuted} dimColor={C.textDim} glowColor={C.surface} onRemove={()=>setDisliked(p=>p.filter(x=>x!==d))}/>)}</div>}
      <div style={{flex:1}}/><BigBtn label="Weiter →" onClick={()=>onNext(disliked)}/>
    </div>
  );
}

// ── Preferences ───────────────────────────────────────────
function PreferencesScreen({ profile, onGenerate, onBack, step=3, total=3 }) {
  const [time,setTime]=useState(null); const [mood,setMood]=useState(null); const [portion,setPortion]=useState(null);
  const ready=time&&mood&&portion;
  return (
    <div style={{ minHeight:"100vh", background:C.bg, padding:"56px 24px 32px", display:"flex", flexDirection:"column" }}>
      <button onClick={onBack} style={{ color:C.textMuted, fontSize:14, marginBottom:14, display:"flex", alignItems:"center", gap:6 }}>← Zurück</button>
      <PBar step={step} total={total}/>
      <div style={{ marginBottom:26 }}><h2 style={{ fontFamily:D, fontSize:28, fontWeight:700, lineHeight:1.2, marginBottom:6 }}>Wie ist deine Stimmung?</h2>{profile&&<p style={{color:C.accent,fontSize:13}}>{profile.emoji} {profile.name}</p>}</div>
      <div style={{display:"flex",flexDirection:"column",gap:22}}>
        <div><SL>⏱ Wie viel Zeit hast du?</SL><div style={{display:"flex",gap:8}}>{[["Schnell","⚡","≤15 Min"],["Normal","🕐","30 Min"],["Gemütlich","🌿","60+ Min"]].map(([l,e,s])=>(<button key={l} onClick={()=>setTime(l)} style={{flex:1,padding:"13px 8px",borderRadius:14,fontFamily:B,border:`1.5px solid ${time===l?C.accent:C.cardBorder}`,background:time===l?C.accentGlow:C.card,color:time===l?C.accent:C.textMuted,fontSize:12,fontWeight:500,display:"flex",flexDirection:"column",alignItems:"center",gap:4}}><span style={{fontSize:22}}>{e}</span><span style={{fontWeight:600}}>{l}</span><span style={{fontSize:11,opacity:0.7}}>{s}</span></button>))}</div></div>
        <div><SL>🍽 Worauf hast du Hunger?</SL><div style={{display:"flex",gap:8,flexWrap:"wrap"}}>{[["Herzhaft","🥩"],["Leicht","🥗"],["Comfort","🫕"],["Überrasch mich!","🎲"]].map(([l,e])=>(<button key={l} onClick={()=>setMood(l)} style={{flex:1,minWidth:"45%",padding:"12px 6px",borderRadius:14,fontFamily:B,border:`1.5px solid ${mood===l?C.accent:C.cardBorder}`,background:mood===l?C.accentGlow:C.card,color:mood===l?C.accent:C.textMuted,fontSize:12,fontWeight:500,display:"flex",flexDirection:"column",alignItems:"center",gap:4}}><span style={{fontSize:20}}>{e}</span>{l}</button>))}</div></div>
        <div><SL>👥 Für wie viele Personen?</SL><div style={{display:"flex",gap:8}}>{[["1","🧑"],["2","👫"],["3–4","👨‍👩‍👧"],["5+","🎉"]].map(([l,e])=>(<button key={l} onClick={()=>setPortion(l)} style={{flex:1,padding:"13px 8px",borderRadius:14,fontFamily:B,border:`1.5px solid ${portion===l?C.accent:C.cardBorder}`,background:portion===l?C.accentGlow:C.card,color:portion===l?C.accent:C.textMuted,fontSize:13,fontWeight:500,display:"flex",flexDirection:"column",alignItems:"center",gap:4}}><span style={{fontSize:22}}>{e}</span>{l}</button>))}</div></div>
      </div>
      <div style={{flex:1}}/><BigBtn label="✨ Rezept generieren" onClick={()=>ready&&onGenerate({time,mood,portion})} disabled={!ready} style={{marginTop:24}}/>
    </div>
  );
}

// ── Loading ───────────────────────────────────────────────
function LoadingScreen() {
  const [step,setStep]=useState(0);
  const steps=["Analysiere deine Präferenzen...","Kreiere das perfekte Rezept...","Fast fertig..."];
  useEffect(()=>{const t1=setTimeout(()=>setStep(1),1800);const t2=setTimeout(()=>setStep(2),3500);return()=>{clearTimeout(t1);clearTimeout(t2);};},[]);
  return (
    <div style={{minHeight:"100vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:32,textAlign:"center",background:`radial-gradient(ellipse at 50% 40%, rgba(245,166,35,0.06) 0%, transparent 60%), ${C.bg}`}}>
      <span style={{fontSize:56,display:"block",marginBottom:32,animation:"bounce 1s ease-in-out infinite"}}>👨‍🍳</span>
      <h2 style={{fontFamily:D,fontSize:26,fontWeight:700,marginBottom:12}}>Ich koche für dich...</h2>
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
  const allR=[...(profile?.diet||[]),...(profile?.custom||[])];

  const handleSave=()=>{
    const rs=store.recipes.load(profile?.id);
    const entry={...recipe,id:Date.now(),savedAt:new Date().toLocaleDateString("de-DE"),profileId:profile?.id||null,status:"saved"};
    store.recipes.save(profile?.id,[entry,...rs.slice(0,49)]);
    setSaved(true);setSaveAnim(true);setTimeout(()=>setSaveAnim(false),800);
  };

  return (
    <div style={{minHeight:"100vh",background:C.bg}}>
      <div style={{background:"linear-gradient(180deg,rgba(245,166,35,0.1) 0%,transparent 100%)",padding:"60px 24px 28px",borderBottom:`1px solid ${C.cardBorder}`,animation:"fadeUp 0.5s ease"}}>
        <button onClick={onBack} style={{color:C.textMuted,fontSize:14,display:"flex",alignItems:"center",gap:6,marginBottom:14}}>← Einstellungen ändern</button>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:14}}>
          <div style={{flex:1,paddingRight:16}}>
            <p style={{color:C.accent,fontSize:11,fontWeight:700,letterSpacing:2,textTransform:"uppercase",marginBottom:6}}>🎯 Dein Rezept</p>
            <h1 style={{fontFamily:D,fontSize:26,fontWeight:700,lineHeight:1.2}}>{recipe.name}</h1>
          </div>
          <div style={{background:C.card,border:`1px solid ${C.cardBorder}`,borderRadius:14,padding:"10px 12px",fontSize:28,flexShrink:0}}>{recipe.emoji||"🍽"}</div>
        </div>
        <div style={{display:"flex",gap:8,marginBottom:14,flexWrap:"wrap"}}>
          <button onClick={handleSave} style={{display:"flex",alignItems:"center",gap:6,padding:"8px 14px",borderRadius:50,border:`1.5px solid ${saved?C.green:C.cardBorder}`,background:saved?C.greenGlow:C.card,color:saved?C.green:C.textMuted,fontSize:13,fontWeight:600,fontFamily:B,transition:"all 0.3s",transform:saveAnim?"scale(1.08)":"scale(1)"}}>
            {saved?"✅ Gespeichert":"📥 Speichern"}
          </button>
          <button onClick={onViewSaved} style={{display:"flex",alignItems:"center",gap:6,padding:"8px 14px",borderRadius:50,border:`1px solid ${C.cardBorder}`,background:C.card,color:C.textMuted,fontSize:13,fontFamily:B}}>📚 Meine Rezepte</button>
        </div>
        <p style={{color:C.textMuted,fontSize:14,lineHeight:1.6,marginBottom:14}}>{recipe.description}</p>
        <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:(allR.length||disliked?.length)?12:0}}>
          {[["⏱",recipe.time],["📊",recipe.difficulty],["🔥",recipe.calories]].map(([icon,val])=>(<div key={val} style={{background:C.card,border:`1px solid ${C.cardBorder}`,borderRadius:10,padding:"7px 12px",display:"flex",alignItems:"center",gap:5,fontSize:12,color:C.textMuted}}>{icon} {val}</div>))}
        </div>
        {(allR.length>0||disliked?.length>0)&&<div style={{display:"flex",flexWrap:"wrap",gap:6}}>{allR.map(r=><Chip key={r} label={r} color={C.danger} dimColor="#b03030" glowColor={C.dangerGlow}/>)}{(disliked||[]).map(d=><Chip key={d} label={"Kein "+d} color={C.textMuted} dimColor={C.textDim} glowColor={C.surface}/>)}</div>}
      </div>

      <div style={{padding:"22px 24px 140px",display:"flex",flexDirection:"column",gap:18}}>
        <div style={{background:C.card,border:`1px solid ${C.cardBorder}`,borderRadius:18,padding:18}}>
          <h3 style={{fontFamily:D,fontSize:17,marginBottom:14}}>🛒 Zutaten</h3>
          {recipe.ingredients?.map((ing,i)=>(<div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"9px 0",borderBottom:i<recipe.ingredients.length-1?`1px solid ${C.cardBorder}`:"none"}}><span style={{fontSize:14,color:ing.available?C.text:C.accent}}>{ing.available?"✅":"🛒"} {ing.name}</span><span style={{fontSize:13,color:C.textMuted}}>{ing.amount}</span></div>))}
          {missing.length>0&&(<><button onClick={()=>setShowShopping(!showShopping)} style={{marginTop:12,width:"100%",padding:"10px",borderRadius:10,background:C.accentGlow,border:`1px solid ${C.accentDim}`,color:C.accent,fontSize:13,fontWeight:600,fontFamily:B}}>🛒 Einkaufsliste ({missing.length}) {showShopping?"▲":"▼"}</button>{showShopping&&<div style={{marginTop:10,padding:12,background:C.surface,borderRadius:10}}>{missing.map((ing,i)=><div key={i} style={{fontSize:13,color:C.accent,padding:"4px 0"}}>• {ing.name} – {ing.amount}</div>)}</div>}</>)}
        </div>
        <div style={{background:C.card,border:`1px solid ${C.cardBorder}`,borderRadius:18,padding:18}}>
          <h3 style={{fontFamily:D,fontSize:17,marginBottom:14}}>👨‍🍳 Zubereitung</h3>
          <div style={{display:"flex",flexDirection:"column",gap:16}}>{recipe.steps?.map((step,i)=>(<div key={i} style={{display:"flex",gap:14,alignItems:"flex-start"}}><div style={{minWidth:28,height:28,borderRadius:"50%",background:`linear-gradient(135deg,${C.accent},${C.accentDim})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:700,color:"#0f0e0c",flexShrink:0}}>{i+1}</div><p style={{fontSize:14,color:C.textMuted,lineHeight:1.6,paddingTop:4}}>{step}</p></div>))}</div>
        </div>
        {recipe.tip&&<div style={{background:C.accentGlow,border:`1px solid ${C.accentDim}`,borderRadius:14,padding:14}}><p style={{fontSize:13,color:C.accent,lineHeight:1.6}}>💡 <strong>Tipp:</strong> {recipe.tip}</p></div>}
      </div>

      <div style={{position:"fixed",bottom:0,left:0,right:0,background:`linear-gradient(0deg,${C.bg} 70%,transparent)`,padding:"16px 24px 36px",display:"flex",gap:10,maxWidth:430,margin:"0 auto"}}>
        <button onClick={()=>setShowNope(true)} style={{flex:1,padding:"15px",borderRadius:50,border:`1.5px solid ${C.cardBorder}`,background:C.card,color:C.textMuted,fontWeight:600,fontSize:15,fontFamily:B}}>😑 Nope</button>
        <button onClick={onRestart} style={{flex:2,padding:"15px",borderRadius:50,background:`linear-gradient(135deg,${C.accent},${C.accentDim})`,color:"#0f0e0c",fontWeight:700,fontSize:15,fontFamily:B,boxShadow:"0 8px 24px rgba(245,166,35,0.3)"}}>Fertig ✓</button>
      </div>

      {showNope&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.7)",display:"flex",alignItems:"flex-end",zIndex:100}} onClick={()=>setShowNope(false)}>
          <div onClick={e=>e.stopPropagation()} style={{background:C.card,borderRadius:"24px 24px 0 0",padding:"28px 24px 52px",width:"100%",border:`1px solid ${C.cardBorder}`,animation:"slideUp 0.35s ease",maxWidth:430,margin:"0 auto"}}>
            <div style={{width:36,height:4,borderRadius:2,background:C.cardBorder,margin:"0 auto 24px"}}/>
            <h3 style={{fontFamily:D,fontSize:20,marginBottom:6}}>Kein Hunger drauf?</h3>
            <p style={{color:C.textMuted,fontSize:14,marginBottom:20}}>Was ist das Problem?</p>
            <div style={{display:"flex",flexDirection:"column",gap:10}}>
              {[{label:"Zu aufwendig",desc:"Zeig mir was Schnelleres",emoji:"😴",reason:"zu_aufwendig"},{label:"Anderes Gericht",desc:"Komplett andere Küche und Stil",emoji:"🔄",reason:"anderes_gericht"}].map(({label,desc,emoji,reason})=>(
                <button key={reason} onClick={()=>{setShowNope(false);onNope(reason);}} style={{padding:"14px 16px",borderRadius:14,border:`1.5px solid ${C.cardBorder}`,background:C.surface,color:C.text,fontFamily:B,display:"flex",alignItems:"center",gap:14,textAlign:"left",width:"100%"}}>
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

// ── Saved Recipes ─────────────────────────────────────────
function SavedRecipesScreen({ profile, profiles, onBack, onOpen }) {
  const [recipes,setRecipes]=useState([]);
  const [tab,setTab]=useState("saved");
  const [moveTarget,setMoveTarget]=useState(null);
  useEffect(()=>{setRecipes(store.recipes.load(profile?.id));},[profile]);
  const update=(u)=>{setRecipes(u);store.recipes.save(profile?.id,u);};
  const rate=(id,rating)=>{const u=recipes.map(r=>{if(r.id!==id)return r;if(rating==="up")return{...r,status:"loved",ratedAt:new Date().toLocaleDateString("de-DE")};return null;}).filter(Boolean);update(u);};
  const moveToProfile=(recipe,tid)=>{update(recipes.filter(r=>r.id!==recipe.id));const tr=store.recipes.load(tid);store.recipes.save(tid,[{...recipe,profileId:tid},...tr]);setMoveTarget(null);};
  const shown=tab==="loved"?recipes.filter(r=>r.status==="loved"):recipes.filter(r=>r.status==="saved");
  const others=profiles.filter(p=>p.id!==(profile?.id||null));
  return (
    <div style={{minHeight:"100vh",background:C.bg,padding:"56px 24px 32px",display:"flex",flexDirection:"column"}}>
      <button onClick={onBack} style={{color:C.textMuted,fontSize:14,marginBottom:20,display:"flex",alignItems:"center",gap:6}}>← Zurück</button>
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:4}}><h2 style={{fontFamily:D,fontSize:24,fontWeight:700}}>Meine Rezepte</h2>{profile&&<span style={{fontSize:20}}>{profile.emoji}</span>}</div>
      <p style={{color:C.textMuted,fontSize:13,marginBottom:20}}>Gespeichert auf diesem Gerät.</p>
      <div style={{display:"flex",gap:8,marginBottom:20}}>
        {[["saved","📥 Gespeichert"],["loved","❤️ Lieblingsgerichte"]].map(([val,label])=>(<button key={val} onClick={()=>setTab(val)} style={{padding:"9px 16px",borderRadius:50,fontFamily:B,fontSize:13,fontWeight:600,border:`1.5px solid ${tab===val?C.accent:C.cardBorder}`,background:tab===val?C.accentGlow:C.card,color:tab===val?C.accent:C.textMuted,transition:"all 0.2s"}}>{label}</button>))}
      </div>
      {shown.length===0?(
        <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:12,textAlign:"center"}}>
          <span style={{fontSize:48}}>{tab==="loved"?"❤️":"📭"}</span>
          <p style={{color:C.textMuted,fontSize:15}}>{tab==="loved"?"Noch keine Lieblingsgerichte":"Noch keine Rezepte gespeichert"}</p>
          <p style={{color:C.textDim,fontSize:13}}>{tab==="loved"?"Bewerte gespeicherte Rezepte mit Daumen hoch":"Tippe beim Rezept auf Speichern"}</p>
        </div>
      ):(
        <div style={{display:"flex",flexDirection:"column",gap:12,overflowY:"auto"}}>
          {shown.map(r=>(
            <div key={r.id} style={{background:C.card,border:`1px solid ${C.cardBorder}`,borderRadius:18,overflow:"hidden"}}>
              <div style={{padding:"16px 18px"}}>
                <div style={{display:"flex",alignItems:"flex-start",gap:12,marginBottom:8}}>
                  <span style={{fontSize:26,flexShrink:0}}>{r.emoji||"🍽"}</span>
                  <div style={{flex:1}}><p style={{fontFamily:D,fontWeight:700,fontSize:15,lineHeight:1.2,marginBottom:3}}>{r.name}</p><p style={{color:C.textMuted,fontSize:12}}>{r.savedAt} · {r.time} · {r.difficulty}</p></div>
                </div>
                <p style={{color:C.textMuted,fontSize:13,lineHeight:1.5,marginBottom:12}}>{r.description}</p>
                {tab==="saved"&&(
                  <div style={{background:C.surface,borderRadius:12,padding:"12px 14px",marginBottom:12}}>
                    <p style={{color:C.textMuted,fontSize:12,marginBottom:8}}>Hast du es schon gekocht? Wie war's?</p>
                    <div style={{display:"flex",gap:8}}>
                      <button onClick={()=>rate(r.id,"up")} style={{flex:1,padding:"10px",borderRadius:10,background:C.greenGlow,border:`1px solid ${C.green}`,color:C.green,fontSize:14,fontFamily:B,fontWeight:600}}>👍 Hat geschmeckt!</button>
                      <button onClick={()=>rate(r.id,"down")} style={{flex:1,padding:"10px",borderRadius:10,background:C.dangerGlow,border:`1px solid ${C.danger}`,color:C.danger,fontSize:14,fontFamily:B,fontWeight:600}}>👎 Nicht meins</button>
                    </div>
                  </div>
                )}
                <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                  <button onClick={()=>onOpen(r)} style={{flex:1,padding:"10px",borderRadius:12,background:`linear-gradient(135deg,${C.accent},${C.accentDim})`,color:"#0f0e0c",fontWeight:700,fontSize:13,fontFamily:B}}>Rezept öffnen →</button>
                  {others.length>0&&<button onClick={()=>setMoveTarget(moveTarget?.id===r.id?null:r)} style={{padding:"10px 12px",borderRadius:12,background:C.purpleGlow,color:C.purple,fontSize:13,fontFamily:B,border:`1px solid ${C.purple}`}}>↗️</button>}
                  <button onClick={()=>update(recipes.filter(x=>x.id!==r.id))} style={{padding:"10px 12px",borderRadius:12,background:C.dangerGlow,color:C.danger,fontSize:13,fontFamily:B}}>🗑</button>
                </div>
                {moveTarget?.id===r.id&&others.length>0&&(
                  <div style={{marginTop:10,padding:12,background:C.surface,borderRadius:12}}>
                    <p style={{color:C.textMuted,fontSize:12,marginBottom:8}}>In welches Profil verschieben?</p>
                    <div style={{display:"flex",flexDirection:"column",gap:6}}>
                      {others.map(p=>(<button key={p.id} onClick={()=>moveToProfile(r,p.id)} style={{padding:"10px 14px",borderRadius:10,background:C.card,border:`1px solid ${C.cardBorder}`,color:C.text,fontSize:13,fontFamily:B,display:"flex",alignItems:"center",gap:10,textAlign:"left"}}><span style={{fontSize:20}}>{p.emoji}</span>{p.name}</button>))}
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
  const empty=()=>DAYS.map((day,i)=>({day,recipe:null,loading:false,time:i>=5?"Gemütlich":"Normal"}));
  const [phase,setPhase]=useState("setup-ingredients");
  const [wIng,setWIng]=useState([]);
  const [wDis,setWDis]=useState([]);
  const [wPrefs,setWPrefs]=useState(null);
  const [week,setWeek]=useState(()=>store.week.load(profile?.id)||empty());
  const [genAll,setGenAll]=useState(false);
  const [viewIdx,setViewIdx]=useState(null);
  const [showShopping,setShowShopping]=useState(false);
  const [shoppingList,setShoppingList]=useState(null);
  const [loadingShopping,setLoadingShopping]=useState(false);

  const genDay=async(idx,cur,prefs,ing,dis,nope=null)=>{
    const dayTime = cur ? (cur[idx]?.time || "Normal") : (week[idx]?.time || "Normal");
    const p=prefs ? {...prefs, time: prefs.time || dayTime} : wPrefs ? {...wPrefs, time: dayTime} : {time:dayTime,mood:"Herzhaft",portion:"2"};
    const i=ing!==undefined?ing:wIng; const d=dis!==undefined?dis:wDis;
    setWeek(prev=>prev.map((x,j)=>j===idx?{...x,loading:true}:x));
    const restr=[...(profile?.diet||[]),...(profile?.custom||[])];
    const loved=store.recipes.load(profile?.id).filter(r=>r.status==="loved").slice(0,8).map(r=>r.name);
    const used=(cur||week).filter((_,j)=>j!==idx).map(x=>x.recipe?.name).filter(Boolean);
    try{
      const resp=await fetch("/api/claude",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({type:"recipe",ingredients:i,time:p.time,mood:p.mood,portion:p.portion,intolerances:restr,disliked:d,nope,lovedRecipes:loved,avoidNames:used,weekMode:true,preferredCuisines:profile?.cuisines||[],availability:profile?.availability||"supermarkt"})});
      const data=await resp.json();
      if(data.recipe){setWeek(prev=>{const u=prev.map((x,j)=>j===idx?{...x,recipe:data.recipe,loading:false}:x);store.week.save(profile?.id,u);return u;});}
      else setWeek(prev=>prev.map((x,j)=>j===idx?{...x,loading:false}:x));
    }catch(e){setWeek(prev=>prev.map((x,j)=>j===idx?{...x,loading:false}:x));}
  };

  const generateAll=async(prefs,ing,dis)=>{
    setGenAll(true);
    const fresh=empty();
    setWeek(fresh);
    // Track generated recipes to avoid repeats across days
    const generated = [...fresh];
    for(let i=0;i<7;i++){
      await genDay(i,generated,prefs,ing,dis);
      // After each day, read the latest week state to update generated list
      setWeek(prev=>{generated.splice(0,7,...prev);return prev;});
      await new Promise(r=>setTimeout(r,100)); // small delay for state to settle
    }
    setGenAll(false);
  };

  const saveR=(recipe)=>{
    const rs=store.recipes.load(profile?.id);
    store.recipes.save(profile?.id,[{...recipe,id:Date.now(),savedAt:new Date().toLocaleDateString("de-DE"),profileId:profile?.id||null,status:"saved"},...rs.slice(0,49)]);
  };

  const combineShoppingList=async()=>{
    setLoadingShopping(true);
    setShoppingList(null);
    // Collect all missing ingredients from all days
    const items=[];
    week.forEach(d=>{
      if(d.recipe?.ingredients){
        d.recipe.ingredients.filter(i=>!i.available).forEach(i=>{
          items.push({name:i.name,amount:i.amount,day:d.day});
        });
      }
    });
    if(items.length===0){setShoppingList({categories:[]});setLoadingShopping(false);return;}
    try{
      const resp=await fetch("/api/claude",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({type:"combine-shopping",items})});
      const data=await resp.json();
      setShoppingList(data);
    }catch(e){console.error(e);}
    finally{setLoadingShopping(false);}
  };

  // View a day's recipe in full RecipeScreen
  if(viewIdx!==null&&week[viewIdx]?.recipe){
    return <RecipeScreen recipe={week[viewIdx].recipe} profile={profile} disliked={wDis}
      onNope={(reason)=>{genDay(viewIdx,week,wPrefs,wIng,wDis,reason);setViewIdx(null);}}
      onBack={()=>setViewIdx(null)} onRestart={()=>setViewIdx(null)} onViewSaved={()=>setViewIdx(null)}/>;
  }

  // Setup: Ingredients
  if(phase==="setup-ingredients"){
    return(
      <div style={{minHeight:"100vh",background:C.bg,padding:"56px 24px 32px",display:"flex",flexDirection:"column"}}>
        <button onClick={onBack} style={{color:C.textMuted,fontSize:14,marginBottom:14,display:"flex",alignItems:"center",gap:6}}>← Zurück</button>
        <PBar step={1} total={3}/>
        <div style={{marginBottom:20}}>
          <h2 style={{fontFamily:D,fontSize:28,fontWeight:700,lineHeight:1.2,marginBottom:6}}>Was ist diese Woche im Kühlschrank?</h2>
          <p style={{color:C.textMuted,fontSize:14}}>Gilt als Basis für alle Tage.</p>
        </div>
        <IngredientsScreen onNext={ings=>{setWIng(ings);setPhase("setup-disliked");}} onSkip={()=>{setWIng([]);setPhase("setup-disliked");}}/>
      </div>
    );
  }

  // Setup: Disliked
  if(phase==="setup-disliked"){
    return <DislikedScreen step={2} total={3} onNext={d=>{setWDis(d);setPhase("setup-prefs");}} onBack={()=>setPhase("setup-ingredients")}/>;
  }

  // Setup: Preferences
  if(phase==="setup-prefs"){
    return <PreferencesScreen profile={profile} step={3} total={3}
      onGenerate={p=>{setWPrefs(p);setPhase("week");generateAll(p,wIng,wDis);}}
      onBack={()=>setPhase("setup-disliked")}/>;
  }

  // Week overview
  return(
    <div style={{minHeight:"100vh",background:C.bg,padding:"56px 24px 32px",display:"flex",flexDirection:"column"}}>
      <button onClick={onBack} style={{color:C.textMuted,fontSize:14,marginBottom:20,display:"flex",alignItems:"center",gap:6}}>← Zurück</button>
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:6}}>
        <h2 style={{fontFamily:D,fontSize:26,fontWeight:700}}>Wochenplaner</h2>
        {profile&&<span style={{fontSize:20}}>{profile.emoji}</span>}
      </div>
      <p style={{color:C.textMuted,fontSize:13,marginBottom:16}}>Tippe auf ein Gericht für Details und die Nope-Funktion.</p>
      <div style={{display:"flex",gap:8,marginBottom:12}}>
        <button onClick={()=>setPhase("setup-ingredients")} style={{flex:1,padding:"11px",borderRadius:50,background:C.card,border:`1.5px solid ${C.cardBorder}`,color:C.textMuted,fontWeight:600,fontSize:13,fontFamily:B}}>← Neu planen</button>
        <button onClick={()=>generateAll(wPrefs,wIng,wDis)} disabled={genAll} style={{flex:2,padding:"11px",borderRadius:50,background:genAll?C.surface:`linear-gradient(135deg,${C.accent},${C.accentDim})`,color:genAll?C.textDim:"#0f0e0c",fontWeight:700,fontSize:13,fontFamily:B,boxShadow:genAll?"none":"0 4px 16px rgba(245,166,35,0.25)"}}>
          {genAll?"Generiert...":"✨ Alle neu"}
        </button>
      </div>

      {/* Shopping list button */}
      {week.some(d=>d.recipe?.ingredients?.some(i=>!i.available))&&(
        <button onClick={()=>{setShowShopping(!showShopping);if(!showShopping&&!shoppingList)combineShoppingList();}} style={{width:"100%",padding:"12px",borderRadius:14,background:showShopping?C.accentGlow:C.card,border:`1.5px solid ${showShopping?C.accent:C.cardBorder}`,color:showShopping?C.accent:C.textMuted,fontWeight:600,fontSize:14,fontFamily:B,marginBottom:12,display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
          🛒 {showShopping?"Einkaufsliste ausblenden":"Wocheneinkaufsliste anzeigen"}
        </button>
      )}

      {/* Shopping list panel */}
      {showShopping&&(
        <div style={{background:C.card,border:`1px solid ${C.cardBorder}`,borderRadius:18,padding:18,marginBottom:16}}>
          {loadingShopping?(
            <div style={{display:"flex",alignItems:"center",gap:12,padding:"8px 0"}}><Spin size={20}/><p style={{color:C.textMuted,fontSize:14}}>Liste wird zusammengefasst...</p></div>
          ):shoppingList?.categories?.length===0?(
            <p style={{color:C.textMuted,fontSize:14}}>Alle Zutaten sind bereits vorhanden!</p>
          ):shoppingList?(
            <>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
                <h3 style={{fontFamily:D,fontSize:17}}>🛒 Wocheneinkaufsliste</h3>
                <button onClick={()=>{combineShoppingList();}} style={{color:C.accent,fontSize:12,fontFamily:B,padding:"5px 10px",background:C.accentGlow,borderRadius:8}}>↻ Neu</button>
              </div>
              {shoppingList.categories.map((cat,ci)=>(
                <div key={ci} style={{marginBottom:16}}>
                  <p style={{color:C.accent,fontSize:11,fontWeight:700,letterSpacing:1.5,textTransform:"uppercase",marginBottom:8}}>{cat.name}</p>
                  {cat.items.map((item,ii)=>(
                    <div key={ii} style={{display:"flex",justifyContent:"space-between",padding:"7px 0",borderBottom:`1px solid ${C.cardBorder}`}}>
                      <span style={{fontSize:14,color:C.text}}>🛒 {item.name}</span>
                      <span style={{fontSize:13,color:C.textMuted}}>{item.amount}</span>
                    </div>
                  ))}
                </div>
              ))}
              <button onClick={()=>{
                const text=shoppingList.categories.map(c=>c.name+":\n"+c.items.map(i=>"- "+i.name+": "+i.amount).join("\n")).join("\n\n");
                navigator.clipboard.writeText(text).catch(()=>{});
              }} style={{marginTop:8,width:"100%",padding:"10px",borderRadius:10,background:C.surface,border:`1px solid ${C.cardBorder}`,color:C.textMuted,fontSize:13,fontFamily:B,fontWeight:600}}>
                📋 Liste kopieren
              </button>
            </>
          ):null}
        </div>
      )}
      <div style={{display:"flex",flexDirection:"column",gap:12,overflowY:"auto"}}>
        {week.map((d,i)=>(
          <div key={d.day} style={{background:C.card,border:`1px solid ${C.cardBorder}`,borderRadius:18,padding:"16px 18px"}}>
            <div style={{marginBottom:8}}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:6}}>
                <p style={{fontWeight:700,fontSize:15,color:C.accent}}>{d.day}</p>
                <div style={{display:"flex",gap:8}}>
                  {d.recipe&&<button onClick={()=>saveR(d.recipe)} style={{color:C.green,fontSize:12,fontFamily:B,padding:"5px 10px",background:C.greenGlow,borderRadius:8}}>📥</button>}
                  <button onClick={()=>genDay(i,week)} disabled={d.loading||genAll} style={{padding:"7px 12px",borderRadius:10,background:C.accentGlow,border:`1px solid ${C.accentDim}`,color:C.accent,fontSize:12,fontFamily:B,fontWeight:600}}>{d.loading?"...":d.recipe?"🔄":"Generieren"}</button>
                </div>
              </div>
              <div style={{display:"flex",gap:6}}>
                {[["Schnell","⚡"],["Normal","🕐"],["Gemütlich","🌿"]].map(([t,e])=>(
                  <button key={t} onClick={()=>setWeek(prev=>{const u=prev.map((x,j)=>j===i?{...x,time:t}:x);store.week.save(profile?.id,u);return u;})} style={{flex:1,padding:"5px 4px",borderRadius:8,fontFamily:B,fontSize:11,fontWeight:500,border:`1px solid ${d.time===t?C.accent:C.cardBorder}`,background:d.time===t?C.accentGlow:C.surface,color:d.time===t?C.accent:C.textMuted,display:"flex",alignItems:"center",justifyContent:"center",gap:3}}>
                    <span>{e}</span>{t}
                  </button>
                ))}
              </div>
            </div>
            {d.loading?(
              <div style={{display:"flex",alignItems:"center",gap:10,padding:"8px 0"}}><Spin size={18}/><p style={{color:C.textMuted,fontSize:13}}>Wird generiert...</p></div>
            ):d.recipe?(
              <button onClick={()=>setViewIdx(i)} style={{width:"100%",textAlign:"left",background:"transparent",fontFamily:B,padding:0,cursor:"pointer"}}>
                <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:5}}>
                  <span style={{fontSize:22}}>{d.recipe.emoji||"🍽"}</span>
                  <div style={{flex:1}}><p style={{fontWeight:600,fontSize:14,color:C.text}}>{d.recipe.name}</p><p style={{color:C.textMuted,fontSize:12}}>{d.recipe.time} · {d.recipe.difficulty}</p></div>
                  <span style={{color:C.textDim,fontSize:18}}>›</span>
                </div>
                <p style={{color:C.textMuted,fontSize:13,lineHeight:1.5}}>{d.recipe.description}</p>
              </button>
            ):(
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

  useEffect(()=>{setProfiles(store.profiles.load());},[]);
  const saveProfiles=(u)=>{setProfiles(u);store.profiles.save(u);};

  const callAPI=async(finalPrefs,nope=null)=>{
    setScreen("loading");
    const restr=[...(activeProfile?.diet||[]),...(activeProfile?.custom||[])];
    const loved=store.recipes.load(activeProfile?.id).filter(r=>r.status==="loved").slice(0,8).map(r=>r.name);
    const lastRecipe = nope && recipe ? recipe.name : null;
    try{
      const resp=await fetch("/api/claude",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({type:"recipe",ingredients,time:finalPrefs.time,mood:finalPrefs.mood,portion:finalPrefs.portion,intolerances:restr,disliked,nope,lovedRecipes:loved,avoidName:lastRecipe,preferredCuisines:activeProfile?.cuisines||[],availability:activeProfile?.availability||"supermarkt"})});
      const data=await resp.json();
      if(data.recipe){setRecipe(data.recipe);setScreen("recipe");}
    }catch(err){
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
        {screen==="ingredients"&&<IngredientsPage onNext={ings=>{setIngredients(ings);setScreen("disliked");}} onSkip={()=>{setIngredients([]);setScreen("disliked");}}/>}
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
