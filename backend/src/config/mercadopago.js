const { MercadoPagoConfig } = require("mercadopago");

function getMpClient() {
  const token = process.env.MP_ACCESS_TOKEN;
  const isProd = process.env.NODE_ENV === "production";

  if (!token) {
    console.error("[MP CONFIG] MP_ACCESS_TOKEN no definido.");
    throw new Error("MP_ACCESS_TOKEN no configurado en variables de entorno.");
  }

  if (!isProd) {
    console.log("[MP CONFIG] Mercado Pago inicializado en modo LOCAL/DEV");
  } else {
    console.log("[MP CONFIG] Mercado Pago inicializado en PRODUCCIÓN");
  }

  return new MercadoPagoConfig({
    accessToken: token,
    options: {
      timeout: 5000, // evita que quede colgado si MP no responde
    },
  });
}

module.exports = { getMpClient };