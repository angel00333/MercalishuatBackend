const {
  initializeApp,
  cert,
  getApps,
} = require(
  'firebase-admin/app'
);

const {
  getMessaging,
} = require(
  'firebase-admin/messaging'
);


// ============================================================
// INICIALIZAR FIREBASE ADMIN
// ============================================================

function obtenerFirebaseApp() {
  if (
    getApps().length > 0
  ) {
    return getApps()[0];
  }

  const projectId =
    process.env
      .FIREBASE_PROJECT_ID;

  const clientEmail =
    process.env
      .FIREBASE_CLIENT_EMAIL;

  const privateKey =
    process.env
      .FIREBASE_PRIVATE_KEY
      ?.replace(
        /\\n/g,
        '\n'
      );

  if (
    !projectId ||
    !clientEmail ||
    !privateKey
  ) {
    throw new Error(
      'Faltan variables de Firebase Admin'
    );
  }

  return initializeApp({
    credential:
      cert({
        projectId,
        clientEmail,
        privateKey,
      }),
  });
}


// ============================================================
// MESSAGING
// ============================================================

function obtenerMessaging() {
  const app =
    obtenerFirebaseApp();

  return getMessaging(
    app
  );
}


module.exports = {
  obtenerFirebaseApp,
  obtenerMessaging,
};