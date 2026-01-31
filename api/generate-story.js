// api/generate-story.js
import { GoogleGenerativeAI } from "@google/generative-ai";

// C'est ici que Vercel injecte ta clé secrète
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export default async function handler(req, res) {
  // 1. Gérer les CORS (Autoriser ton site à parler à ce fichier)
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*'); // Pour la prod, remplace '*' par ton URL Vercel
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // Si c'est juste une vérification (OPTIONS), on dit OK tout de suite
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // 2. Vérifier que c'est bien une demande POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  try {
    const { prompt } = req.body;

    // 3. Configuration du modèle
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // 4. Le Prompt Sécurisé (System Prompt)
    // On force l'IA à être gentille ici, l'enfant ne peut pas modifier ça.
    const securePrompt = `
      Tu es une conteuse magique pour enfants de 3 à 8 ans.
      Sujet demandé par l'enfant : "${prompt}".
      
      Règles impératives :
      - Ton ton doit être doux, joyeux et bienveillant.
      - Pas de violence, pas de peur, pas de mots compliqués.
      - L'histoire doit être courte (environ 3 minutes de lecture).
      - Si le sujet demandé est inapproprié, invente gentiment une histoire sur un petit lapin magique à la place.
    `;

    // 5. Appel à Gemini
    const result = await model.generateContent(securePrompt);
    const response = await result.response;
    const text = response.text();

    // 6. On renvoie l'histoire au site
    return res.status(200).json({ story: text });

  } catch (error) {
    console.error("Erreur Gemini:", error);
    return res.status(500).json({ error: "Le grimoire est fermé (Erreur serveur)" });
  }
}