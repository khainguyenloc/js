const GEMINI_API_KEY = "AIzaSyCBdaMoNXHUJAd6GSOVOKaGfNvkfYjBZhM";

async function test() {
  console.log("Fetching models for key...");
  try {
    const listResp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${GEMINI_API_KEY}`);
    const listData = await listResp.json();
    if (listData.models) {
        console.log("AVAILABLE MODELS:", listData.models.map(m => m.name).join(', '));
        const genModels = listData.models.filter(m => m.supportedGenerationMethods && m.supportedGenerationMethods.includes('generateContent'));
        console.log("MODELS SUPPORTING generateContent:", genModels.map(m => m.name).join(', '));
    } else {
        console.log("NO MODELS FOUND. Response:", JSON.stringify(listData));
    }
  } catch (err) {
      console.error("Fetch models failed:", err);
  }
}
test();
