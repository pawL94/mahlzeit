import { useState } from "react";
import { C, D, B, BackBtn } from "./design";
import ProfileEditor from "./ProfileEditor";

export default function ProfileManager({ profiles, onSave, onBack }) {
  const [editing, setEditing] = useState(null);

  if (editing) {
    return (
      <ProfileEditor
        profile={editing === "new" ? null : editing}
        isNew={editing === "new"}
        onSave={(p) => {
          const updated = editing === "new"
            ? [...profiles, p]
            : profiles.map(x => x.id === p.id ? p : x);
          onSave(updated);
          setEditing(null);
        }}
        onCancel={() => setEditing(null)}
      />
    );
  }

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
      <button onClick={()=>setEditing("new")} style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:8, padding:"15px", borderRadius:16, border:`1.5px dashed ${C.cardBorder}`, color:C.textMuted, fontSize:14, fontFamily:B, background:"transparent", width:"100%" }}>
        + Neues Profil erstellen
      </button>
    </div>
  );
}
