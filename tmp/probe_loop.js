const GEMINI_API_KEY = "AIzaSyCBdaMoNXHUJAd6GSOVOKaGfNvkfYjBZhM";

async function testFetch(endpoint, model) {
  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/${endpoint}/models/${model}:generateContent?key=${GEMINI_API_KEY}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: `Say hello` }] }]
          })
        });
    const data = await res.json();
    console.log(`[${endpoint}] [${model}] status:`, res.status);
    console.log(JSON.stringify(data, null, 2));
  } catch(e) {
    console.error(e);
  }
}

async function run() {
  await testFetch('v1', 'gemini-flash-latest');
  await testFetch('v1', 'gemini-2.5-flash');
  await testFetch('v1', 'gemini-2.0-flash');
  await testFetch('v1', 'gemini-1.5-flash');
}
run();
