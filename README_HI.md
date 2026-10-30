# Apna Nazariya AI – Mobile-first Open-source Starter

## अभी क्या काम करता है
- Android-friendly PWA dashboard
- 13 specialist agent prompt templates
- Creator voice और YouTube reference URL fields
- Prompt generation, copy और AI chat खोलना
- Cloudflare Worker + D1 के लिए shared profile API starter
- कोई paid API key शामिल नहीं है

## ईमानदार सीमा
यह MVP अपने आप किसी AI model को नहीं चलाता। Agent चुनने पर यह मजबूत, context-aware prompt बनाता है जिसे किसी उपलब्ध AI chat/model में चलाना होगा। Open-weight model का software free हो सकता है, लेकिन cloud inference compute हमेशा free नहीं होता। Automatic YouTube scraping, publishing और analytics sync अभी शामिल नहीं हैं।

## फोन से deploy करने का रास्ता
1. GitHub account बनाएं/खोलें और इस project ZIP को repository में upload करें।
2. Cloudflare account खोलें और Workers & Pages में GitHub repository connect करें।
3. Build command खाली रखें; assets directory `public` रखें। Worker deployment के लिए Wrangler config उपयोग करें।
4. D1 database बनाएं; `schema.sql` execute करें; database ID को `wrangler.toml` में रखें।
5. Worker secret `PROJECT_PIN` सेट करें। इसे किसी के साथ सार्वजनिक रूप से साझा न करें।
6. Deploy के बाद app URL खोलें। Android Chrome menu → Add to Home screen करें।

## सुरक्षा
- Public repository में वास्तविक PIN, API keys, YouTube tokens या निजी channel credentials कभी न रखें।
- इस starter में PIN केवल shared profile API की basic gate है; production-grade multi-user authentication नहीं है।
- GitHub और Cloudflare की current dashboard instructions के अनुसार deployment settings बदल सकती हैं।

## Live
Laptop के बिना शुरुआत के लिए YouTube Go Live Together सबसे सरल है, यदि channel eligibility पूरी हो। Live archive उपलब्ध होता है। अलग-अलग camera master files के लिए दोनों phones पर अलग recording workflow का परीक्षण जरूरी है।
