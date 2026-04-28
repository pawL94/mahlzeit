import { useState } from "react";
import { C, D, B, Chip, Spin } from "./design";
import { store, savePersons } from "../lib/store";

export default function RecipeScreen({ recipe, profile, disliked, onNope, onRestart, onBack, onViewSaved, onRate }) {
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

        <div style={{display:"flex",gap:8,marginBottom:12,flexWrap:"wrap"}}>
          <button onClick={handleSave} style={{display:"flex",alignItems:"center",gap:5,padding:"7px 14px",borderRadius:50,border:`1.5px solid ${saved?C.green:C.cardBorder}`,background:saved?C.greenGlow:C.card,color:saved?C.green:C.textMuted,fontSize:13,fontWeight:600,fontFamily:B,transform:saveAnim?"scale(1.06)":"scale(1)",transition:"all 0.2s"}}>
            {saved?"✅ Gespeichert":"📥 Speichern"}
          </button>
          <button onClick={onViewSaved} style={{display:"flex",alignItems:"center",gap:5,padding:"7px 14px",borderRadius:50,border:`1px solid ${C.cardBorder}`,background:C.card,color:C.textMuted,fontSize:13,fontFamily:B}}>📚 Meine Rezepte</button>
        </div>

        <p style={{color:C.textMuted,fontSize:14,lineHeight:1.6,marginBottom:12}}>{displayRecipe.description}</p>

        <div style={{display:"flex",gap:7,flexWrap:"wrap",marginBottom:allR.length>0?10:0}}>
          {[["⏱",displayRecipe.time],["📊",displayRecipe.difficulty],["🔥",displayRecipe.calories]].map(([icon,val])=>val&&(<div key={val} style={{background:C.card,border:`1px solid ${C.cardBorder}`,borderRadius:8,padding:"6px 10px",fontSize:12,color:C.textMuted}}>{icon} {val}</div>))}
        </div>
        {allR.length>0&&<div style={{display:"flex",flexWrap:"wrap",gap:5}}>{allR.map(r=><Chip key={r} label={r} color={C.danger} dimColor="#b03030" glowColor={C.dangerGlow}/>)}</div>}

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

        <div style={{background:C.card,border:`1px solid ${C.cardBorder}`,borderRadius:18,padding:16,boxShadow:C.shadow}}>
          <h3 style={{fontFamily:D,fontSize:16,marginBottom:14,color:C.text}}>👨‍🍳 Zubereitung</h3>
          {displayRecipe.steps?.map((step,i)=>(<div key={i} style={{display:"flex",gap:12,marginBottom:i<displayRecipe.steps.length-1?14:0}}><div style={{minWidth:26,height:26,borderRadius:"50%",background:`linear-gradient(135deg,${C.accent},${C.accentDim})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,color:"#FFFFFF",flexShrink:0}}>{i+1}</div><p style={{fontSize:14,color:C.textMuted,lineHeight:1.6,paddingTop:2}}>{step}</p></div>))}
        </div>

        {displayRecipe.tip&&<div style={{background:C.accentGlow,border:`1px solid ${C.accentDim}`,borderRadius:12,padding:12}}><p style={{fontSize:13,color:C.accent,lineHeight:1.6}}>💡 <strong>Tipp:</strong> {displayRecipe.tip}</p></div>}
      </div>

      <div style={{position:"fixed",bottom:0,left:0,right:0,background:`linear-gradient(0deg,${C.bg} 70%,rgba(254,252,247,0) 100%)`,padding:"14px 24px 34px",display:"flex",gap:10,maxWidth:430,margin:"0 auto"}}>
        <button onClick={()=>setShowNope(true)} style={{flex:1,padding:"14px",borderRadius:50,border:`1.5px solid ${C.accent}`,background:C.accentGlow,color:C.accent,fontWeight:700,fontSize:14,fontFamily:B}}>🔄 Neuer Vorschlag</button>
        <button onClick={()=>onRate()} style={{flex:2,padding:"14px",borderRadius:50,background:`linear-gradient(135deg,${C.accent},${C.accentDim})`,color:"#FFFFFF",fontWeight:700,fontSize:15,fontFamily:B,boxShadow:"0 6px 20px rgba(44,110,73,0.22)"}}>Fertig ✓</button>
      </div>

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
                  <div><p style={{fontWeight:600,fontSize:14,marginBottom:2,color:C.text}}>{label}</p><p style={{color:C.textMuted,fontSize:12}}>{desc}</p></div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
