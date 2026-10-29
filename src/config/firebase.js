const {
  initializeApp,
  cert,
  getApps,
  getApp,
} = require('firebase-admin/app');

const {
  getMessaging,
} = require('firebase-admin/messaging');

function normalizarPrivateKey(valor) {
  if (!valor) {
    throw new Error(
      'FIREBASE_PRIVATE_KEY no está configurada'
    );
  }

  let key = valor.trim();

  // Por si Railway recibió la clave rodeada
  // accidentalmente por comillas.
  if (
    (key.startsWith('"') && key.endsWith('"')) ||
    (key.startsWith("'") && key.endsWith("'"))
  ) {
    key = key.slice(1, -1);
  }

  // Convierte los "\n" escritos literalmente
  // en saltos de línea PEM reales.
  key = key
    .replace(/\\n/g, '\n')
    .replace(/\r/g, '');

  if (
    !key.includes(
      '-----BEGIN PRIVATE KEY-----'
    ) ||
    !key.includes(
      '-----END PRIVATE KEY-----'
    )
  ) {
    throw new Error(
      'FIREBASE_PRIVATE_KEY tiene un formato inválido'
    );
  }

  return key;
}

function obtenerFirebaseApp() {
  if (getApps().length > 0) {
    return getApp();
  }

  const projectId =
    process.env.FIREBASE_PROJECT_ID;

  const clientEmail =
    process.env.FIREBASE_CLIENT_EMAIL;

  const privateKey =
    normalizarPrivateKey(
      process.env.FIREBASE_PRIVATE_KEY
    );

  if (!projectId) {
    throw new Error(
      'FIREBASE_PROJECT_ID no está configurado'
    );
  }

  if (!clientEmail) {
    throw new Error(
      'FIREBASE_CLIENT_EMAIL no está configurado'
    );
  }

  return initializeApp({
    credential: cert({
      projectId,
      clientEmail,
      privateKey,
    }),
  });
}

function obtenerMessaging() {
  return getMessaging(
    obtenerFirebaseApp()
  );
}

module.exports = {
  obtenerFirebaseApp,
  obtenerMessaging,
};