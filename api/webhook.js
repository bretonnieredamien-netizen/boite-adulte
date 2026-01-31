import { Stripe } from 'stripe';
import { Resend } from 'resend';
import { buffer } from 'micro';

// --- CONFIGURATION ---
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const resend = new Resend(process.env.RESEND_API_KEY);

// 👇 REMPLACEZ CECI PAR VOTRE VRAIE URL VERCEL (SANS LE / A LA FIN) 👇
// Exemple : 'https://boite-magique.vercel.app'
const URL_DU_SITE = 'https://boite-magique-backend2.vercel.app'; 

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).send('Method Not Allowed');
  }

  const sig = req.headers['stripe-signature'];
  let event;

  try {
    const buf = await buffer(req);
    event = stripe.webhooks.constructEvent(buf, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error(`Webhook Error: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Si le paiement est réussi (ou essai démarré)
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const userEmail = session.customer_details.email;
    // On récupère le prénom s'il est dispo, sinon "Petit Magicien"
    const userName = session.customer_details.name ? session.customer_details.name.split(' ')[0] : "Petit Magicien";
    
    // On génère le lien magique avec l'ID de session pour l'auto-connexion
    const magicLink = `${URL_DU_SITE}/app.html?session_id=${session.id}`;

    try {
      await resend.emails.send({
        from: 'La Boîte Magique <onboarding@resend.dev>', // Gardez ça tant que vous n'avez pas votre nom de domaine
        to: userEmail,
        subject: '✨ Accès activé : Bienvenue dans la Boîte Magique !',
        html: generateEmailHTML(userName, magicLink),
      });
      console.log('E-mail envoyé avec succès à', userEmail);
    } catch (error) {
      console.error('Erreur envoi email:', error);
    }
  }

  res.status(200).json({ received: true });
}

// --- DESIGN DE L'EMAIL (NOTICE INCLUSE) ---
function generateEmailHTML(name, link) {
  return `
  <!DOCTYPE html>
  <html>
  <head>
    <style>
      body { font-family: 'Helvetica', sans-serif; background-color: #f3e8ff; padding: 20px; margin: 0; }
      .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 24px; overflow: hidden; box-shadow: 0 10px 40px rgba(100, 50, 200, 0.15); border: 1px solid #e9d5ff; }
      .header { background: linear-gradient(135deg, #8b5cf6, #ec4899); padding: 40px 20px; text-align: center; color: white; }
      .header h1 { margin: 0; font-size: 28px; text-shadow: 0 2px 4px rgba(0,0,0,0.1); }
      .content { padding: 40px 30px; color: #334155; line-height: 1.6; font-size: 16px; }
      
      /* Le Bouton Magique */
      .btn { 
        display: block; width: 220px; margin: 30px auto; 
        background: #6366f1; color: white !important; 
        text-align: center; padding: 18px; border-radius: 50px; 
        text-decoration: none; font-weight: bold; font-size: 18px;
        box-shadow: 0 4px 15px rgba(99, 102, 241, 0.4);
      }
      .btn:hover { background: #4f46e5; transform: translateY(-2px); }

      .notice-box { background-color: #f8fafc; border: 2px dashed #cbd5e1; border-radius: 16px; padding: 25px; margin-top: 30px; }
      .step { display: flex; align-items: start; margin-bottom: 15px; }
      .step-icon { background: #e0e7ff; color: #4f46e5; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; margin-right: 15px; flex-shrink: 0; }
      
      .footer { text-align: center; padding: 30px; font-size: 12px; color: #94a3b8; background: #fafafa; border-top: 1px solid #f1f5f9; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>✨ C'est parti ${name} !</h1>
      </div>
      <div class="content">
        <p>Votre essai gratuit est activé. La Boîte Magique est prête à raconter des histoires et répondre à toutes les questions.</p>
        
        <p style="text-align: center; font-weight: bold; color: #7c3aed;">
          Aucun mot de passe nécessaire.<br>Cliquez simplement ci-dessous :
        </p>

        <a href="${link}" class="btn">Lancer l'Application 🚀</a>

        <div class="notice-box">
          <h3 style="margin-top:0; color:#1e293b; text-align:center;">📘 Guide Rapide pour les Parents</h3>
          
          <div class="step">
            <div class="step-icon">1</div>
            <div><strong>C'est automatique :</strong> L'application est déjà configurée. Pas besoin de clés ou de codes.</div>
          </div>
          
          <div class="step">
            <div class="step-icon">2</div>
            <div><strong>Le Micro 🎤 :</strong> Appuyez sur le bouton rond, attendez de voir "Je t'écoute", et parlez.</div>
          </div>

          <div class="step">
            <div class="step-icon">3</div>
            <div><strong>Navigation 🏠 :</strong> Le bouton "Maison" en haut à gauche permet de changer d'activité (Dessin, Histoires, Chat...).</div>
          </div>

          <div class="step">
            <div class="step-icon">💡</div>
            <div><strong>Astuce Pro :</strong> Sur iPad ou Tablette, ouvrez le lien dans Safari/Chrome, touchez "Partager" puis <strong>"Ajouter à l'écran d'accueil"</strong> pour une expérience plein écran comme une vraie app !</div>
          </div>
        </div>
      </div>
      <div class="footer">
        La Boîte Magique<br>
        Abonnement sans engagement. Annulable en 1 clic via Stripe.
      </div>
    </div>
  </body>
  </html>
  `;
}