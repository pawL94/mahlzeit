import { useState } from "react";
import { C, D, B, BackBtn, SL, BigBtn, PBar, Spin } from "./design";
import { BASE_SUGGESTIONS } from "../lib/constants";
import { store } from "../lib/store";

// Fix #11: extracted from an unreadable one-liner
async function compressImage(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const MAX = 1024;
      let w = img.width, h = img.height;
      if (w > MAX || h > MAX) {
        if (w > h) { h = Math.round(h * MAX / w); w = MAX; }
        else { w = Math.round(w * MAX / h); h = MAX; }
      }
      canvas.width = w;
      canvas.height = h;
      canvas.getContext("2d").drawImage(img, 0, 0, w, h);

      // Fix #7: determine mimeType from what the canvas actually produced
      let dataUrl = canvas.toDataURL("image/webp", 0.7);
      let mimeType = "image/webp";
      if (!dataUrl.startsWith("data:image/webp")) {
        dataUrl = canvas.toDataURL("image/jpeg", 0.65);
        mimeType = "image/jpeg";
      }

      URL.revokeObjectURL(url);
      resolve({ base64: dataUrl.split(",")[1], mimeType });
    };
    img.onerror = reject;
    img.src = url;
  });
}

export function IngredientsScreen({ onNext, onSkip }) {
  const [input, setInput] = useState("");
  const [ingredients, setIngredients] = useState([]);
  const [mustUse, setMustUse] = useState([]);
  const [noShopping, setNoShopping] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scanDone, setScanDone] = useState(false);
  const [scanError, setScanError] = useState(false);
  const [showScanInfo, setShowScanInfo] = useState(false);
  const [pendingInputId, setPendingInputId] = useState(null);
  const [scanCount, setScanCount] = useState(0);
  const [lastTap, setLastTap] = useState({ing:null,time:0});
  const MAX_SCANS = 3;

  const freq = store.ingFreq.load();
  const sortedSugg = [...BASE_SUGGESTIONS].sort((a,b)=>(freq[b]||0)-(freq[a]||0));

  const add = () => { const v=input.trim(); if(v&&!ingredients.includes(v)) setIngredients(p=>[...p,v]); setInput(""); };
  const handleKey = e => { if(e.key==="Enter"||e.key===","){e.preventDefault();add();} };

  const handleIngredientTap = (ing) => {
    const now = Date.now();
    if(lastTap.ing===ing && now-lastTap.time<400) {
      setMustUse(p=>p.includes(ing)?p.filter(x=>x!==ing):[...p,ing]);
      setLastTap({ing:null,time:0});
    } else {
      setLastTap({ing,time:now});
    }
  };

  const triggerScan = (inputId) => {
    if(!localStorage.getItem("mz_scan_consent")) { setPendingInputId(inputId); setShowScanInfo(true); }
    else { document.getElementById(inputId)?.click(); }
  };

  const handleScan = async (e) => {
    const file = e.target.files?.[0]; if(!file) return;
    setScanning(true); setScanDone(false); setScanError(false);
    try {
      const { base64, mimeType } = await compressImage(file);
      const resp = await fetch("/api/claude",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({type:"scan",base64,mimeType})});
      const data = await resp.json();
      if(data.ingredients?.length) {
        setIngredients(prev=>{ const c=[...prev]; data.ingredients.forEach(f=>{if(!c.includes(f))c.push(f);}); return c; });
        setScanDone(true);
        setScanCount(p=>p+1);
      } else {
        setScanError(true);
      }
    } catch(err) {
      console.warn("Scan error:", err);
      setScanError(true);
    } finally {
      setScanning(false);
      e.target.value="";
    }
  };

  return (
    <>
      {showScanInfo&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.75)",display:"flex",alignItems:"flex-end",zIndex:200}} onClick={()=>setShowScanInfo(false)}>
          <div onClick={e=>e.stopPropagation()} style={{background:C.card,borderRadius:"24px 24px 0 0",padding:"28px 24px 48px",width:"100%",border:`1px solid ${C.cardBorder}`,maxWidth:430,margin:"0 auto"}}>
            <div style={{width:36,height:4,borderRadius:2,background:C.cardBorder,margin:"0 auto 20px"}}/>
            <p style={{fontSize:22,textAlign:"center",marginBottom:10}}>📸</p>
            <h3 style={{fontFamily:D,fontSize:20,fontWeight:700,marginBottom:10,textAlign:"center"}}>Kurzer Hinweis</h3>
            <p style={{color:C.textMuted,fontSize:14,lineHeight:1.7,marginBottom:16}}>Das Foto wird kurz an <strong style={{color:C.text}}>Anthropic</strong> (USA) übermittelt um die Zutaten zu erkennen. Es wird danach <strong style={{color:C.text}}>nicht gespeichert</strong>.</p>
            <p style={{color:C.textMuted,fontSize:14,lineHeight:1.7,marginBottom:24}}>Du kannst Zutaten jederzeit auch manuell eingeben.</p>
            <div style={{display:"flex",flexDirection:"column",gap:10}}>
              <button onClick={()=>{localStorage.setItem("mz_scan_consent","true");setShowScanInfo(false);setTimeout(()=>document.getElementById(pendingInputId||"scan-camera").click(),100);}} style={{width:"100%",padding:"15px",borderRadius:50,background:`linear-gradient(135deg,${C.accent},${C.accentDim})`,color:"#FFFFFF",fontWeight:700,fontSize:15,fontFamily:B}}>Verstanden, weiter</button>
              <button onClick={()=>setShowScanInfo(false)} style={{width:"100%",padding:"14px",borderRadius:50,background:"transparent",border:`1.5px solid ${C.cardBorder}`,color:C.textMuted,fontFamily:B}}>Abbrechen</button>
            </div>
          </div>
        </div>
      )}

      <input id="scan-camera" type="file" accept="image/*" capture="environment" onChange={handleScan} disabled={scanning} style={{display:"none"}}/>
      <input id="scan-gallery" type="file" accept="image/*" onChange={handleScan} disabled={scanning} style={{display:"none"}}/>

      {scanning&&<div style={{background:C.card,border:`1.5px solid ${C.cardBorder}`,borderRadius:16,padding:"14px 16px",marginBottom:12,display:"flex",alignItems:"center",gap:12}}><Spin size={18}/><p style={{color:C.accent,fontWeight:600,fontSize:14}}>KI analysiert Foto...</p></div>}
      {scanDone&&!scanning&&<div style={{background:C.greenGlow,border:`1px solid ${C.green}`,borderRadius:12,padding:"10px 14px",marginBottom:12,display:"flex",alignItems:"center",gap:8}}><span>✅</span><p style={{color:C.green,fontSize:13,fontWeight:500}}>Zutaten erkannt – du kannst weitere Fotos scannen.</p></div>}
      {scanError&&!scanning&&<div style={{background:C.dangerGlow,border:`1px solid ${C.danger}`,borderRadius:12,padding:"10px 14px",marginBottom:12}}><p style={{color:C.danger,fontSize:13}}>Scan fehlgeschlagen – nochmal versuchen oder manuell eingeben.</p></div>}

      {!scanning&&scanCount<MAX_SCANS&&(
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}>
          <button onClick={()=>triggerScan("scan-camera")} style={{padding:"12px 8px",borderRadius:14,background:`linear-gradient(135deg,rgba(44,110,73,0.10),rgba(30,77,52,0.05))`,border:`1.5px solid ${C.accentDim}`,display:"flex",flexDirection:"column",alignItems:"center",gap:5}}>
            <span style={{fontSize:22}}>📷</span><p style={{color:C.accent,fontWeight:600,fontSize:13}}>Kamera</p><p style={{color:C.textMuted,fontSize:11}}>Direkt fotografieren</p>
          </button>
          <button onClick={()=>triggerScan("scan-gallery")} style={{padding:"12px 8px",borderRadius:14,background:C.card,border:`1.5px solid ${C.cardBorder}`,display:"flex",flexDirection:"column",alignItems:"center",gap:5}}>
            <span style={{fontSize:22}}>🖼️</span><p style={{color:C.text,fontWeight:600,fontSize:13}}>Galerie</p><p style={{color:C.textMuted,fontSize:11}}>Foto auswählen</p>
          </button>
        </div>
      )}
      {!scanning&&<div style={{display:"flex",justifyContent:"space-between",marginBottom:12}}>
        <p style={{color:C.textDim,fontSize:11}}>Bis zu 3 Fotos – z.B. Kühlschrank + Vorratskammer</p>
        {scanCount>0&&<p style={{color:scanCount>=MAX_SCANS?C.danger:C.textMuted,fontSize:11,fontWeight:600,flexShrink:0}}>{scanCount}/{MAX_SCANS} genutzt</p>}
      </div>}

      <div style={{background:C.card,border:`1.5px solid ${C.cardBorder}`,borderRadius:16,padding:"4px 16px",display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
        <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={handleKey} placeholder="Zutat manuell eingeben..." style={{flex:1,fontSize:15,padding:"13px 0",fontFamily:B}}/>
        {input&&<button onClick={add} style={{background:C.accent,color:"#FFFFFF",borderRadius:8,padding:"5px 12px",fontWeight:700,fontSize:13}}>+</button>}
      </div>

      {ingredients.length>0&&(
        <div style={{marginBottom:10}}>
          <div style={{display:"flex",flexWrap:"wrap",gap:7,marginBottom:5}}>
            {ingredients.map(ing=>(
              <span key={ing} onClick={()=>handleIngredientTap(ing)} style={{display:"inline-flex",alignItems:"center",gap:5,background:mustUse.includes(ing)?"rgba(224,90,90,0.15)":C.accentGlow,border:`1px solid ${mustUse.includes(ing)?C.danger:C.accentDim}`,borderRadius:20,padding:"5px 11px",fontSize:13,color:mustUse.includes(ing)?C.danger:C.accent,fontWeight:500,cursor:"pointer",userSelect:"none",transition:"all 0.15s"}}>
                {mustUse.includes(ing)&&<span style={{fontSize:10}}>&#128308;</span>}{ing}
                <button onClick={e=>{e.stopPropagation();setIngredients(p=>p.filter(i=>i!==ing));setMustUse(p=>p.filter(x=>x!==ing));}} style={{color:mustUse.includes(ing)?C.danger:C.accentDim,fontSize:15,lineHeight:1}}>×</button>
              </span>
            ))}
          </div>
          {mustUse.length>0&&<p style={{color:C.danger,fontSize:11,fontWeight:500}}>&#128308; Diese Zutaten müssen zwingend im Rezept vorkommen</p>}
          {ingredients.length>0&&mustUse.length===0&&<p style={{color:C.textDim,fontSize:11}}>💡 Doppelt antippen = muss im Rezept vorkommen</p>}
        </div>
      )}

      <div style={{marginBottom:14}}>
        <SL>Schnellauswahl</SL>
        <div style={{display:"flex",flexWrap:"wrap",gap:7}}>
          {sortedSugg.filter(s=>!ingredients.includes(s)).slice(0,12).map(s=>(<button key={s} onClick={()=>setIngredients(p=>[...p,s])} style={{background:C.surface,border:`1px solid ${C.cardBorder}`,borderRadius:20,padding:"6px 13px",color:C.textMuted,fontSize:13,fontFamily:B}}>{s}</button>))}
        </div>
      </div>

      {ingredients.length>0&&(
        <button onClick={()=>setNoShopping(p=>!p)} style={{display:"flex",alignItems:"center",gap:12,padding:"12px 14px",borderRadius:14,background:noShopping?C.greenGlow:C.card,border:`1.5px solid ${noShopping?C.green:C.cardBorder}`,width:"100%",fontFamily:B,marginBottom:14,transition:"all 0.2s"}}>
          <span style={{fontSize:20}}>{noShopping?"🏠":"🛒"}</span>
          <div style={{textAlign:"left",flex:1}}>
            <p style={{fontWeight:600,fontSize:14,color:noShopping?C.green:C.text,marginBottom:1}}>{noShopping?"Nur Vorrat nutzen":"Einkaufen ist ok"}</p>
            <p style={{fontSize:12,color:C.textMuted}}>{noShopping?"Nur vorhandene Zutaten verwenden":"Eine Zutat darf auch zugekauft werden"}</p>
          </div>
          <div style={{width:22,height:22,borderRadius:11,background:noShopping?C.green:C.surface,border:`1.5px solid ${noShopping?C.green:C.cardBorder}`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
            {noShopping&&<span style={{color:"#fff",fontSize:12}}>✓</span>}
          </div>
        </button>
      )}

      <div style={{flex:1}}/>
      <div style={{display:"flex",flexDirection:"column",gap:10}}>
        <BigBtn label="Weiter →" onClick={()=>onNext(ingredients,mustUse,noShopping)} disabled={ingredients.length===0}/>
        <BigBtn label="Ohne Zutaten entdecken" onClick={()=>onSkip([],false)} secondary/>
      </div>
    </>
  );
}

export default function IngredientsPage({ onNext, onSkip, onBack }) {
  return (
    <div style={{ minHeight:"100vh", background:C.bg, padding:"56px 24px 32px", display:"flex", flexDirection:"column" }}>
      {onBack&&<BackBtn onClick={onBack}/>}
      <PBar step={1} total={2}/>
      <div style={{marginBottom:18}}>
        <h2 style={{fontFamily:D,fontSize:28,fontWeight:700,lineHeight:1.2,marginBottom:4,color:C.text}}>Was hast du im Kühlschrank?</h2>
        <p style={{color:C.textMuted,fontSize:14}}>Foto scannen, eintippen oder überspringen.</p>
      </div>
      <IngredientsScreen onNext={onNext} onSkip={onSkip}/>
    </div>
  );
}
