import { useState, useEffect, useCallback } from "react";
import Head from "next/head";
import { store } from "../lib/store";
import { C, D, B } from "../components/design";
import SplashScreen from "../components/SplashScreen";
import ProfileManager from "../components/ProfileManager";
import IngredientsPage from "../components/IngredientsScreen";
import PreferencesScreen from "../components/PreferencesScreen";
import LoadingScreen from "../components/LoadingScreen";
import RecipeScreen from "../components/RecipeScreen";
import RatingModal from "../components/RatingModal";
import SavedRecipesScreen from "../components/SavedRecipesScreen";
import WeekPlanner from "../components/WeekPlanner";

export default function Mahlzeit() {
  const [screen, setScreen] = useState("splash");
  const [profiles, setProfiles] = useState([]);
  const [activeProfile, setActiveProfile] = useState(null);
  const [ingredients, setIngredients] = useState([]);
  const [mustUse, setMustUse] = useState([]);
  const [noShopping, setNoShopping] = useState(false);
  const [prefs, setPrefs] = useState(null);
  const [recipe, setRecipe] = useState(null);
  const [streamText, setStreamText] = useState("");
  const [rejectedRecipes, setRejectedRecipes] = useState([]);
  const [viewingRecipe, setViewingRecipe] = useState(null);
  const [savedProfile, setSavedProfile] = useState(null);
  const [showRating, setShowRating] = useState(false);
  const [lastSession, setLastSession] = useState(null);

  useEffect(()=>{ setProfiles(store.profiles.load()); setLastSession(store.lastSession.load()); }, []);

  const saveProfiles = (u) => { setProfiles(u); store.profiles.save(u); };

  const callAPI = useCallback(async (finalPrefs, nope=null) => {
    setScreen("loading");
    const restr = [...(activeProfile?.diet||[]),...(activeProfile?.custom||[])];
    const loved = store.recipes.load(activeProfile?.id).filter(r=>r.status==="loved").slice(0,8).map(r=>r.name);
    const lastRecipe = nope && recipe ? recipe.name : null;
    if(nope && recipe) setRejectedRecipes(prev=>[...new Set([...prev, recipe.name])]);
    setStreamText("");

    try {
      const allAvoided = [...rejectedRecipes,...(lastRecipe?[lastRecipe]:[])];
      const streamParams = {
        ingredients, time:finalPrefs.time, mood:finalPrefs.mood, portion:finalPrefs.portion,
        intolerances:restr, disliked:finalPrefs.disliked||[], nope,
        lovedRecipes:loved, avoidName:lastRecipe, avoidNames:allAvoided,
        preferredCuisines:activeProfile?.cuisines||[], availability:activeProfile?.availability||"supermarkt",
        devices:finalPrefs.devices||[], mustUse:mustUse||[], noShopping,
      };

      const resp = await fetch("/api/stream",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(streamParams)});
      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let fullText = ""; let buf = "";

      while(true) {
        const {done,value} = await reader.read(); if(done) break;
        buf += decoder.decode(value,{stream:true});
        const lines = buf.split("\n"); buf = lines.pop()||"";
        for(const line of lines) {
          if(line.startsWith("data: ")) {
            try {
              const d = JSON.parse(line.slice(6));
              if(d.text){ fullText+=d.text; setStreamText(fullText); }
            } catch(e) {
              console.warn("Stream parse error:", e);
            }
          }
          if(line.startsWith("event: error")) throw new Error("Stream error");
        }
      }

      if(!fullText.trim()){ setScreen("streamError"); return; }

      try {
        const cleaned = fullText.replace(/```json|```/g,"").trim();
        const r = JSON.parse(cleaned);
        setRecipe(r); setScreen("recipe");
        store.lastSession.save({time:finalPrefs.time,mood:finalPrefs.mood,portion:finalPrefs.portion,devices:finalPrefs.devices||[]});
        setLastSession({time:finalPrefs.time,mood:finalPrefs.mood,portion:finalPrefs.portion});
        if(ingredients.length>0) store.ingFreq.bump(ingredients);
      } catch(parseErr) {
        console.warn("JSON parse error:", parseErr);
        try {
          const match = fullText.match(/\{[\s\S]*"name"[\s\S]*"steps"[\s\S]*\]/);
          if(match){ const r=JSON.parse(match[0]+',"tip":"Guten Appetit!"}'); setRecipe(r); setScreen("recipe"); }
          else setScreen("streamError");
        } catch(e) { setScreen("streamError"); }
      }
    } catch(err) {
      console.error("Stream error:", err.message);
      setScreen("streamError");
    }
  }, [activeProfile, ingredients, mustUse, noShopping, recipe, rejectedRecipes]);

  const handleRate = () => setShowRating(true);

  const handleRateDone = () => {
    setShowRating(false);
    setRecipe(null); setIngredients([]); setMustUse([]); setNoShopping(false);
    setRejectedRecipes([]); setStreamText("");
    setScreen("splash");
  };

  const resetToSplash = () => {
    setRecipe(null); setIngredients([]); setMustUse([]); setNoShopping(false);
    setRejectedRecipes([]); setStreamText("");
    setScreen("splash");
  };

  return (
    <>
      <Head>
        <title>Mahlzeit</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1"/>
        <meta name="theme-color" content="#2C6E49"/>
        <link rel="manifest" href="/manifest.json"/>
        <meta name="apple-mobile-web-app-capable" content="yes"/>
        <link rel="preconnect" href="https://fonts.googleapis.com"/>
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous"/>
        <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet"/>
        <style>{`
          * { margin:0; padding:0; box-sizing:border-box; -webkit-tap-highlight-color:transparent; }
          body { background:#FEFCF7; color:#1C1410; font-family:'DM Sans',sans-serif; }
          input, button, textarea { background:none; border:none; outline:none; color:inherit; cursor:pointer; }
          h1,h2,h3,h4 { color:#1C1410; }
          @keyframes spin { to { transform:rotate(360deg); } }
          @keyframes bounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
          @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
          @keyframes fadeUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
          @keyframes slideUp { from{transform:translateY(100%)} to{transform:translateY(0)} }
        `}</style>
      </Head>
      <div style={{maxWidth:430,margin:"0 auto",minHeight:"100vh",background:C.bg,overflowX:"hidden"}}>

        {screen==="splash"&&(
          <SplashScreen
            profiles={profiles} lastSession={lastSession}
            onStart={(p)=>{ setActiveProfile(p); setScreen("ingredients"); }}
            onQuickStart={(p,session)=>{ setActiveProfile(p); setPrefs(session); setScreen("ingredients"); }}
            onManageProfiles={()=>setScreen("profiles")}
            onViewSaved={(p)=>{ setSavedProfile(p); setScreen("saved"); }}
            onWeekPlanner={(p)=>{ setActiveProfile(p); setScreen("week"); }}
          />
        )}

        {screen==="profiles"&&(
          <ProfileManager profiles={profiles} onSave={saveProfiles} onBack={()=>setScreen("splash")}/>
        )}

        {screen==="ingredients"&&(
          <IngredientsPage
            onBack={()=>setScreen("splash")}
            onNext={(ings,must,noShop)=>{ setIngredients(ings); setMustUse(must||[]); setNoShopping(noShop||false); setScreen("preferences"); }}
            onSkip={()=>{ setIngredients([]); setMustUse([]); setNoShopping(false); setScreen("preferences"); }}
          />
        )}

        {screen==="preferences"&&(
          <PreferencesScreen
            profile={activeProfile} defaultPrefs={prefs}
            onGenerate={p=>{ setPrefs(p); callAPI(p); }}
            onBack={()=>setScreen("ingredients")}
          />
        )}

        {screen==="loading"&&<LoadingScreen streamText={streamText}/>}

        {screen==="recipe"&&(
          <RecipeScreen
            recipe={recipe} profile={activeProfile} disliked={prefs?.disliked||[]}
            onNope={r=>callAPI(prefs,r)}
            onBack={()=>setScreen("preferences")}
            onRestart={resetToSplash}
            onViewSaved={()=>{ setSavedProfile(activeProfile); setScreen("saved"); }}
            onRate={handleRate}
          />
        )}

        {screen==="streamError"&&(
          <div style={{minHeight:"100vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:32,textAlign:"center",background:C.bg}}>
            <span style={{fontSize:48,marginBottom:20}}>😕</span>
            <h2 style={{fontFamily:D,fontSize:24,fontWeight:700,marginBottom:10}}>Etwas ist schiefgelaufen</h2>
            <p style={{color:"#5C5048",fontSize:14,lineHeight:1.6,marginBottom:28,maxWidth:280}}>Das Rezept konnte nicht geladen werden – meistens liegt das an einer instabilen Verbindung.</p>
            <button onClick={()=>{ setStreamText(""); callAPI(prefs); }} style={{background:`linear-gradient(135deg,${C.accent},${C.accentDim})`,color:"#FFFFFF",fontWeight:700,fontSize:15,padding:"15px 40px",borderRadius:50,fontFamily:B,marginBottom:12}}>🔄 Nochmal versuchen</button>
            <button onClick={()=>{ setStreamText(""); setScreen("preferences"); }} style={{color:"#5C5048",fontSize:14,padding:"10px",fontFamily:B}}>← Einstellungen ändern</button>
          </div>
        )}

        {screen==="saved"&&(
          <SavedRecipesScreen
            profile={savedProfile} profiles={profiles}
            onBack={()=>setScreen(recipe?"recipe":"splash")}
            onOpen={(r)=>{ setViewingRecipe(r); setScreen("viewRecipe"); }}
          />
        )}

        {screen==="viewRecipe"&&viewingRecipe&&(
          <RecipeScreen
            recipe={viewingRecipe} profile={activeProfile} disliked={[]}
            onNope={()=>setScreen("saved")} onBack={()=>setScreen("saved")}
            onRestart={()=>{ setViewingRecipe(null); setScreen("splash"); }}
            onViewSaved={()=>setScreen("saved")} onRate={()=>setScreen("saved")}
          />
        )}

        {screen==="week"&&(
          <WeekPlanner profile={activeProfile} onBack={()=>setScreen("splash")}/>
        )}

      </div>
      {showRating&&recipe&&(
        <RatingModal recipe={recipe} profile={activeProfile} onDone={handleRateDone}/>
      )}
    </>
  );
}
