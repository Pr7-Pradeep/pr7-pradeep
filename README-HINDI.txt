PR7 AI PROMPTS — वेबसाइट starter package
=========================================

इस पैकेज में क्या है?
- index.html: वेबसाइट का मुख्य पेज
- styles.css: black premium cinematic design
- app.js: search, categories, copy prompt, admin dashboard
- config.js: Supabase configuration
- supabase-schema.sql: secure cloud admin के लिए database/RLS setup

IMPORTANT — Demo और secure admin में अंतर
-----------------------------------------
बिना Supabase setup के वेबसाइट preview/demo mode में चलती है। इस mode में Admin changes केवल उसी browser/device के local storage में save होते हैं। यह सुरक्षित login नहीं है, और public website के लिए इसे secure admin न समझें।

Secure cloud admin के लिए Supabase setup जरूरी है:
1. https://supabase.com/ पर account बनाएं और नया project बनाएं।
2. Project Dashboard > SQL Editor खोलें।
3. supabase-schema.sql का पूरा SQL paste करके Run करें।
4. Authentication > Users में अपना user बनाएं। यदि sign-up बंद है, तो Dashboard से user invite/create करें।
5. उस user का UUID copy करें।
6. SQL Editor में यह command चलाएं (UUID बदलें):
   insert into public.pr7_admins (user_id) values ('YOUR-USER-UUID');
7. Project Settings > API में Project URL और publishable/anon key लें।
8. config.js में supabaseUrl और supabaseAnonKey भरें।
   Service role key कभी भी config.js में न डालें।
9. Supabase Auth में public signups बंद रखें, अगर केवल आप admin होंगे।
10. वेबसाइट को फिर reload करें। Admin Login से अपने user के email/password से sign in करें।

Free में test / publish करने का तरीका — GitHub Pages
----------------------------------------------------
1. GitHub पर account बनाएं: https://github.com/
2. New repository बनाएं, उदाहरण: pr7-ai-prompts
3. इस package के index.html, styles.css, app.js, config.js और बाकी files repository के root में upload करें।
4. Repository > Settings > Pages में जाएं।
5. Build and deployment में Deploy from a branch चुनें।
6. Branch: main और folder: /(root) चुनकर Save करें।
7. GitHub Pages द्वारा दिए गए URL को खोलें और मोबाइल पर test करें।

पहले स्थानीय/demo test:
- index.html को browser में खोलकर design देख सकते हैं।
- कुछ browser security rules के कारण local file से Supabase login या कुछ features ठीक न चलें। GitHub Pages पर HTTPS URL से test करें।
- Demo-mode edits सिर्फ उसी browser में रहते हैं और दूसरे लोगों तक नहीं पहुँचते।
- Public website पर real content publish करने से पहले Supabase setup पूरा करें।

अपना domain बाद में जोड़ना:
- Domain registrar से domain खरीदें।
- GitHub repository > Settings > Pages > Custom domain में domain डालें।
- Registrar में GitHub Pages द्वारा बताये DNS records सेट करें। DNS बदलाव में कुछ समय लग सकता है।
- HTTPS उपलब्ध होने पर Enforce HTTPS चालू करें।
- यदि भविष्य में backend/hosting बदलते हैं, तो migration की जरूरत पड़ सकती है।

Images:
- फिलहाल image URL field उपलब्ध है। फोटो को HTTPS public image URL दें।
- किसी भी निजी तस्वीर को बिना अनुमति सार्वजनिक न करें।
- बड़े image collection के लिए बाद में Supabase Storage या image hosting जोड़ा जा सकता है।

SEO:
- प्रत्येक prompt के लिए अलग page/schema अभी शामिल नहीं है; यह starter single-page website है।
- Google indexing की guarantee नहीं है। Google Search Console में site verify करके sitemap/URL inspection का उपयोग कर सकते हैं।
- बेहतर SEO के लिए आगे individual prompt pages और sitemap बनवाएं।

Security:
- Public website को केवल config.js के जरिए admin password से सुरक्षित नहीं किया जा सकता।
- Supabase Auth + RLS SQL policies का इस्तेमाल करें।
- कभी भी service_role key, database password या admin password public files में न डालें।


नए Creator Tools
----------------
इस version में Photo Resizer/Compressor (browser-side), Translator (external MyMemory API), Resume Maker (Print > Save as PDF), और calculators जोड़े गए हैं। Photo processing local browser में होती है। Translator के लिए text external translation provider को भेजा जाता है; confidential text न डालें। Resume PDF के लिए browser print dialog में Save as PDF चुनें। ZIP download के लिए JSZip CDN पर निर्भरता है; यदि CDN उपलब्ध न हो तो individual images download करें।
