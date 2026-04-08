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
    console.log(`[${endpoint}] [${model}] status:`, res.status, data.error ? data.error.message : 'SUCCESS');
  } catch(e) {
    console.error(e);
  }
}

async function run() {
  await testFetch('v1', 'gemini-1.5-flash');
  await testFetch('v1beta', 'gemini-1.5-flash');
  await testFetch('v1', 'gemini-2.5-flash');
  await testFetch('v1beta', 'gemini-2.5-flash');
  await testFetch('v1beta', 'gemini-2.0-flash');
  await testFetch('v1beta', 'gemma-3-4b-it');
}
run();
