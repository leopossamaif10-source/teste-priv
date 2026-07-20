// PARADISE CHECKOUT - Vercel Serverless Function
// Equivalente ao action=check_status do manager-payment.php

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  const API_TOKEN = process.env.PARADISE_API_TOKEN;
  if (!API_TOKEN) {
    return res.status(500).json({ error: 'Configuração da API ausente (variável de ambiente)' });
  }

  const { hash } = req.query;
  if (!hash) {
    return res.status(400).json({ error: 'Hash não informado' });
  }

  try {
    const statusUrl = `https://api.paradisepagbr.com/api/public/v1/transactions/${encodeURIComponent(
      hash
    )}?api_token=${API_TOKEN}`;

    const response = await fetch(statusUrl, {
      headers: { Accept: 'application/json' },
    });

    if (response.ok) {
      const data = await response.json();
      if (data.payment_status) {
        return res.status(200).json({ payment_status: data.payment_status });
      }
      return res.status(500).json({ error: 'Resposta da API inválida' });
    } else {
      const text = await response.text();
      res.status(response.status);
      res.setHeader('Content-Type', 'application/json');
      return res.send(text);
    }
  } catch (err) {
    return res.status(500).json({ error: 'Erro interno: ' + err.message });
  }
}
