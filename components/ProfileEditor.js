import { useState } from "react";
import { C, D, B, BackBtn, SL, BigBtn, TagToggle, Chip } from "./design";
import { DIET, CUISINES } from "../lib/constants";

export default function ProfileEditor({ profile, onSave, onCancel, isNew }) {
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

      <BigBtn
        label={isNew?"Profil erstellen ✓":"Änderungen speichern"}
        onClick={()=>{ if(name.trim()) onSave({name:name.trim(),emoji,diet,custom,cuisines,availability,id:profile?.id||Date.now()}); }}
        disabled={!name.trim()}
      />
    </div>
  );
}
