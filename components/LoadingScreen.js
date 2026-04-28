import { C, D, B, Spin } from "./design";

// Fix #9: silent catch replaced with console.warn in callers – these parsers stay lean
function parseStreamField(text, field) {
  const re = new RegExp('"' + field + '"\\s*:\\s*"((?:[^"\\\\]|\\\\.)*)"');
  const m = text.match(re);
  return m ? m[1] : null;
}

function parseStreamArray(text, field) {
  const start = text.indexOf('"' + field + '"');
  if(start===-1) return null;
  const arrStart = text.indexOf('[', start);
  if(arrStart===-1) return null;
  const items = [];
  const re = /"((?:[^"\\\\]|\\\\.)*)"/g;
  re.lastIndex = arrStart + 1;
  let m;
  while((m=re.exec(text))!==null) { if(text[m.index-1]===':') continue; items.push(m[1]); }
  return items.length > 0 ? items : null;
}

function parseStreamIngredients(text) {
  const start = text.indexOf('"ingredients"');
  if(start===-1) return null;
  const arrStart = text.indexOf('[', start);
  if(arrStart===-1) return null;
  const items = [];
  const re = /\{"name":"((?:[^"\\\\]|\\\\.)*)","amount":"((?:[^"\\\\]|\\\\.)*)","available":(true|false)\}/g;
  re.lastIndex = arrStart;
  let m;
  while((m=re.exec(text))!==null) items.push({name:m[1],amount:m[2],available:m[3]==="true"});
  return items.length > 0 ? items : null;
}

export default function LoadingScreen({ streamText="" }) {
  const name = parseStreamField(streamText, "name");
  const emoji = parseStreamField(streamText, "emoji");
  const description = parseStreamField(streamText, "description");
  const time = parseStreamField(streamText, "time");
  const difficulty = parseStreamField(streamText, "difficulty");
  const calories = parseStreamField(streamText, "calories");
  const ingredients = parseStreamIngredients(streamText);
  const steps = parseStreamArray(streamText, "steps");
  const tip = parseStreamField(streamText, "tip");

  if(!name) return (
    <div style={{minHeight:"100vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:32,textAlign:"center",background:C.bg}}>
      <span style={{fontSize:52,display:"block",marginBottom:24,animation:"bounce 1s ease-in-out infinite"}}>👨‍🍳</span>
      <h2 style={{fontFamily:D,fontSize:24,fontWeight:700,marginBottom:10}}>Ich koche für dich...</h2>
      <p style={{color:C.accent,fontSize:14,fontWeight:500,animation:"pulse 1.5s ease-in-out infinite"}}>Analysiere deine Präferenzen...</p>
      <div style={{display:"flex",gap:5,marginTop:28}}>{[0,1,2].map(i=><div key={i} style={{width:8,height:8,borderRadius:4,background:C.accent,animation:`pulse ${1+i*0.3}s ease-in-out infinite`,animationDelay:`${i*0.2}s`}}/>)}</div>
    </div>
  );

  return (
    <div style={{minHeight:"100vh",background:C.bg,overflowY:"auto"}}>
      <div style={{background:"linear-gradient(180deg,rgba(44,110,73,0.05) 0%,transparent 100%)",padding:"60px 24px 24px",borderBottom:`1px solid ${C.cardBorder}`,animation:"fadeUp 0.4s ease"}}>
        <p style={{color:C.accent,fontSize:11,fontWeight:700,letterSpacing:2,textTransform:"uppercase",marginBottom:6}}>🎯 Dein Rezept</p>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12}}>
          <h1 style={{fontFamily:D,fontSize:26,fontWeight:700,lineHeight:1.2,flex:1,paddingRight:14,color:C.text}}>{name}</h1>
          <div style={{background:C.card,border:`1px solid ${C.cardBorder}`,borderRadius:14,padding:"10px",fontSize:26,flexShrink:0}}>{emoji||"🍽"}</div>
        </div>
        {description&&<p style={{color:C.textMuted,fontSize:14,lineHeight:1.6,marginBottom:12,animation:"fadeUp 0.3s ease"}}>{description}</p>}
        {(time||difficulty||calories)&&<div style={{display:"flex",gap:7,flexWrap:"wrap",animation:"fadeUp 0.3s ease"}}>
          {time&&<div style={{background:C.card,border:`1px solid ${C.cardBorder}`,borderRadius:8,padding:"6px 10px",fontSize:12,color:C.textMuted}}>⏱ {time}</div>}
          {difficulty&&<div style={{background:C.card,border:`1px solid ${C.cardBorder}`,borderRadius:8,padding:"6px 10px",fontSize:12,color:C.textMuted}}>📊 {difficulty}</div>}
          {calories&&<div style={{background:C.card,border:`1px solid ${C.cardBorder}`,borderRadius:8,padding:"6px 10px",fontSize:12,color:C.textMuted}}>🔥 {calories}</div>}
        </div>}
      </div>
      <div style={{padding:"20px 24px 120px",display:"flex",flexDirection:"column",gap:16}}>
        {ingredients&&(
          <div style={{background:C.card,border:`1px solid ${C.cardBorder}`,borderRadius:18,padding:16,boxShadow:C.shadow,animation:"fadeUp 0.3s ease"}}>
            <h3 style={{fontFamily:D,fontSize:16,marginBottom:12,color:C.text}}>🛒 Zutaten</h3>
            {ingredients.map((ing,i)=>(<div key={i} style={{display:"flex",justifyContent:"space-between",padding:"8px 0",borderBottom:i<ingredients.length-1?`1px solid ${C.cardBorder}`:"none"}}><span style={{fontSize:13,color:ing.available?C.text:C.accent}}>{ing.available?"✅":"🛒"} {ing.name}</span><span style={{fontSize:12,color:C.textMuted}}>{ing.amount}</span></div>))}
            {!steps&&<div style={{marginTop:10,display:"flex",alignItems:"center",gap:8}}><Spin size={14}/><p style={{color:C.textMuted,fontSize:12}}>Zubereitung wird geladen...</p></div>}
          </div>
        )}
        {!ingredients&&<div style={{display:"flex",alignItems:"center",gap:10,padding:"16px 0"}}><Spin size={18}/><p style={{color:C.textMuted,fontSize:14}}>Zutaten werden zusammengestellt...</p></div>}
        {steps&&(
          <div style={{background:C.card,border:`1px solid ${C.cardBorder}`,borderRadius:18,padding:16,boxShadow:C.shadow,animation:"fadeUp 0.3s ease"}}>
            <h3 style={{fontFamily:D,fontSize:16,marginBottom:12,color:C.text}}>👨‍🍳 Zubereitung</h3>
            {steps.map((step,i)=>(<div key={i} style={{display:"flex",gap:12,marginBottom:i<steps.length-1?14:0}}><div style={{minWidth:26,height:26,borderRadius:"50%",background:`linear-gradient(135deg,${C.accent},${C.accentDim})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,color:"#FFFFFF",flexShrink:0}}>{i+1}</div><p style={{fontSize:13,color:C.textMuted,lineHeight:1.6,paddingTop:3}}>{step}</p></div>))}
          </div>
        )}
        {tip&&<div style={{background:C.accentGlow,border:`1px solid ${C.accentDim}`,borderRadius:12,padding:12,animation:"fadeUp 0.3s ease"}}><p style={{fontSize:13,color:C.accent,lineHeight:1.6}}>💡 <strong>Tipp:</strong> {tip}</p></div>}
      </div>
    </div>
  );
}
