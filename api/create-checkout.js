import Stripe from 'stripe';

// On récupère la clé secrète depuis Vercel (Environment Variables)
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  // 1. Autoriser ton site à parler au backend (CORS)
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  // Si c'est juste une vérification (OPTIONS), on dit OK
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'POST') {
    try {
      // --- C'EST ICI QUE L'ERREUR ÉTAIT ---
      // On définit ton domaine proprement
      const YOUR_DOMAIN = 'https://claris-app.com'; 
      
      // Création de la session de paiement Stripe
      const session = await stripe.checkout.sessions.create({
        line_items: [
          {
            // Remplace par le 'Price ID' de ton produit Stripe (ex: price_1Pxyz...)
            // Si tu ne l'as pas encore mis en dur, assure-toi de l'envoyer depuis le front
            price: 'price_1QscyDG0x3QsS443830q9g9A', 
            quantity: 1,
          },
        ],
        mode: 'subscription', // ou 'payment' pour un achat unique
        success_url: `${YOUR_DOMAIN}/success.html`,
        cancel_url: `${YOUR_DOMAIN}/`,
      });

      // On renvoie l'URL de paiement au site
      res.status(200).json({ url: session.url });
    } catch (err) {
      console.error("Erreur Stripe:", err);
      res.status(err.statusCode || 500).json(err.message);
    }
  } else {
    res.setHeader('Allow', 'POST');
    res.status(405).end('Method Not Allowed');
  }
}