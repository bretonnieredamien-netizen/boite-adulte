export default async function handler(req, res) {
  // 1. Autoriser ton site à parler au backend (CORS)
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Si c'est juste une vérification (OPTIONS), on dit OK
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // 2. Vérifier que c'est bien une demande d'envoi (POST)
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  const { userId, message, sendAfter } = req.body;

  if (!userId || !message) {
    return res.status(400).json({ error: "Il manque l'ID utilisateur ou le message." });
  }

  // 3. Préparer le message pour OneSignal
  const options = {
    method: 'POST',
    headers: {
      'accept': 'application/json',
      'Authorization': `Basic ${process.env.ONESIGNAL_REST_API_KEY}`, // Ta clé secrète (cachée dans Vercel)
      'content-type': 'application/json'
    },
    body: JSON.stringify({
      app_id: process.env.ONESIGNAL_APP_ID, // Ton ID d'app
      include_subscription_ids: [userId], // On vise juste cet utilisateur
      contents: { "en": message, "fr": message },
      headings: { "en": "CLARIS", "fr": "CLARIS" },
      send_after: sendAfter // Date précise du rappel
    })
  };

  // 4. Envoyer
  try {
    const response = await fetch('https://onesignal.com/api/v1/notifications', options);
    const data = await response.json();
    return res.status(200).json(data);
  } catch (error) {
    console.error("Erreur OneSignal:", error);
    return res.status(500).json({ error: "Erreur serveur notification" });
  }
}