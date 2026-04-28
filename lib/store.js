// Fix #13: bump() now uses load/save instead of accessing localStorage directly
export const store = {
  profiles: {
    save: (p) => { try { localStorage.setItem("mz_profiles", JSON.stringify(p)); } catch(e) {} },
    load: () => { try { return JSON.parse(localStorage.getItem("mz_profiles") || "[]"); } catch(e) { return []; } },
  },
  recipes: {
    save: (pid, r) => { try { localStorage.setItem("mz_recipes_" + (pid||"global"), JSON.stringify(r)); } catch(e) {} },
    load: (pid) => { try { return JSON.parse(localStorage.getItem("mz_recipes_" + (pid||"global")) || "[]"); } catch(e) { return []; } },
  },
  week: {
    save: (pid, w) => { try { localStorage.setItem("mz_week_" + (pid||"global"), JSON.stringify(w)); } catch(e) {} },
    load: (pid) => { try { return JSON.parse(localStorage.getItem("mz_week_" + (pid||"global")) || "null"); } catch(e) { return null; } },
  },
  lastSession: {
    save: (s) => { try { localStorage.setItem("mz_last_session", JSON.stringify(s)); } catch(e) {} },
    load: () => { try { return JSON.parse(localStorage.getItem("mz_last_session") || "null"); } catch(e) { return null; } },
  },
  ingFreq: {
    save: (f) => { try { localStorage.setItem("mz_ing_freq", JSON.stringify(f)); } catch(e) {} },
    load: () => { try { return JSON.parse(localStorage.getItem("mz_ing_freq") || "{}"); } catch(e) { return {}; } },
    bump: (ings) => {
      const freq = store.ingFreq.load();
      ings.forEach(i => { freq[i] = (freq[i] || 0) + 1; });
      store.ingFreq.save(freq);
    },
  },
};

const personsKey = (pid) => "mz_persons_" + (pid||"global");
export const savePersons = (pid, n) => { try { localStorage.setItem(personsKey(pid), String(n)); } catch(e) {} };
export const loadPersons = (pid) => { try { const v = localStorage.getItem(personsKey(pid)); return v ? parseInt(v) : 2; } catch(e) { return 2; } };
