(() => {
  "use strict";
  const $ = (id) => document.getElementById(id);
  const config = window.PR7_CONFIG || {};
  const isConfigured = Boolean(config.supabaseUrl && config.supabaseAnonKey && window.supabase);
  let supabaseClient = null, currentUser = null, activeCategory = "All", toastTimer;
  if (isConfigured) supabaseClient = window.supabase.createClient(config.supabaseUrl, config.supabaseAnonKey);

  const starterPrompts = [
    {id:"starter-1",title:"Midnight Cinematic Portrait",category:"Boy Portrait",tag:"Cinematic photo",credit:"Illustrative placeholder artwork",image_url:"",prompt:"Create an ultra-realistic cinematic portrait of a young Indian man wearing a black outfit, dramatic red and blue rim lighting, natural skin texture, DSLR photography, shallow depth of field, detailed hair, premium editorial mood, high contrast, vertical 9:16 composition."},
    {id:"starter-2",title:"Luxury Black Fashion",category:"Fashion",tag:"Fashion editorial",credit:"",image_url:"",prompt:"Create a premium fashion editorial portrait of a stylish young adult wearing a tailored black outfit and subtle accessories, confident pose, dark luxury studio, soft key light with a cool edge light, realistic fabric texture, 85mm lens look, shallow depth of field, photorealistic."},
    {id:"starter-3",title:"Golden Hour Couple",category:"Couple",tag:"Romantic portrait",credit:"",image_url:"",prompt:"Create a natural cinematic outdoor portrait of an adult couple standing close together with warm genuine smiles, soft golden-hour sunlight, lush green background, realistic skin texture, DSLR photography, creamy bokeh, candid lifestyle photography, vertical 4:5 composition."},
    {id:"starter-4",title:"Rainy City Film Still",category:"Cinematic",tag:"Movie still",credit:"",image_url:"",prompt:"Create a photorealistic cinematic film still of an adult protagonist standing on a rain-soaked city street at night, reflections on wet pavement, moody neon lighting, atmospheric mist, dramatic composition, realistic details, anamorphic lens feel, 16:9 widescreen frame."},
    {id:"starter-5",title:"Editorial Portrait of a Woman",category:"Fashion",tag:"Beauty editorial",credit:"",image_url:"",prompt:"Create a tasteful high-fashion editorial portrait of an adult woman in a modern elegant outfit, expressive eyes, natural skin texture, soft studio light, subtle shadows, premium magazine photography, 85mm lens look, detailed but realistic, neutral background."},
    {id:"starter-6",title:"Epic Fantasy Establishing Shot",category:"AI Video",tag:"AI video concept",credit:"",image_url:"",prompt:"A cinematic wide establishing shot of a lone traveler approaching an ancient monumental city at dusk, drifting atmospheric fog, moving clouds, warm practical lights, slow forward camera push, realistic materials, epic scale, coherent motion, 16:9 frame, no text or watermark."}
  ];
  let prompts = [...starterPrompts];
  const localKey = "pr7-ai-prompts-demo-v1";

  function showToast(message) {
    const toast = $("toast"); toast.textContent = message; toast.classList.add("show");
    clearTimeout(toastTimer); toastTimer = setTimeout(() => toast.classList.remove("show"), 2500);
  }
  function escapeHtml(value="") {
    return String(value).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  }
  function categoryGlyph(category) {
    return ({"Boy Portrait":"P7","Girl Portrait":"✧","Couple":"♡","Fashion":"✦","Cinematic":"▣","AI Video":"▷","Nature":"❋"}[category] || "✦");
  }
  function render() {
    const query = $("searchInput").value.trim().toLowerCase();
    const filtered = prompts.filter(p => (activeCategory === "All" || p.category === activeCategory) &&
      [p.title,p.category,p.tag,p.prompt].join(" ").toLowerCase().includes(query));
    $("promptCount").textContent = String(prompts.length).padStart(2,"0");
    $("promptGrid").innerHTML = filtered.map(p => {
      const image = p.image_url && /^https:\/\/|^http:\/\//i.test(p.image_url)
        ? `<img src="${escapeHtml(p.image_url)}" alt="${escapeHtml(p.title)}" loading="lazy" onerror="this.parentElement.classList.add('placeholder');this.remove()">`
        : `<div class="placeholder-art" aria-hidden="true">${escapeHtml(categoryGlyph(p.category))}</div>`;
      return `<article class="prompt-card">
        <div class="prompt-image ${p.image_url ? "" : "placeholder"}">${image}<span class="prompt-label">${escapeHtml(p.category)}</span></div>
        <div class="prompt-body"><div class="prompt-meta">${escapeHtml(p.tag || "AI PROMPT")}</div>
        <h3>${escapeHtml(p.title)}</h3><p class="prompt-excerpt">${escapeHtml(p.prompt)}</p>
        <div class="prompt-footer"><span class="prompt-tag">${escapeHtml(p.credit || "PR7 PROMPT LIBRARY")}</span><button class="copy-button" data-copy="${escapeHtml(p.id)}">Copy prompt ↗</button></div></div></article>`;
    }).join("");
    $("emptyState").classList.toggle("hidden", filtered.length !== 0);
    $("promptGrid").classList.toggle("hidden", filtered.length === 0);
    $("promptGrid").querySelectorAll("[data-copy]").forEach(btn => btn.addEventListener("click", () => copyPrompt(btn.dataset.copy)));
  }
  $("promptGrid").querySelectorAll(".prompt-image").forEach(box => {
  const img = box.querySelector("img");
  if (!img) return;

  box.style.cursor = "zoom-in";

  box.addEventListener("click", () => {
    window.open(img.src, "_blank", "noopener,noreferrer");
  });
});
  async function copyPrompt(id) {
    const p = prompts.find(x => String(x.id) === String(id)); if (!p) return;
    try {
      await navigator.clipboard.writeText(p.prompt);
      showToast("Prompt copied — ready to create!");
    } catch (_) {
      const ta = document.createElement("textarea"); ta.value = p.prompt; document.body.appendChild(ta); ta.select();
      const ok = document.execCommand("copy"); ta.remove(); showToast(ok ? "Prompt copied — ready to create!" : "Copy failed. Please select the prompt text.");
    }
  }
  function setStatus(text, kind="") { $("adminStatus").textContent = text; $("adminStatus").className = "status-box " + kind; }
  function loadDemoData() {
    try {
      const saved = JSON.parse(localStorage.getItem(localKey) || "null");
      if (Array.isArray(saved)) prompts = [...saved, ...starterPrompts.filter(s => !saved.some(p => p.id === s.id))];
    } catch (_) {}
  }
  async function fetchPrompts() {
    if (!isConfigured) { loadDemoData(); render(); return; }
    const {data,error} = await supabaseClient.from("prompts").select("*").order("created_at",{ascending:false});
    if (error) { console.error(error); showToast("Could not load cloud prompts. Check Supabase setup."); return; }
    prompts = [...(data || []), ...starterPrompts.filter(s => !(data || []).some(p => p.id === s.id))];
    render();
  }
  function openAdmin() {
    $("adminDialog").showModal();
    $("loginForm").classList.remove("hidden"); $("adminPanel").classList.add("hidden");
    if (!isConfigured) {
      setStatus("Preview mode: no Supabase project is connected. Demo changes are saved only in this browser and are NOT a secure admin system.", "warning");
    } else if (currentUser) {
      showAdminPanel();
    } else {
      setStatus("Secure cloud mode is configured. Sign in with an admin user created in Supabase Auth.", "success");
    }
  }
  function showAdminPanel() {
    $("loginForm").classList.add("hidden"); $("adminPanel").classList.remove("hidden");
    setStatus(isConfigured ? `Signed in as ${currentUser?.email || "admin"}. Cloud changes are protected by database policies.` : "Demo mode only — local browser storage, not secure for public admin use.", isConfigured ? "success" : "warning");
    renderAdminList();
  }
  function renderAdminList() {
    $("adminPromptList").innerHTML = prompts.map(p => `<div class="admin-item"><div><strong>${escapeHtml(p.title)}</strong><small>${escapeHtml(p.category)}</small></div><button data-edit="${escapeHtml(p.id)}">Edit</button><button data-delete="${escapeHtml(p.id)}">Delete</button></div>`).join("");
    $("adminPromptList").querySelectorAll("[data-edit]").forEach(b => b.addEventListener("click", () => startEdit(b.dataset.edit)));
    $("adminPromptList").querySelectorAll("[data-delete]").forEach(b => b.addEventListener("click", () => deletePrompt(b.dataset.delete)));
  }
  function startEdit(id) {
    const p = prompts.find(x => String(x.id) === String(id)); if (!p) return;
    $("editId").value = p.id; $("promptTitle").value = p.title; $("promptCategory").value = p.category;
    $("promptImage").value = p.image_url || ""; $("promptText").value = p.prompt; $("promptTag").value = p.tag || ""; $("promptCredit").value = p.credit || "";
    $("savePromptButton").textContent = "Save changes"; $("cancelEditButton").classList.remove("hidden");
    $("promptForm").scrollIntoView({behavior:"smooth",block:"start"});
  }
  function resetPromptForm() {
    $("promptForm").reset(); $("editId").value = ""; $("savePromptButton").textContent = "Publish prompt"; $("cancelEditButton").classList.add("hidden");
  }
  async function savePrompt(event) {
    event.preventDefault();
    const editId = $("editId").value;
    const payload = {title:$("promptTitle").value.trim(),category:$("promptCategory").value,image_url:$("promptImage").value.trim(),prompt:$("promptText").value.trim(),tag:$("promptTag").value.trim(),credit:$("promptCredit").value.trim()};
    if (!payload.title || !payload.prompt) return;
    if (isConfigured) {
      if (!currentUser) { showToast("Please sign in first."); return; }
      let result;
      if (editId && !String(editId).startsWith("starter-")) result = await supabaseClient.from("prompts").update(payload).eq("id",editId).select().single();
      else result = await supabaseClient.from("prompts").insert(payload).select().single();
      if (result.error) { console.error(result.error); showToast("Save failed. Check admin permissions and database setup."); return; }
      await fetchPrompts(); showToast("Prompt published to the cloud.");
    } else {
      const id = editId || "local-" + Date.now();
      const next = {...payload,id};
      const without = prompts.filter(p => String(p.id) !== String(id) && !(editId && String(p.id) === String(editId)));
      prompts = [next,...without];
      const userEntries = prompts.filter(p => !String(p.id).startsWith("starter-"));
      try { localStorage.setItem(localKey, JSON.stringify(userEntries)); } catch (_) {}
      render(); renderAdminList(); showToast("Saved in this browser only (demo mode).");
    }
    resetPromptForm(); renderAdminList();
  }
  async function deletePrompt(id) {
    const p = prompts.find(x => String(x.id) === String(id)); if (!p) return;
    if (!confirm(`Delete "${p.title}"?`)) return;
    if (isConfigured) {
      if (!currentUser) return showToast("Please sign in first.");
      if (String(id).startsWith("starter-")) return showToast("Starter examples are built into the website.");
      const {error} = await supabaseClient.from("prompts").delete().eq("id",id);
      if (error) { console.error(error); return showToast("Delete failed. Check admin permissions."); }
      await fetchPrompts(); showToast("Prompt deleted.");
    } else {
      prompts = prompts.filter(x => String(x.id) !== String(id));
      try { localStorage.setItem(localKey, JSON.stringify(prompts.filter(x => !String(x.id).startsWith("starter-")))); } catch (_) {}
      render(); renderAdminList(); showToast("Deleted from this browser demo.");
    }
  }
  async function handleLogin(event) {
    event.preventDefault();
    if (!isConfigured) {
      // Clearly limited preview: demo access is intentionally not represented as secure authentication.
      currentUser = {email:"local demo"};
      showAdminPanel(); showToast("Demo dashboard opened. Not secure for a public website.");
      return;
    }
    const {data,error} = await supabaseClient.auth.signInWithPassword({email:$("adminEmail").value.trim(),password:$("adminPassword").value});
    if (error) { setStatus("Sign-in failed. Check email/password and Supabase Auth settings.", "warning"); return; }
    currentUser = data.user; showAdminPanel(); await fetchPrompts();
  }
  async function logout() {
    if (isConfigured) await supabaseClient.auth.signOut();
    currentUser = null; $("adminPanel").classList.add("hidden"); $("loginForm").classList.remove("hidden");
    setStatus(isConfigured ? "Signed out. Sign in with your admin account." : "Preview mode: local changes are saved only in this browser.", isConfigured ? "" : "warning");
  }
  $("adminOpen").addEventListener("click",openAdmin);
  $("adminClose").addEventListener("click",()=>$("adminDialog").close());
  $("searchInput").addEventListener("input",render);
  $("categoryList").querySelectorAll("[data-category]").forEach(btn => btn.addEventListener("click",() => {
    activeCategory = btn.dataset.category;
    $("categoryList").querySelectorAll(".category-chip").forEach(x => x.classList.toggle("active",x === btn)); render();
  }));
  $("loginForm").addEventListener("submit",handleLogin);
  $("promptForm").addEventListener("submit",savePrompt);
  $("cancelEditButton").addEventListener("click",resetPromptForm);
  $("logoutButton").addEventListener("click",logout);
  $("year").textContent = new Date().getFullYear();
  if (isConfigured) {
    supabaseClient.auth.getSession().then(({data}) => { currentUser = data.session?.user || null; });
    supabaseClient.auth.onAuthStateChange((_event,session) => { currentUser = session?.user || null; });
  }
  fetchPrompts();
})();
