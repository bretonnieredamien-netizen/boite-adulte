const Stripe = require('stripe');

export default async function handler(req, res) {
  // 1. CORS (Pour autoriser ton site à parler au serveur)
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // Répondre OK aux tests du navigateur
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // 2. Vérification de la méthode
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée (POST requis)' });
  }

  // 3. Vérification de la clé Stripe (DEBUG)
  if (!process.env.STRIPE_SECRET_KEY) {
    console.error("ERREUR CRITIQUE : La clé STRIPE_SECRET_KEY est manquante dans Vercel !");
    return res.status(500).json({ error: "Configuration serveur manquante (Clé Stripe)." });
  }

  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

    // Récupérer l'URL de base
    const protocol = req.headers['x-forwarded-proto'] || 'http';
    const host = req.headers.host;
    const domainUrl = `${protocol}://${host}`;

    console.log("Création session Stripe pour : " + domainUrl);

    // 4. Création de la session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
allow_promotion_codes: true, // <--- AJOUTEZ CETTE LIGNE ICI
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: 'Abonnement Boîte Magique',
              description: 'Accès illimité + 7 jours offerts',
            },
            unit_amount: 999,
            recurring: { interval: 'month' },
          },
          quantity: 1,
        },
      ],
      mode: 'subscription',
      subscription_data: {
        trial_period_days: 7,
      },
      success_url: `${domainUrl}/success.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${domainUrl}/`,
    });

    return res.status(200).json({ url: session.url });

  } catch (error) {
    console.error("ERREUR STRIPE DETECTÉE :", error);
    return res.status(500).json({ error: error.message || "Erreur interne Stripe" });
  }
}