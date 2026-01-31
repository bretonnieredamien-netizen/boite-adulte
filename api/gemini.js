const { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } = require("@google/generative-ai");

export default async function handler(req, res) {
  // 1. Autorisations (CORS)
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Méthode non autorisée' });

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("Clé API Google manquante.");
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    
    // 2. CONFIGURATION STRICTE SELON VOTRE DEMANDE
    // On utilise exactement la référence qui était dans votre index.html
    const model = genAI.getGenerativeModel({ 
        model: "gemini-2.5-flash",
        // On garde les sécurités désactivées pour éviter les blocages sur les histoires
        safetySettings: [
            { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
            { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
            { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
            { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
        ]
    });

    const { prompt } = req.body;
    if (!prompt) throw new Error("Le prompt est vide.");

    console.log("Envoi demande à Gemini (Modèle 2.5 Flash)...");

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    console.log("Réponse reçue !");

    res.status(200).json({ text: text });

  } catch (error) {
    console.error("ERREUR GEMINI:", error);
    // On renvoie l'erreur brute pour le diagnostic
    res.status(500).json({ error: error.message || "Erreur IA" });
  }
}