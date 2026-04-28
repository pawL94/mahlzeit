import { useState } from "react";
import { C, D, B } from "./design";
import { store } from "../lib/store";

export default function RatingModal({ recipe, profile, onDone }) {
  const [rated, setRated] = useState(false);

  const rate = (val) => {
    if(rated) return;
    setRated(true);
    const rs = store.recipes.load(profile?.id);
    const existing = rs.find(r=>r.name===recipe.name);
    if(existing) {
      const updated = val==="down"
        ? rs.filter(r=>r.name!==recipe.name)
        : rs.map(r=>r.name===recipe.name?{...r,status:"loved",ratedAt:new Date().toLocaleDateString("de-DE")}:r);
      store.recipes.save(profile?.id, updated);
    } else if(val==="up") {
      const entry = {...recipe,id:Date.now(),savedAt:new Date().toLocaleDateString("de-DE"),profileId:profile?.id||null,status:"loved"};
      store.recipes.save(profile?.id,[entry,...rs.slice(0,49)]);
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
