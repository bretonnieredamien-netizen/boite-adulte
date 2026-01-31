const fetch = require('node-fetch');

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

  try {
    const { text } = req.body;
    
    // On récupère la région définie dans Vercel, sinon on tente 'francecentral' par défaut
    const region = process.env.AZURE_REGION || "francecentral";
    const key = process.env.AZURE_SPEECH_KEY;

    if (!key) throw new Error("Clé API Azure (AZURE_SPEECH_KEY) manquante !");

    // URL de l'API Azure
    const url = `https://${region}.tts.speech.microsoft.com/cognitiveservices/v1`;

    // Configuration de la voix VIVIENNE
    const ssml = `
      <speak version='1.0' xml:lang='fr-FR'>
        <voice xml:lang='fr-FR' xml:gender='Female' name='fr-FR-VivienneMultilingualNeural'>
          <prosody rate="0.9">
            ${text}
          </prosody>
        </voice>
      </speak>`;

    console.log(`Tentative Azure vers : ${region} avec la voix Vivienne...`);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Ocp-Apim-Subscription-Key': key,
        'Content-Type': 'application/ssml+xml',
        'X-Microsoft-OutputFormat': 'audio-16khz-128kbitrate-mono-mp3',
        'User-Agent': 'BoiteMagique'
      },
      body: ssml
    });

    if (!response.ok) {
      const errDetail = await response.text();
      console.error(`ERREUR AZURE (${response.status}) :`, errDetail);
      throw new Error(`Azure Error ${response.status}: ${errDetail}`);
    }

    const audioBuffer = await response.buffer();
    res.setHeader('Content-Type', 'audio/mpeg');
    res.send(audioBuffer);

  } catch (error) {
    console.error("ECHEC VOCAL :", error.message);
    // On renvoie l'erreur pour que le frontend sache qu'il doit utiliser la voix robot
    res.status(500).json({ error: error.message });
  }
}