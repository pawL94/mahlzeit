import { useState, useEffect } from "react";
import { C, D, B, BackBtn } from "./design";
import { store } from "../lib/store";

export default function SavedRecipesScreen({ profile, profiles, onBack, onOpen }) {
  const [recipes, setRecipes] = useState([]);
  const [tab, setTab] = useState("saved");
  const [moveTarget, setMoveTarget] = useState(null);

  useEffect(()=>{ setRecipes(store.recipes.load(profile?.id)); },[profile]);

  const update = (u) => { setRecipes(u); store.recipes.save(profile?.id, u); };

  const rate = (id, val) => {
    const u = recipes.map(r=>{
      if(r.id!==id) return r;
      if(val==="up") return {...r,status:"loved",ratedAt:new Date().toLocaleDateString("de-DE")};
      return null;
    }).filter(Boolean);
    update(u);
  };

  const moveToProfile = (recipe, tid) => {
    update(recipes.filter(r=>r.id!==recipe.id));
    const tr = store.recipes.load(tid);
    store.recipes.save(tid,[{...recipe,profileId:tid},...tr]);
    setMoveTarget(null);
  };

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
