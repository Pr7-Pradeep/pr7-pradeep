(() => {
  "use strict";
  const $ = id => document.getElementById(id);
  const safeText = value => String(value || "").trim();
  const setText = (id, value) => { const el=$(id); if(el) el.textContent=value; };
  // Tool tabs
  document.querySelectorAll("[data-tool]").forEach(btn => btn.addEventListener("click", () => {
    const selected = btn.dataset.tool;
    document.querySelectorAll("[data-tool]").forEach(b=>b.classList.toggle("active",b.dataset.tool===selected));
    ["photo","translate","resume","calc"].forEach(key=>$("tool-"+key).classList.toggle("hidden",key!==selected));
    const section = $("tools");
    if (btn.classList.contains("launcher-tool") && section) section.scrollIntoView({behavior:"smooth",block:"start"});
  }));
  // Photo resize/compress, fully client-side
  let chosenPhotos=[], processedPhotos=[];
  const fileInput=$("photoFiles");
  fileInput?.addEventListener("change",()=>{
    chosenPhotos=Array.from(fileInput.files||[]).filter(f=>f.type.startsWith("image/")).slice(0,10); processedPhotos=[]; $("photoResults").innerHTML=""; $("downloadZip").disabled=true;
    setText("photoStatus",chosenPhotos.length ? `${chosenPhotos.length} image(s) selected${fileInput.files.length>10?". Only the first 10 will be used.":"."}` : "Please select image files.");
  });
  $("photoQuality")?.addEventListener("input",e=>setText("qualityLabel",e.target.value+"%"));
  function canvasBlob(canvas,type,quality){return new Promise((resolve,reject)=>canvas.toBlob(blob=>blob?resolve(blob):reject(new Error("Could not encode image")),type,quality));}
  $("processPhotos")?.addEventListener("click",async()=>{
    if(!chosenPhotos.length){setText("photoStatus","Please choose up to 10 photos first.");return;}
    const maxWidth=Math.max(100,Math.min(8000,Number($("photoWidth").value)||1600)); const quality=Number($("photoQuality").value)/100; const type=$("photoFormat").value;
    const resultBox=$("photoResults"); resultBox.innerHTML=""; processedPhotos=[]; $("downloadZip").disabled=true; setText("photoStatus","Processing images in your browser…");
    for(let i=0;i<chosenPhotos.length;i++){
      const file=chosenPhotos[i];
      try{
        const img=await createImageBitmap(file); const scale=Math.min(1,maxWidth/img.width); const canvas=document.createElement("canvas"); canvas.width=Math.max(1,Math.round(img.width*scale)); canvas.height=Math.max(1,Math.round(img.height*scale));
        const ctx=canvas.getContext("2d"); if(type==="image/jpeg"){ctx.fillStyle="#fff";ctx.fillRect(0,0,canvas.width,canvas.height);} ctx.drawImage(img,0,0,canvas.width,canvas.height); img.close?.();
        const blob=await canvasBlob(canvas,type,quality); const ext=type==="image/png"?"png":type==="image/webp"?"webp":"jpg"; const name=(file.name.replace(/\.[^.]+$/,"" )||`photo-${i+1}`)+`-pr7.${ext}`; const url=URL.createObjectURL(blob); processedPhotos.push({blob,name,url});
        const card=document.createElement("div"); card.className="photo-result"; const preview=document.createElement("img"); preview.src=url; preview.alt=name; const info=document.createElement("p"); info.textContent=`${file.name}\n${file.size>=1048576?(file.size/1048576).toFixed(2)+" MB":(file.size/1024).toFixed(1)+" KB"} → ${blob.size>=1048576?(blob.size/1048576).toFixed(2)+" MB":(blob.size/1024).toFixed(1)+" KB"}\n${canvas.width} × ${canvas.height}`; const link=document.createElement("a"); link.href=url;link.download=name;link.textContent="Download image";card.append(preview,info,link);resultBox.append(card);
      }catch(err){console.error(err);setText("photoStatus",`Could not process ${file.name}. Try another image.`);}
    }
    setText("photoStatus",`${processedPhotos.length} of ${chosenPhotos.length} image(s) processed. Original files are not uploaded.`); $("downloadZip").disabled=!(processedPhotos.length&&window.JSZip);
  });
  $("downloadZip")?.addEventListener("click",async()=>{if(!window.JSZip||!processedPhotos.length)return;const btn=$("downloadZip");btn.disabled=true;try{const zip=new JSZip();processedPhotos.forEach(p=>zip.file(p.name,p.blob));const blob=await zip.generateAsync({type:"blob"});const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download="pr7-resized-photos.zip";a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}catch(e){setText("photoStatus","ZIP creation failed. Download images individually instead.");}finally{btn.disabled=false;}});
  // Translator (external service; language coverage depends on provider)
  const languages={ar:"Arabic",bn:"Bengali",zh:"Chinese",nl:"Dutch",en:"English",fr:"French",de:"German",gu:"Gujarati",hi:"Hindi",id:"Indonesian",it:"Italian",ja:"Japanese",kn:"Kannada",ko:"Korean",ml:"Malayalam",mr:"Marathi",ne:"Nepali",pa:"Punjabi",fa:"Persian",pl:"Polish",pt:"Portuguese",ru:"Russian",es:"Spanish",ta:"Tamil",te:"Telugu",th:"Thai",tr:"Turkish",uk:"Ukrainian",ur:"Urdu",vi:"Vietnamese"};
  Object.entries(languages).forEach(([code,name])=>{const a=document.createElement("option");a.value=code;a.textContent=name;$("translateFrom").append(a);const b=a.cloneNode(true);$("translateTo").append(b);}); $("translateFrom").value="autodetect";$("translateTo").value="hi";
  $("translateInput")?.addEventListener("input",e=>setText("translateCount",`${e.target.value.length} / 5000`));
  $("swapLanguages")?.addEventListener("click",()=>{const from=$("translateFrom"),to=$("translateTo"),old=from.value; if(old==="autodetect")return;from.value=to.value;to.value=old;const inp=$("translateInput");inp.value=$("translateOutput").value;$("translateOutput").value="";setText("translateCount",`${inp.value.length} / 5000`);});
  $("translateButton")?.addEventListener("click",async()=>{const q=safeText($("translateInput").value),from=$("translateFrom").value,to=$("translateTo").value; if(!q){setText("translateCount","Enter text to translate first.");return;} if(q.length>5000)return;const btn=$("translateButton");btn.disabled=true;btn.textContent="Translating…";$("translateOutput").value="";try{const url=new URL("https://api.mymemory.translated.net/get");url.searchParams.set("q",q);url.searchParams.set("langpair",`${from==="autodetect"?"autodetect":from}|${to}`);const res=await fetch(url);if(!res.ok)throw new Error("Translation service unavailable");const data=await res.json();if(data.responseStatus!==200)throw new Error(data.responseDetails||"Translation service could not complete this request.");$("translateOutput").value=data.responseData?.translatedText||"No translation returned.";}catch(e){$("translateOutput").value="Translation could not be completed. Please try again later or use another translation service.";console.error(e);}finally{btn.disabled=false;btn.textContent="Translate";}});
  $("copyTranslation")?.addEventListener("click",async()=>{const val=$("translateOutput").value;if(!val)return;try{await navigator.clipboard.writeText(val);setText("translateCount","Translation copied.");}catch{setText("translateCount","Please select and copy the translation manually.");}});
  // Resume live preview
  const resumeFields={resumeName:"previewName",resumeRole:"previewRole",resumeSummary:"previewSummary",resumeSkills:"previewSkills",resumeExperience:"previewExperience",resumeEducation:"previewEducation"};
  Object.entries(resumeFields).forEach(([inputId,previewId])=>$(inputId)?.addEventListener("input",()=>{setText(previewId,safeText($(inputId).value)||({previewSummary:"Add a short summary about your experience and career goals.",previewSkills:"Your skills will appear here.",previewExperience:"Your experience will appear here.",previewEducation:"Your education will appear here."}[previewId]||""));}));
  ["resumeEmail","resumePhone","resumeLocation"].forEach(id=>$(id)?.addEventListener("input",()=>setText("previewContact",["resumeEmail","resumePhone","resumeLocation"].map(k=>safeText($(k).value)).filter(Boolean).join("  •  "))));
  $("printResume")?.addEventListener("click",()=>window.print());
  // Calculators
  const fmt=n=>Number(n).toLocaleString(undefined,{maximumFractionDigits:4});
  $("ageCalc")?.addEventListener("click",()=>{const v=$("birthDate").value;if(!v){setText("ageResult","Choose your date of birth.");return;}const dob=new Date(v+"T00:00:00"),today=new Date();if(dob>today){setText("ageResult","Date of birth cannot be in the future.");return;}let y=today.getFullYear()-dob.getFullYear(),m=today.getMonth()-dob.getMonth(),d=today.getDate()-dob.getDate();if(d<0){m--;d+=new Date(today.getFullYear(),today.getMonth(),0).getDate();}if(m<0){y--;m+=12;}setText("ageResult",`${y} years, ${m} months, ${d} days`);});
  $("percentCalc")?.addEventListener("click",()=>{const p=Number($("percentValue").value),n=Number($("percentBase").value);setText("percentResult",$("percentValue").value===""||$("percentBase").value===""?"Enter both values.":`${p}% of ${fmt(n)} = ${fmt(n*p/100)}`);});
  $("dateCalc")?.addEventListener("click",()=>{const a=$("dateStart").value,b=$("dateEnd").value;if(!a||!b){setText("dateResult","Choose both dates.");return;}const days=Math.round(Math.abs(new Date(a+"T00:00:00")-new Date(b+"T00:00:00"))/86400000);setText("dateResult",`${fmt(days)} day(s) between dates.`);});
  const factors={mm:["length",.001],cm:["length",.01],m:["length",1],km:["length",1000],inch:["length",.0254],ft:["length",.3048],kg:["mass",1],g:["mass",.001],lb:["mass",.45359237],c:["temp",1],f:["temp",1]};
  $("unitCalc")?.addEventListener("click",()=>{const v=Number($("unitValue").value),a=$("unitFrom").value,b=$("unitTo").value;if($("unitValue").value===""||!Number.isFinite(v)){setText("unitResult","Enter a valid number.");return;}if(factors[a][0]!==factors[b][0]){setText("unitResult","Choose units from the same group (length, mass, or temperature).");return;}let out;if(a==="c"&&b==="f")out=v*9/5+32;else if(a==="f"&&b==="c")out=(v-32)*5/9;else out=v*factors[a][1]/factors[b][1];setText("unitResult",`${fmt(v)} ${a} = ${fmt(out)} ${b}`);});
  $("salaryCalc")?.addEventListener("click",()=>{const annual=Number($("annualSalary").value),ded=Number($("salaryDeductions").value||0);if($("annualSalary").value===""||annual<0||ded<0){setText("salaryResult","Enter valid non-negative values.");return;}setText("salaryResult",`Estimated monthly amount: ₹${fmt(annual/12-ded)} (before any other taxes or deductions)`);});
})();
