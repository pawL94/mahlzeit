import { useState } from "react";
import { C, D, B, BackBtn, SL, BigBtn, PBar, TagToggle, Chip } from "./design";
import { DEVICES, DISLIKE_OPTIONS } from "../lib/constants";
import { loadPersons, savePersons } from "../lib/store";

export default function PreferencesScreen({ profile, onGenerate, onBack, step=2, total=2, defaultPrefs }) {
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

        <div>
          <SL>👥 Für wie viele Personen?</SL>
          <div style={{display:"flex",gap:6}}>
            {[1,2,3,4,5,6,7,8].map(n=>(
              <button key={n} onClick={()=>{setPersons(n);savePersons(profile?.id,n);}} style={{flex:1,padding:"10px 0",borderRadius:12,fontFamily:B,fontSize:13,fontWeight:600,border:`1.5px solid ${persons===n?C.accent:C.cardBorder}`,background:persons===n?C.accentGlow:C.card,color:persons===n?C.accent:C.textMuted,transition:"all 0.15s"}}>{n}</button>
            ))}
          </div>
        </div>

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
