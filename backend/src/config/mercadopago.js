const { MercadoPagoConfig } = require("mercadopago");

function getMpClient() {
  const token = process.env.MP_ACCESS_TOKEN;
  if (!token) throw new Error("Falta MP_ACCESS_TOKEN en backend/.env");

  return new MercadoPagoConfig({
    accessToken: token,
    options: { timeout: 5000 }
  });
}

module.exports = { getMpClient };