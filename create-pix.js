// PARADISE CHECKOUT - Vercel Serverless Function
// Equivalente ao POST do manager-payment.php, usando os dados reais enviados pelo comprador.

export default async function handler(req, res) {
  // CORS básico
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  const API_TOKEN = process.env.PARADISE_API_TOKEN;
  const OFFER_HASH = process.env.PARADISE_OFFER_HASH;
  const PRODUCT_HASH = process.env.PARADISE_PRODUCT_HASH;
  const PRODUCT_TITLE = process.env.PARADISE_PRODUCT_TITLE || 'Finalize sua Compra';
  const IS_DROPSHIPPING = false;
  const PIX_EXPIRATION_MINUTES = 5;

  if (!API_TOKEN || !OFFER_HASH || !PRODUCT_HASH) {
    return res.status(500).json({ error: 'Configuração da API ausente (variáveis de ambiente)' });
  }

  try {
    const body = req.body || {};
    const customer = body.customer || {};
    const utms = body.utms || {};

    // Validação dos dados reais do comprador (sem geração de dados falsos)
    const required = ['name', 'email', 'document', 'phone_number', 'amount'];
    for (const field of required) {
      if (!customer[field]) {
        return res.status(400).json({ error: `Campo obrigatório ausente: ${field}` });
      }
    }

    if (!IS_DROPSHIPPING) {
      customer.street_name = customer.street_name || 'Rua do Produto Digital';
      customer.number = customer.number || '0';
      customer.complement = customer.complement || 'N/A';
      customer.neighborhood = customer.neighborhood || 'Internet';
      customer.city = customer.city || 'Brasil';
      customer.state = customer.state || 'BR';
      customer.zip_code = customer.zip_code || '00000000';
    }

    const cartItems = [
      {
        product_hash: PRODUCT_HASH,
        title: PRODUCT_TITLE,
        price: customer.amount,
        quantity: 1,
        operation_type: 1,
        tangible: IS_DROPSHIPPING,
      },
    ];

    const payload = {
      amount: Math.round(customer.amount),
      offer_hash: OFFER_HASH,
      payment_method: 'pix',
      customer,
      cart: cartItems,
      installments: 1,
      tracking: utms,
    };

    if (PIX_EXPIRATION_MINUTES > 0) {
      payload.pix_expires_in = PIX_EXPIRATION_MINUTES * 60;
    }

    const apiUrl = `https://api.paradisepagbr.com/api/public/v1/transactions?api_token=${API_TOKEN}`;

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await response.text();
    res.status(response.status);
    res.setHeader('Content-Type', 'application/json');
    return res.send(data);
  } catch (err) {
    return res.status(500).json({ error: 'Erro interno: ' + err.message });
  }
}
