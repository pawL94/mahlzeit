import { useState, useEffect } from "react";
import { C, D, B, SL } from "./design";

export default function SplashScreen({ profiles, onStart, onQuickStart, onManageProfiles, onViewSaved, onWeekPlanner, lastSession }) {
  const [selected, setSelected] = useState(null);
  useEffect(()=>{ if(profiles.length>0) setSelected(profiles[0].id); },[profiles]);
  const active = profiles.find(p=>p.id===selected)||null;
  const moodEmoji = { "Herzhaft":"🥩", "Leicht":"🥗", "Dessert":"🍰", "Überrasch mich!":"🎲" };

  return (
    <div style={{ minHeight:"100vh", background:`radial-gradient(ellipse at 60% 10%, rgba(44,110,73,0.08) 0%, transparent 55%), ${C.bg}`, padding:"48px 24px 40px", display:"flex", flexDirection:"column" }}>
      <div style={{ textAlign:"center", marginBottom:28 }}>
        <span style={{ fontSize:44, display:"block", marginBottom:8, animation:"bounce 2.5s ease-in-out infinite" }}>🍳</span>
        <h1 style={{ fontFamily:D, fontSize:38, fontWeight:700, lineHeight:1, marginBottom:4, color:C.text }}>Mahl<span style={{color:C.brand}}>zeit</span></h1>
        <p style={{ color:C.textMuted, fontSize:13 }}>Nie wieder grübeln was du kochen sollst.</p>
      </div>

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
        <button onClick={onManageProfiles} style={{ marginBottom:16, padding:18, background:C.card, border:`1.5px dashed ${C.cardBorder}`, borderRadius:18, width:"100%", cursor:"pointer", fontFamily:B, textAlign:"center" }}>
          <p style={{fontSize:28,marginBottom:6}}>👤</p>
          <p style={{color:C.textMuted,fontSize:14,marginBottom:3}}>Noch kein Profil erstellt</p>
          <p style={{color:C.accent,fontSize:13,fontWeight:600}}>Tippe hier um loszulegen →</p>
        </button>
      )}

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

      <button onClick={()=>onStart(active)} style={{ background:`linear-gradient(135deg,${C.accent},${C.accentDim})`, color:"#FFFFFF", fontWeight:700, fontSize:16, padding:"16px", borderRadius:50, fontFamily:B, boxShadow:"0 8px 32px rgba(44,110,73,0.22)", marginBottom:10 }}>
        Rezept finden →
      </button>
      <button onClick={()=>onWeekPlanner(active)} style={{ background:C.card, border:`1.5px solid ${C.cardBorder}`, color:C.text, fontWeight:600, fontSize:15, padding:"14px", borderRadius:50, fontFamily:B, marginBottom:16 }}>
        📅 Wochenplaner
      </button>

      <div style={{ display:"flex", justifyContent:"center", gap:20 }}>
        <button onClick={onManageProfiles} style={{ color:C.textMuted, fontSize:13, fontFamily:B }}>{profiles.length>0?"⚙️ Profile":"+ Profil erstellen"}</button>
        <button onClick={()=>onViewSaved(active)} style={{ color:C.textMuted, fontSize:13, fontFamily:B }}>📚 Meine Rezepte</button>
      </div>
    </div>
  );
}
