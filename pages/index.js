import { useState, useRef } from "react";
import Head from "next/head";

const C = {
  bg:"#0f0e0c", card:"#1a1815", cardBorder:"#2a2620",
  accent:"#f5a623", accentDim:"#c47d0e", accentGlow:"rgba(245,166,35,0.15)",
  text:"#f0ebe3", textMuted:"#8a8070", textDim:"#4a4438", surface:"#221f1a",
  danger:"#e05a5a", dangerGlow:"rgba(224,90,90,0.15)",
};
const DISPLAY = "'Playfair Display', serif";
const BODY = "'DM Sans', sans-serif";

const Chip = ({ label, color, dimColor, glowColor, onRemove }) => (
  <span style={{ display:"inline-flex", alignItems:"center", gap:6, background:glowColor||C.accentGlow, border:`1px solid ${dimColor||C.accentDim}`, borderRadius:20, padding:"5px 12px", fontSize:13, color:color||C.accent, fontWeight:500 }}>
    {label}
    {onRemove && <button onClick={onRemove} style={{ color:dimColor||C.accentDim, fontSize:16, lineHeight:1 }}>×</button>}
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

function SplashScreen({ onStart }) {
  return (
    <div style={{ minHeight:"100vh", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", background:`radial-gradient(ellipse at 60% 20%, rgba(245,166,35,0.08) 0%, transparent 60%), ${C.bg}`, padding:32, textAlign:"center" }}>
      <div style={{ animation:"bounce 2s ease-in-out infinite", marginBottom:24 }}><span style={{fontSize:60}}>🍳</span></div>
      <h1 style={{ fontFamily:DISPLAY, fontSize:44, fontWeight:700, lineHeight:1.1, marginBottom:8, animation:"fadeUp 0.6s ease" }}>
        Mahl<span style={{color:C.accent}}>zeit</span>
      </h1>
      <p style={{ color:C.textMuted, fontSize:15, lineHeight:1.6, maxWidth:260, marginBottom:48, animation:"fadeUp 0.6s 0.1s ease both" }}>
        Nie wieder grübeln was du kochen sollst.
      </p>
      <button onClick={onStart} style={{ background:`linear-gradient(135deg,${C.accent},${C.accentDim})`, color:"#0f0e0c", fontWeight:700, fontSize:16, padding:"16px 52px", borderRadius:50, fontFamily:BODY, boxShadow:`0 8px 32px rgba(245,166,35,0.3)`, animation:"fadeUp 0.6s 0.2s ease both" }}>
        Los geht's →
      </button>
      <p style={{ color:C.textDim, fontSize:12, marginTop:20, animation:"fadeUp 0.6s 0.3s ease both" }}>Powered by Claude AI</p>
    </div>
  );
}

function IngredientsScreen({ onNext, onSkip }) {
  const [input, setInput] = useState("");
  const [ingredients, setIngredients] = useState([]);
  const [scanning, setScanning] = useState(false);
  const [scanDone, setScanDone] = useState(false);

  const add = () => { const v=input.trim(); if(v&&!ingredients.includes(v)) setIngredients(p=>[...p,v]); setInput(""); };
  const handleKey = e => { if(e.key==="Enter"||e.key===","){e.preventDefault();add();} };

  const handleScan = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setScanning(true); setScanDone(false);
    const base64 = await new Promise((res,rej)=>{ const r=new FileReader(); r.onload=()=>res(r.result.split(",")[1]); r.onerror=rej; r.readAsDataURL(file); });
    try {
      const resp = await fetch("/api/claude", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ type:"scan", base64, mimeType:file.type||"image/jpeg" }) });
      const data = await resp.json();
      if (data.ingredients?.length) {
        setIngredients(prev=>{ const c=[...prev]; data.ingredients.forEach(f=>{ if(!c.includes(f)) c.push(f); }); return c; });
        setScanDone(true);
      }
    } catch(err){ console.error(err); }
    finally { setScanning(false); e.target.value=""; }
  };

  const suggestions = ["Eier","Nudeln","Tomaten","Käse","Hähnchen","Zwiebeln","Knoblauch","Reis","Kartoffeln","Paprika","Speck","Lachs","Tofu","Linsen"];

  return (
    <div style={{ minHeight:"100vh", background:C.bg, padding:"56px 24px 32px", display:"flex", flexDirection:"column" }}>
      <ProgressBar step={1} total={3}/>
      <div style={{ marginBottom:20, animation:"fadeUp 0.5s ease" }}>
        <h2 style={{ fontFamily:DISPLAY, fontSize:28, fontWeight:700, lineHeight:1.2, marginBottom:6 }}>Was hast du im Kühlschrank?</h2>
        <p style={{ color:C.textMuted, fontSize:14 }}>Foto scannen, eintippen – oder überspringen.</p>
      </div>

      <label style={{ background:scanning?C.surface:`linear-gradient(135deg,rgba(245,166,35,0.18),rgba(196,125,14,0.1))`, border:`1.5px dashed ${scanning?C.cardBorder:C.accentDim}`, borderRadius:18, padding:"18px 16px", marginBottom:14, display:"flex", alignItems:"center", gap:14, width:"100%", cursor:scanning?"default":"pointer", boxSizing:"border-box", transition:"all 0.3s", animation:"fadeUp 0.5s 0.05s ease both" }}>
        <input type="file" accept="image/*" onChange={handleScan} disabled={scanning} style={{display:"none"}}/>
        {scanning ? (
          <><div style={{ width:36, height:36, borderRadius:"50%", border:`3px solid ${C.accentDim}`, borderTopColor:C.accent, animation:"spin 0.8s linear infinite", flexShrink:0 }}/><div><p style={{color:C.accent,fontWeight:600,fontSize:14,marginBottom:2}}>KI analysiert Foto...</p><p style={{color:C.textMuted,fontSize:12}}>Zutaten werden erkannt</p></div></>
        ) : scanDone ? (
          <><div style={{width:36,height:36,borderRadius:12,background:"rgba(90,185,122,0.15)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,flexShrink:0}}>✅</div><div><p style={{color:"#5ab97a",fontWeight:600,fontSize:14,marginBottom:2}}>Zutaten erkannt!</p><p style={{color:C.textMuted,fontSize:12}}>Erneut scannen für mehr</p></div></>
        ) : (
          <><div style={{width:36,height:36,borderRadius:12,background:C.accentGlow,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,flexShrink:0}}>📸</div><div><p style={{color:C.accent,fontWeight:600,fontSize:14,marginBottom:2}}>Kühlschrank / Vorratskammer scannen</p><p style={{color:C.textMuted,fontSize:12}}>KI erkennt Zutaten automatisch</p></div></>
        )}
      </label>

      <div style={{ background:C.card, border:`1.5px solid ${C.cardBorder}`, borderRadius:18, padding:"4px 16px", display:"flex", alignItems:"center", gap:10, marginBottom:14, animation:"fadeUp 0.5s 0.1s ease both" }}>
        <span style={{fontSize:18}}>✏️</span>
        <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={handleKey} placeholder="Oder manuell eingeben..." style={{flex:1,fontSize:15,padding:"14px 0"}}/>
        {input && <button onClick={add} style={{background:C.accent,color:"#0f0e0c",borderRadius:8,padding:"6px 14px",fontWeight:700,fontSize:13}}>+</button>}
      </div>

      {ingredients.length>0 && (
        <div style={{display:"flex",flexWrap:"wrap",gap:8,marginBottom:14,animation:"fadeIn 0.3s ease"}}>
          {ingredients.map(ing=><Chip key={ing} label={ing} onRemove={()=>setIngredients(p=>p.filter(i=>i!==ing))}/>)}
        </div>
      )}

      <div style={{animation:"fadeUp 0.5s 0.15s ease both",marginBottom:24}}>
        <SectionLabel>Schnellauswahl</SectionLabel>
        <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
          {suggestions.filter(s=>!ingredients.includes(s)).map(s=>(
            <button key={s} onClick={()=>setIngredients(p=>[...p,s])} style={{background:C.surface,border:`1px solid ${C.cardBorder}`,borderRadius:20,padding:"7px 14px",color:C.textMuted,fontSize:13,fontFamily:BODY}}>{s}</button>
          ))}
        </div>
      </div>

      <div style={{flex:1}}/>
      <div style={{display:"flex",flexDirection:"column",gap:10,animation:"fadeUp 0.5s 0.2s ease both"}}>
        <BigButton label="Weiter →" onClick={()=>onNext(ingredients)} disabled={ingredients.length===0}/>
        <BigButton label="🔍 Ohne Zutaten entdecken" onClick={onSkip} secondary/>
      </div>
    </div>
  );
}

function FiltersScreen({ filters, onNext, onBack }) {
  const [intolerances, setIntolerances] = useState(filters.intolerances||[]);
  const [disliked, setDisliked] = useState(filters.disliked||[]);
  const [customIntol, setCustomIntol] = useState("");
  const [customDislike, setCustomDislike] = useState("");

  const INTOL = [{l:"Laktose",e:"🥛"},{l:"Gluten",e:"🌾"},{l:"Nüsse",e:"🥜"},{l:"Eier",e:"🥚"},{l:"Fisch",e:"🐟"},{l:"Meeresfrüchte",e:"🦐"},{l:"Soja",e:"🫘"},{l:"Vegetarisch",e:"🥦"},{l:"Vegan",e:"🌱"}];
  const DISLIKE = [{l:"Rosenkohl",e:"🥦"},{l:"Leber",e:"🫀"},{l:"Fenchel",e:"🌿"},{l:"Oliven",e:"🫒"},{l:"Pilze",e:"🍄"},{l:"Aubergine",e:"🍆"},{l:"Spinat",e:"🥬"},{l:"Knoblauch",e:"🧄"},{l:"Zwiebeln",e:"🧅"},{l:"Koriander",e:"🌿"},{l:"Rosinen",e:"🍇"},{l:"Sardinen",e:"🐟"}];

  const toggle = (list,setList,val) => setList(p=>p.includes(val)?p.filter(x=>x!==val):[...p,val]);
  const addCustom = (val,list,setList,setInp) => { const v=val.trim(); if(v&&!list.includes(v)) setList(p=>[...p,v]); setInp(""); };

  return (
    <div style={{minHeight:"100vh",background:C.bg,padding:"56px 24px 40px",display:"flex",flexDirection:"column",overflowY:"auto"}}>
      <button onClick={onBack} style={{color:C.textMuted,fontSize:14,textAlign:"left",marginBottom:14,display:"flex",alignItems:"center",gap:6}}>← Zurück</button>
      <ProgressBar step={2} total={3}/>
      <div style={{marginBottom:26,animation:"fadeUp 0.5s ease"}}>
        <h2 style={{fontFamily:DISPLAY,fontSize:28,fontWeight:700,lineHeight:1.2,marginBottom:6}}>Deine Präferenzen</h2>
        <p style={{color:C.textMuted,fontSize:14}}>Wird immer berücksichtigt.</p>
      </div>

      <div style={{marginBottom:28,animation:"fadeUp 0.5s 0.05s ease both"}}>
        <SectionLabel>🚫 Unverträglichkeiten & Ernährung</SectionLabel>
        <div style={{display:"flex",flexWrap:"wrap",gap:8,marginBottom:12}}>
          {INTOL.map(({l,e})=><TagToggle key={l} label={l} emoji={e} selected={intolerances.includes(l)} color={C.danger} glowColor={C.dangerGlow} onClick={()=>toggle(intolerances,setIntolerances,l)}/>)}
        </div>
        <div style={{background:C.card,border:`1px solid ${C.cardBorder}`,borderRadius:14,padding:"4px 14px",display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
          <span style={{fontSize:15}}>➕</span>
          <input value={customIntol} onChange={e=>setCustomIntol(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"){e.preventDefault();addCustom(customIntol,intolerances,setIntolerances,setCustomIntol);}}} placeholder="Weitere Unverträglichkeit..." style={{flex:1,fontSize:14,padding:"12px 0"}}/>
          {customIntol && <button onClick={()=>addCustom(customIntol,intolerances,setIntolerances,setCustomIntol)} style={{background:C.danger,color:"#fff",borderRadius:8,padding:"6px 12px",fontSize:13,fontWeight:600}}>+</button>}
        </div>
        {intolerances.length>0 && <div style={{display:"flex",flexWrap:"wrap",gap:6}}>{intolerances.map(i=><Chip key={i} label={i} color={C.danger} dimColor="#b03030" glowColor={C.dangerGlow} onRemove={()=>setIntolerances(p=>p.filter(x=>x!==i))}/>)}</div>}
      </div>

      <div style={{marginBottom:32,animation:"fadeUp 0.5s 0.1s ease both"}}>
        <SectionLabel>😐 Heute keine Lust auf...</SectionLabel>
        <p style={{color:C.textMuted,fontSize:12,marginBottom:10}}>Diese Zutaten werden heute komplett gemieden</p>
        <div style={{display:"flex",flexWrap:"wrap",gap:8,marginBottom:12}}>
          {DISLIKE.map(({l,e})=><TagToggle key={l} label={l} emoji={e} selected={disliked.includes(l)} color={C.textMuted} glowColor={C.surface} onClick={()=>toggle(disliked,setDisliked,l)}/>)}
        </div>
        <div style={{background:C.card,border:`1px solid ${C.cardBorder}`,borderRadius:14,padding:"4px 14px",display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
          <span style={{fontSize:15}}>➕</span>
          <input value={customDislike} onChange={e=>setCustomDislike(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"){e.preventDefault();addCustom(customDislike,disliked,setDisliked,setCustomDislike);}}} placeholder="Was magst du heute nicht?" style={{flex:1,fontSize:14,padding:"12px 0"}}/>
          {customDislike && <button onClick={()=>addCustom(customDislike,disliked,setDisliked,setCustomDislike)} style={{background:C.textMuted,color:C.bg,borderRadius:8,padding:"6px 12px",fontSize:13,fontWeight:600}}>+</button>}
        </div>
        {disliked.length>0 && <div style={{display:"flex",flexWrap:"wrap",gap:6}}>{disliked.map(d=><Chip key={d} label={d} color={C.textMuted} dimColor={C.textDim} glowColor={C.surface} onRemove={()=>setDisliked(p=>p.filter(x=>x!==d))}/>)}</div>}
      </div>

      <BigButton label="Weiter →" onClick={()=>onNext({intolerances,disliked})}/>
    </div>
  );
}

function PreferencesScreen({ onGenerate, onBack }) {
  const [time, setTime] = useState(null);
  const [mood, setMood] = useState(null);
  const [portion, setPortion] = useState(null);
  const ready = time&&mood&&portion;

  return (
    <div style={{minHeight:"100vh",background:C.bg,padding:"56px 24px 32px",display:"flex",flexDirection:"column"}}>
      <button onClick={onBack} style={{color:C.textMuted,fontSize:14,textAlign:"left",marginBottom:14,display:"flex",alignItems:"center",gap:6}}>← Zurück</button>
      <ProgressBar step={3} total={3}/>
      <div style={{marginBottom:26,animation:"fadeUp 0.5s ease"}}>
        <h2 style={{fontFamily:DISPLAY,fontSize:28,fontWeight:700,lineHeight:1.2,marginBottom:6}}>Wie ist deine Stimmung?</h2>
        <p style={{color:C.textMuted,fontSize:14}}>Nur 3 kurze Fragen.</p>
      </div>

      <div style={{display:"flex",flexDirection:"column",gap:22,animation:"fadeUp 0.5s 0.1s ease both"}}>
        <div>
          <SectionLabel>⏱ Wie viel Zeit hast du?</SectionLabel>
          <div style={{display:"flex",gap:8}}>
            {[["Schnell","⚡","≤15 Min"],["Normal","🕐","30 Min"],["Gemütlich","🌿","60+ Min"]].map(([l,e,s])=>(
              <button key={l} onClick={()=>setTime(l)} style={{flex:1,padding:"13px 8px",borderRadius:14,fontFamily:BODY,border:`1.5px solid ${time===l?C.accent:C.cardBorder}`,background:time===l?C.accentGlow:C.card,color:time===l?C.accent:C.textMuted,fontSize:12,fontWeight:500,display:"flex",flexDirection:"column",alignItems:"center",gap:4,transition:"all 0.2s"}}>
                <span style={{fontSize:22}}>{e}</span><span style={{fontWeight:600}}>{l}</span><span style={{fontSize:11,opacity:0.7}}>{s}</span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <SectionLabel>🍽 Worauf hast du Hunger?</SectionLabel>
          <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
            {[["Herzhaft","🥩"],["Leicht","🥗"],["Comfort","🫕"],["Überrasch mich!","🎲"]].map(([l,e])=>(
              <button key={l} onClick={()=>setMood(l)} style={{flex:1,minWidth:"45%",padding:"12px 6px",borderRadius:14,fontFamily:BODY,border:`1.5px solid ${mood===l?C.accent:C.cardBorder}`,background:mood===l?C.accentGlow:C.card,color:mood===l?C.accent:C.textMuted,fontSize:12,fontWeight:500,display:"flex",flexDirection:"column",alignItems:"center",gap:4,transition:"all 0.2s"}}>
                <span style={{fontSize:20}}>{e}</span>{l}
              </button>
            ))}
          </div>
        </div>

        <div>
          <SectionLabel>👥 Für wie viele Personen?</SectionLabel>
          <div style={{display:"flex",gap:8}}>
            {[["1","🧑"],["2","👫"],["3–4","👨‍👩‍👧"],["5+","🎉"]].map(([l,e])=>(
              <button key={l} onClick={()=>setPortion(l)} style={{flex:1,padding:"13px 8px",borderRadius:14,fontFamily:BODY,border:`1.5px solid ${portion===l?C.accent:C.cardBorder}`,background:portion===l?C.accentGlow:C.card,color:portion===l?C.accent:C.textMuted,fontSize:13,fontWeight:500,display:"flex",flexDirection:"column",alignItems:"center",gap:4,transition:"all 0.2s"}}>
                <span style={{fontSize:22}}>{e}</span>{l}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div style={{flex:1}}/>
      <BigButton label="✨ Rezept generieren" onClick={()=>ready&&onGenerate({time,mood,portion})} disabled={!ready} style={{marginTop:24}}/>
    </div>
  );
}

function LoadingScreen() {
  const [step, setStep] = useState(0);
  const steps = ["Analysiere deine Präferenzen...","Kreiere das perfekte Rezept...","Fast fertig..."];
  useState(()=>{ const t1=setTimeout(()=>setStep(1),1800); const t2=setTimeout(()=>setStep(2),3500); return()=>{clearTimeout(t1);clearTimeout(t2);}; });
  return (
    <div style={{minHeight:"100vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:32,textAlign:"center",background:`radial-gradient(ellipse at 50% 40%, rgba(245,166,35,0.06) 0%, transparent 60%), ${C.bg}`}}>
      <span style={{fontSize:56,display:"block",marginBottom:32,animation:"bounce 1s ease-in-out infinite"}}>👨‍🍳</span>
      <h2 style={{fontFamily:DISPLAY,fontSize:26,fontWeight:700,marginBottom:12}}>Ich koche für dich...</h2>
      <p style={{color:C.accent,fontSize:14,fontWeight:500,animation:"pulse 1.5s ease-in-out infinite"}}>{steps[step]}</p>
      <div style={{display:"flex",gap:6,marginTop:32}}>
        {steps.map((_,i)=><div key={i} style={{width:i<=step?24:8,height:8,borderRadius:4,background:i<=step?C.accent:C.cardBorder,transition:"all 0.4s"}}/>)}
      </div>
    </div>
  );
}

function RecipeScreen({ recipe, filters, onNope, onRestart, onBack }) {
  const [showNope, setShowNope] = useState(false);
  const [showShopping, setShowShopping] = useState(false);
  if (!recipe) return null;
  const missing = recipe.ingredients?.filter(i=>!i.available)||[];

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
        <p style={{color:C.textMuted,fontSize:14,lineHeight:1.6,marginBottom:14}}>{recipe.description}</p>
        <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:(filters?.intolerances?.length||filters?.disliked?.length)?12:0}}>
          {[["⏱",recipe.time],["📊",recipe.difficulty],["🔥",recipe.calories]].map(([icon,val])=>(
            <div key={val} style={{background:C.card,border:`1px solid ${C.cardBorder}`,borderRadius:10,padding:"7px 12px",display:"flex",alignItems:"center",gap:5,fontSize:12,color:C.textMuted}}>{icon} {val}</div>
          ))}
        </div>
        {(filters?.intolerances?.length>0||filters?.disliked?.length>0) && (
          <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
            {filters.intolerances?.map(i=><Chip key={i} label={i} color={C.danger} dimColor="#b03030" glowColor={C.dangerGlow}/>)}
            {filters.disliked?.map(d=><Chip key={d} label={`Kein ${d}`} color={C.textMuted} dimColor={C.textDim} glowColor={C.surface}/>)}
          </div>
        )}
      </div>

      <div style={{padding:"22px 24px 140px",display:"flex",flexDirection:"column",gap:18}}>
        <div style={{background:C.card,border:`1px solid ${C.cardBorder}`,borderRadius:18,padding:18,animation:"fadeUp 0.5s 0.1s ease both"}}>
          <h3 style={{fontFamily:DISPLAY,fontSize:17,marginBottom:14}}>🛒 Zutaten</h3>
          {recipe.ingredients?.map((ing,i)=>(
            <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"9px 0",borderBottom:i<recipe.ingredients.length-1?`1px solid ${C.cardBorder}`:"none"}}>
              <span style={{fontSize:14,color:ing.available?C.text:C.accent}}>{ing.available?"✅":"🛒"} {ing.name}</span>
              <span style={{fontSize:13,color:C.textMuted}}>{ing.amount}</span>
            </div>
          ))}
          {missing.length>0 && (
            <>
              <button onClick={()=>setShowShopping(!showShopping)} style={{marginTop:12,width:"100%",padding:"10px",borderRadius:10,background:C.accentGlow,border:`1px solid ${C.accentDim}`,color:C.accent,fontSize:13,fontWeight:600,fontFamily:BODY}}>
                🛒 Einkaufsliste ({missing.length}) {showShopping?"▲":"▼"}
              </button>
              {showShopping && <div style={{marginTop:10,padding:12,background:C.surface,borderRadius:10,animation:"fadeIn 0.3s ease"}}>{missing.map((ing,i)=><div key={i} style={{fontSize:13,color:C.accent,padding:"4px 0"}}>• {ing.name} – {ing.amount}</div>)}</div>}
            </>
          )}
        </div>

        <div style={{background:C.card,border:`1px solid ${C.cardBorder}`,borderRadius:18,padding:18,animation:"fadeUp 0.5s 0.15s ease both"}}>
          <h3 style={{fontFamily:DISPLAY,fontSize:17,marginBottom:14}}>👨‍🍳 Zubereitung</h3>
          <div style={{display:"flex",flexDirection:"column",gap:16}}>
            {recipe.steps?.map((step,i)=>(
              <div key={i} style={{display:"flex",gap:14,alignItems:"flex-start"}}>
                <div style={{minWidth:28,height:28,borderRadius:"50%",background:`linear-gradient(135deg,${C.accent},${C.accentDim})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:700,color:"#0f0e0c",flexShrink:0}}>{i+1}</div>
                <p style={{fontSize:14,color:C.textMuted,lineHeight:1.6,paddingTop:4}}>{step}</p>
              </div>
            ))}
          </div>
        </div>

        {recipe.tip && (
          <div style={{background:C.accentGlow,border:`1px solid ${C.accentDim}`,borderRadius:14,padding:14,animation:"fadeUp 0.5s 0.2s ease both"}}>
            <p style={{fontSize:13,color:C.accent,lineHeight:1.6}}>💡 <strong>Tipp:</strong> {recipe.tip}</p>
          </div>
        )}
      </div>

      <div style={{position:"fixed",bottom:0,left:0,right:0,background:`linear-gradient(0deg,${C.bg} 70%,transparent)`,padding:"16px 24px 36px",display:"flex",gap:10,maxWidth:430,margin:"0 auto"}}>
        <button onClick={()=>setShowNope(true)} style={{flex:1,padding:"15px",borderRadius:50,border:`1.5px solid ${C.cardBorder}`,background:C.card,color:C.textMuted,fontWeight:600,fontSize:15,fontFamily:BODY}}>😑 Nope</button>
        <button onClick={onRestart} style={{flex:2,padding:"15px",borderRadius:50,background:`linear-gradient(135deg,${C.accent},${C.accentDim})`,color:"#0f0e0c",fontWeight:700,fontSize:15,fontFamily:BODY,boxShadow:`0 8px 24px rgba(245,166,35,0.3)`}}>✅ Los kochen!</button>
      </div>

      {showNope && (
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.7)",display:"flex",alignItems:"flex-end",zIndex:100,animation:"fadeIn 0.2s ease"}} onClick={()=>setShowNope(false)}>
          <div onClick={e=>e.stopPropagation()} style={{background:C.card,borderRadius:"24px 24px 0 0",padding:"28px 24px 52px",width:"100%",border:`1px solid ${C.cardBorder}`,animation:"slideUp 0.35s ease",maxWidth:430,margin:"0 auto"}}>
            <div style={{width:36,height:4,borderRadius:2,background:C.cardBorder,margin:"0 auto 24px"}}/>
            <h3 style={{fontFamily:DISPLAY,fontSize:20,marginBottom:6}}>Kein Hunger drauf?</h3>
            <p style={{color:C.textMuted,fontSize:14,marginBottom:20}}>Was ist das Problem?</p>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
              {[{label:"Zu aufwendig",emoji:"😴"},{label:"Kein Hunger drauf",emoji:"🙅"},{label:"Was ganz anderes",emoji:"🌮"},{label:"Lieber bestellen",emoji:"🛵"}].map(({label,emoji})=>(
                <button key={label} onClick={()=>{setShowNope(false);onNope(label);}} style={{padding:"16px 12px",borderRadius:14,border:`1.5px solid ${C.cardBorder}`,background:C.surface,color:C.text,fontSize:13,fontWeight:500,fontFamily:BODY,display:"flex",flexDirection:"column",alignItems:"center",gap:6}}>
                  <span style={{fontSize:24}}>{emoji}</span>{label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Mahlzeit() {
  const [screen, setScreen] = useState("splash");
  const [ingredients, setIngredients] = useState([]);
  const [filters, setFilters] = useState({intolerances:[],disliked:[]});
  const [prefs, setPrefs] = useState(null);
  const [recipe, setRecipe] = useState(null);

  const callAPI = async (finalPrefs, nope=null) => {
    setScreen("loading");
    try {
      const resp = await fetch("/api/claude", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body:JSON.stringify({ type:"recipe", ingredients, time:finalPrefs.time, mood:finalPrefs.mood, portion:finalPrefs.portion, intolerances:filters.intolerances, disliked:filters.disliked, nope })
      });
      const data = await resp.json();
      if (data.recipe) { setRecipe(data.recipe); setScreen("recipe"); }
    } catch(err) {
      console.error(err);
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
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent"/>
      </Head>
      <div style={{maxWidth:430,margin:"0 auto",minHeight:"100vh",background:C.bg,overflowX:"hidden"}}>
        {screen==="splash" && <SplashScreen onStart={()=>setScreen("ingredients")}/>}
        {screen==="ingredients" && <IngredientsScreen onNext={ings=>{setIngredients(ings);setScreen("filters");}} onSkip={()=>{setIngredients([]);setScreen("filters");}}/>}
        {screen==="filters" && <FiltersScreen filters={filters} onNext={f=>{setFilters(f);setScreen("preferences");}} onBack={()=>setScreen("ingredients")}/>}
        {screen==="preferences" && <PreferencesScreen onGenerate={p=>{setPrefs(p);callAPI(p);}} onBack={()=>setScreen("filters")}/>}
        {screen==="loading" && <LoadingScreen/>}
        {screen==="recipe" && <RecipeScreen recipe={recipe} filters={filters} onNope={r=>callAPI(prefs,r)} onBack={()=>setScreen("preferences")} onRestart={()=>{setRecipe(null);setIngredients([]);setScreen("splash");}}/>}
      </div>
    </>
  );
}
