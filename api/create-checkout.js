import Stripe from 'stripe';

// Initialisation avec la clé secrète (stockée dans Vercel)
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  // 1. GESTION DES CORS (Autoriser ton site à parler au serveur)
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*'); // Tu peux remplacer '*' par 'https://claris-app.com' pour plus de sécurité
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  // Si le navigateur demande "Est-ce que je peux ?", on répond OUI (OPTIONS)
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // 2. TRAITEMENT DU PAIEMENT (POST)
  if (req.method === 'POST') {
    try {
      // DÉFINITION DU DOMAINE (Indispensable pour les redirections)
      const YOUR_DOMAIN = 'https://claris-app.com'; 
      
      // Création de la session Stripe
      const session = await stripe.checkout.sessions.create({
        line_items: [
          {
            // TON ID DE PRIX (Abonnement à 9,99€)
            price: 'price_1SwokEHfF9mmPuYRrxcWgGn2', 
            quantity: 1,
          },
        ],
        mode: 'subscription', // Mode abonnement récurrent
        success_url: `${YOUR_DOMAIN}/success.html`, // Redirection après succès
        cancel_url: `${YOUR_DOMAIN}/`, // Retour à l'accueil si annulation
        // On demande juste l'email pour simplifier
        billing_address_collection: 'auto',
      });

      // On renvoie l'URL de paiement au site pour qu'il redirige le client
      res.status(200).json({ url: session.url });
      
    } catch (err) {
      console.error("Erreur Stripe:", err);
      res.status(err.statusCode || 500).json(err.message);
    }
  } else {
    // Si ce n'est pas une requête POST
    res.setHeader('Allow', 'POST');
    res.status(405).end('Method Not Allowed');
  }
}