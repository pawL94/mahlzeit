import { useState } from "react";
import { C, D, B, BackBtn, PBar, Spin } from "./design";
import { store } from "../lib/store";
import { DAYS, DEVICES } from "../lib/constants";
import { IngredientsScreen } from "./IngredientsScreen";
import PreferencesScreen from "./PreferencesScreen";
import RecipeScreen from "./RecipeScreen";

export default function WeekPlanner({ profile, onBack }) {
  const empty = () => DAYS.map((day,i)=>({day,recipe:null,loading:false,time:i>=5?"Gemütlich":"Normal",device:null}));

  const [phase, setPhase] = useState("setup-ingredients");
  const [wIng, setWIng] = useState([]);
  const [wNoShopping, setWNoShopping] = useState(false); // Fix #10
  const [wPrefs, setWPrefs] = useState(null);
  const [week, setWeek] = useState(()=>store.week.load(profile?.id)||empty());
  const [genAll, setGenAll] = useState(false);
  const [viewIdx, setViewIdx] = useState(null);
  const [showShopping, setShowShopping] = useState(false);
  const [shoppingList, setShoppingList] = useState(null);
  const [loadingShopping, setLoadingShopping] = useState(false);
  const [devicePickerIdx, setDevicePickerIdx] = useState(null);

  const genDay = async (idx, cur, prefs, ing, dis, nope=null) => {
    const p = prefs||wPrefs||{time:"Normal",mood:"Herzhaft",portion:2};
    const i = ing!==undefined?ing:wIng;
    const d = dis!==undefined?dis:[];
    setWeek(prev=>prev.map((x,j)=>j===idx?{...x,loading:true}:x));
    const restr = [...(profile?.diet||[]),...(profile?.custom||[])];
    const loved = store.recipes.load(profile?.id).filter(r=>r.status==="loved").slice(0,8).map(r=>r.name);
    const used = (cur||week).filter((_,j)=>j!==idx).map(x=>x.recipe?.name).filter(Boolean);
    const dayTime = cur?(cur[idx]?.time||"Normal"):(week[idx]?.time||"Normal");
    const dayDevice = cur?(cur[idx]?.device?[cur[idx].device]:[]):(week[idx]?.device?[week[idx].device]:[]);
    try {
      const resp = await fetch("/api/claude",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({
        type:"recipe",ingredients:i,time:p.time||dayTime,mood:p.mood||"Herzhaft",
        portion:p.portion||2,intolerances:restr,disliked:d,nope,lovedRecipes:loved,
        avoidNames:used,weekMode:true,preferredCuisines:profile?.cuisines||[],
        availability:profile?.availability||"supermarkt",devices:dayDevice,
        noShopping:wNoShopping, // Fix #10: was previously ignored
      })});
      const data = await resp.json();
      if(data.recipe){ setWeek(prev=>{ const u=prev.map((x,j)=>j===idx?{...x,recipe:data.recipe,loading:false}:x); store.week.save(profile?.id,u); return u; }); }
      else setWeek(prev=>prev.map((x,j)=>j===idx?{...x,loading:false}:x));
    } catch(e) {
      console.warn("genDay error:", e);
      setWeek(prev=>prev.map((x,j)=>j===idx?{...x,loading:false}:x));
    }
  };

  const generateAll = async (prefs, ing, dis) => {
    setGenAll(true);
    const fresh = empty(); setWeek(fresh);
    const generated = [...fresh];
    for(let i=0;i<7;i++){
      await genDay(i,generated,prefs,ing,dis);
      setWeek(prev=>{ generated.splice(0,7,...prev); return prev; });
      await new Promise(r=>setTimeout(r,100));
    }
    setGenAll(false);
  };

  const saveR = (recipe) => {
    const rs = store.recipes.load(profile?.id);
    store.recipes.save(profile?.id,[{...recipe,id:Date.now(),savedAt:new Date().toLocaleDateString("de-DE"),profileId:profile?.id||null,status:"saved"},...rs.slice(0,49)]);
  };

  const combineShoppingList = async () => {
    setLoadingShopping(true); setShoppingList(null);
    const items = [];
    week.forEach(d=>{ if(d.recipe?.ingredients) d.recipe.ingredients.filter(i=>!i.available).forEach(i=>{ items.push({name:i.name,amount:i.amount,day:d.day}); }); });
    if(items.length===0){ setShoppingList({categories:[]}); setLoadingShopping(false); return; }
    try {
      const resp = await fetch("/api/claude",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({type:"combine-shopping",items})});
      const data = await resp.json();
      setShoppingList(data);
    } catch(e) { console.error(e); } finally { setLoadingShopping(false); }
  };

  if(viewIdx!==null&&week[viewIdx]?.recipe){
    return <RecipeScreen recipe={week[viewIdx].recipe} profile={profile} disliked={[]}
      onNope={(reason)=>{ genDay(viewIdx,week,wPrefs,wIng,[],reason); setViewIdx(null); }}
      onBack={()=>setViewIdx(null)} onRestart={()=>setViewIdx(null)} onViewSaved={()=>setViewIdx(null)}
      onRate={()=>setViewIdx(null)}/>;
  }

  if(phase==="setup-ingredients") return (
    <div style={{minHeight:"100vh",background:C.bg,padding:"56px 24px 32px",display:"flex",flexDirection:"column"}}>
      <BackBtn onClick={onBack}/>
      <PBar step={1} total={3}/>
      <div style={{marginBottom:18}}>
        <h2 style={{fontFamily:D,fontSize:28,fontWeight:700,lineHeight:1.2,marginBottom:4,color:C.text}}>Was ist diese Woche im Kühlschrank?</h2>
        <p style={{color:C.textMuted,fontSize:14}}>Gilt als Basis für alle Tage.</p>
      </div>
      <IngredientsScreen
        onNext={(ings,must,noShop)=>{ setWIng(ings); setWNoShopping(noShop||false); setPhase("setup-prefs"); }}
        onSkip={()=>{ setWIng([]); setWNoShopping(false); setPhase("setup-prefs"); }}
      />
    </div>
  );

  if(phase==="setup-prefs") return (
    <PreferencesScreen profile={profile} step={2} total={3}
      onGenerate={p=>{ setWPrefs(p); setPhase("week"); generateAll(p,wIng,[]); }}
      onBack={()=>setPhase("setup-ingredients")}/>
  );

  return (
    <div style={{minHeight:"100vh",background:C.bg,padding:"56px 24px 32px",display:"flex",flexDirection:"column"}}>
      <BackBtn onClick={onBack}/>
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:4}}>
        <h2 style={{fontFamily:D,fontSize:24,fontWeight:700}}>Wochenplaner</h2>
        {profile&&<span style={{fontSize:18}}>{profile.emoji}</span>}
      </div>
      <p style={{color:C.textMuted,fontSize:13,marginBottom:14}}>Tippe auf ein Gericht für Details & Nope.</p>

      <div style={{display:"flex",gap:8,marginBottom:10}}>
        <button onClick={()=>setPhase("setup-ingredients")} style={{flex:1,padding:"10px",borderRadius:50,background:C.card,border:`1.5px solid ${C.cardBorder}`,color:C.textMuted,fontWeight:600,fontSize:13,fontFamily:B}}>← Neu planen</button>
        <button onClick={()=>generateAll(wPrefs,wIng,[])} disabled={genAll} style={{flex:2,padding:"10px",borderRadius:50,background:genAll?C.surface:`linear-gradient(135deg,${C.accent},${C.accentDim})`,color:genAll?"#A09080":"#1C1410",fontWeight:700,fontSize:13,fontFamily:B,boxShadow:genAll?"none":"0 4px 16px rgba(44,110,73,0.22)"}}>
          {genAll?"Generiert...":"✨ Alle neu"}
        </button>
      </div>

      {week.some(d=>d.recipe?.ingredients?.some(i=>!i.available))&&(
        <button onClick={()=>{setShowShopping(!showShopping);if(!showShopping&&!shoppingList)combineShoppingList();}} style={{width:"100%",padding:"11px",borderRadius:14,background:showShopping?C.accentGlow:C.card,border:`1.5px solid ${showShopping?C.accent:C.cardBorder}`,color:showShopping?C.accent:C.textMuted,fontWeight:600,fontSize:14,fontFamily:B,marginBottom:10,display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
          🛒 {showShopping?"Einkaufsliste ausblenden":"Wocheneinkaufsliste"}
        </button>
      )}

      {showShopping&&(
        <div style={{background:C.card,border:`1px solid ${C.cardBorder}`,borderRadius:18,padding:16,marginBottom:12}}>
          {loadingShopping?(<div style={{display:"flex",alignItems:"center",gap:10}}><Spin size={18}/><p style={{color:C.textMuted,fontSize:14}}>Liste wird zusammengefasst...</p></div>)
          :shoppingList?.categories?.length===0?(<p style={{color:C.textMuted,fontSize:14}}>Alle Zutaten vorhanden!</p>)
          :shoppingList?(
            <>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
                <h3 style={{fontFamily:D,fontSize:16}}>🛒 Wocheneinkauf</h3>
                <button onClick={combineShoppingList} style={{color:C.accent,fontSize:12,fontFamily:B,padding:"4px 10px",background:C.accentGlow,borderRadius:8}}>↻</button>
              </div>
              {shoppingList.categories.map((cat,ci)=>(
                <div key={ci} style={{marginBottom:14}}>
                  <p style={{color:C.accent,fontSize:10,fontWeight:700,letterSpacing:1.5,textTransform:"uppercase",marginBottom:7}}>{cat.name}</p>
                  {cat.items.map((item,ii)=>(<div key={ii} style={{display:"flex",justifyContent:"space-between",padding:"6px 0",borderBottom:`1px solid ${C.cardBorder}`}}><span style={{fontSize:13}}>🛒 {item.name}</span><span style={{fontSize:12,color:C.textMuted}}>{item.amount}</span></div>))}
                </div>
              ))}
              <button onClick={()=>{ const t=shoppingList.categories.map(c=>c.name+":\n"+c.items.map(i=>"- "+i.name+": "+i.amount).join("\n")).join("\n\n"); navigator.clipboard.writeText(t).catch(()=>{}); }} style={{marginTop:6,width:"100%",padding:"9px",borderRadius:10,background:C.surface,border:`1px solid ${C.cardBorder}`,color:C.textMuted,fontSize:13,fontFamily:B,fontWeight:600}}>📋 Liste kopieren</button>
            </>
          ):null}
        </div>
      )}

      <div style={{display:"flex",flexDirection:"column",gap:10,overflowY:"auto"}}>
        {week.map((d,i)=>(
          <div key={d.day} style={{background:C.card,border:`1px solid ${C.cardBorder}`,borderRadius:18,padding:"14px 16px"}}>
            <div style={{marginBottom:8}}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:6}}>
                <p style={{fontWeight:700,fontSize:15,color:C.accent}}>{d.day}</p>
                <div style={{display:"flex",gap:7}}>
                  {d.recipe&&<button onClick={()=>saveR(d.recipe)} style={{color:C.green,fontSize:12,fontFamily:B,padding:"4px 9px",background:C.greenGlow,borderRadius:8}}>📥</button>}
                  <button onClick={()=>genDay(i,week)} disabled={d.loading||genAll} style={{padding:"5px 11px",borderRadius:10,background:C.accentGlow,border:`1px solid ${C.accentDim}`,color:C.accent,fontSize:12,fontFamily:B,fontWeight:600}}>{d.loading?"...":d.recipe?"🔄":"Generieren"}</button>
                </div>
              </div>
              <div style={{display:"flex",gap:5,marginBottom:6}}>
                {[["Schnell","⚡"],["Normal","🕐"],["Gemütlich","🌿"]].map(([t,e])=>(
                  <button key={t} onClick={()=>setWeek(prev=>{const u=prev.map((x,j)=>j===i?{...x,time:t}:x);store.week.save(profile?.id,u);return u;})} style={{flex:1,padding:"4px 3px",borderRadius:7,fontFamily:B,fontSize:10,fontWeight:500,border:`1px solid ${d.time===t?C.accent:C.cardBorder}`,background:d.time===t?C.accentGlow:C.surface,color:d.time===t?C.accent:C.textMuted,display:"flex",alignItems:"center",justifyContent:"center",gap:2}}><span>{e}</span>{t}</button>
                ))}
              </div>
              <button onClick={()=>setDevicePickerIdx(devicePickerIdx===i?null:i)} style={{padding:"4px 12px",borderRadius:8,fontFamily:B,fontSize:11,fontWeight:500,border:`1px solid ${d.device?C.accent:C.cardBorder}`,background:d.device?C.accentGlow:C.surface,color:d.device?C.accent:C.textMuted,display:"flex",alignItems:"center",gap:5}}>
                {d.device?(DEVICES.find(x=>x.l===d.device)?.e+" "+d.device):"🍳 Gerät (optional)"}
              </button>
              {devicePickerIdx===i&&(
                <div style={{marginTop:6,background:C.surface,borderRadius:10,padding:8,display:"flex",flexWrap:"wrap",gap:6}}>
                  {d.device&&<button onClick={()=>{setWeek(prev=>{const u=prev.map((x,j)=>j===i?{...x,device:null}:x);store.week.save(profile?.id,u);return u;});setDevicePickerIdx(null);}} style={{padding:"5px 10px",borderRadius:8,fontFamily:B,fontSize:12,border:`1px solid ${C.danger}`,background:C.dangerGlow,color:C.danger}}>✕ Kein Gerät</button>}
                  {DEVICES.map(({l,e})=>(<button key={l} onClick={()=>{setWeek(prev=>{const u=prev.map((x,j)=>j===i?{...x,device:l}:x);store.week.save(profile?.id,u);return u;});setDevicePickerIdx(null);}} style={{padding:"5px 10px",borderRadius:8,fontFamily:B,fontSize:12,border:`1px solid ${d.device===l?C.accent:C.cardBorder}`,background:d.device===l?C.accentGlow:C.card,color:d.device===l?C.accent:C.textMuted,display:"flex",alignItems:"center",gap:4}}><span>{e}</span>{l}</button>))}
                </div>
              )}
            </div>
            {d.loading?(<div style={{display:"flex",alignItems:"center",gap:8,padding:"6px 0"}}><Spin size={16}/><p style={{color:C.textMuted,fontSize:13}}>Wird generiert...</p></div>)
            :d.recipe?(<button onClick={()=>setViewIdx(i)} style={{width:"100%",textAlign:"left",background:"transparent",fontFamily:B,padding:0,cursor:"pointer"}}>
                <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:4}}>
                  <span style={{fontSize:20}}>{d.recipe.emoji||"🍽"}</span>
                  <div style={{flex:1}}><p style={{fontWeight:600,fontSize:14,color:C.text}}>{d.recipe.name}</p><p style={{color:C.textMuted,fontSize:12}}>{d.recipe.time} · {d.recipe.difficulty}</p></div>
                  <span style={{color:C.accent,fontSize:16}}>›</span>
                </div>
                <p style={{color:C.textMuted,fontSize:13,lineHeight:1.5}}>{d.recipe.description}</p>
              </button>)
            :(<p style={{color:C.textMuted,fontSize:13,marginTop:4}}>Noch kein Gericht geplant</p>)}
          </div>
        ))}
      </div>
    </div>
  );
}
