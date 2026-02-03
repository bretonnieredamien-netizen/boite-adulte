export default async function handler(req, res) {
  // 1. Sécurité CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Méthode non autorisée' });

  // 2. Récupération des données
  const { userId, message, sendAfter } = req.body;

  if (!userId || !message) {
    return res.status(400).json({ error: "Il manque l'ID utilisateur ou le message." });
  }

  // 3. Configuration de la requête OneSignal
  const options = {
    method: 'POST',
    headers: {
      'accept': 'application/json',
      'Authorization': `Basic ${process.env.ONESIGNAL_REST_API_KEY}`, // Ta clé secrète (dans Vercel)
      'content-type': 'application/json'
    },
    body: JSON.stringify({
      app_id: process.env.ONESIGNAL_APP_ID, // Ton ID d'app (dans Vercel)
      include_subscription_ids: [userId], // On cible cet utilisateur précis
      contents: { "en": message, "fr": message },
      headings: { "en": "CLARIS", "fr": "CLARIS" },
      send_after: sendAfter // Format: "2024-02-06 14:00:00 GMT+0100"
    })
  };

  // 4. Envoi
  try {
    const response = await fetch('https://onesignal.com/api/v1/notifications', options);
    const data = await response.json();
    return res.status(200).json(data);
  } catch (error) {
    console.error("Erreur OneSignal:", error);
    return res.status(500).json({ error: "Erreur lors de la programmation de la notification." });
  }
}