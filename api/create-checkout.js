const Stripe = require('stripe');

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Méthode non autorisée' });

  if (!process.env.STRIPE_SECRET_KEY) {
    return res.status(500).json({ error: "Clé Stripe manquante." });
  }

  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const protocol = req.headers['x-forwarded-proto'] || 'http';
    const host = req.headers.host;
    const domainUrl = `${protocol}://${host}`;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      allow_promotion_codes: true,
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: 'Abonnement CLARIS Premium', // Nom plus "Haut de gamme"
              description: 'Assistant IA Illimité + App Mobile + Mises à jour',
            },
            unit_amount: 990, // <--- NOUVEAU PRIX : 9.90€
            recurring: { interval: 'month' },
          },
          quantity: 1,
        },
      ],
      mode: 'subscription',
      subscription_data: {
        trial_period_days: 7, // On garde l'essai gratuit, c'est crucial pour vendre à 9.90€
      },
      success_url: `${YOUR_DOMAIN}/success.html`, // Reste inchangé
    cancel_url: `${YOUR_DOMAIN}/`, // Renvoie vers l'accueil (index.html)
    });

    return res.status(200).json({ url: session.url });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
}