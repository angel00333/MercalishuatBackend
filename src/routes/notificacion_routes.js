const express =
  require('express');

const router =
  express.Router();

const {
  verificarToken,
} = require(
  '../middleware/auth.middleware'
);

const notificacionController =
  require(
    '../controllers/notificacion.controller'
  );


// =======================================
// LISTAR
// =======================================

router.get(
  '/',
  verificarToken,
  notificacionController
    .listarNotificaciones
);


// =======================================
// CONTAR NO LEÍDAS
// =======================================

router.get(
  '/no-leidas',
  verificarToken,
  notificacionController
    .contarNoLeidas
);


// =======================================
// MARCAR TODAS COMO LEÍDAS
//
// IMPORTANTE:
// Debe ir ANTES de /:id/leida
// =======================================

router.put(
  '/leer-todas',
  verificarToken,
  notificacionController
    .marcarTodasComoLeidas
);


// =======================================
// MARCAR UNA COMO LEÍDA
// =======================================

router.put(
  '/:id/leida',
  verificarToken,
  notificacionController
    .marcarComoLeida
);


// =======================================
// REGISTRAR TOKEN FCM
// =======================================

router.post(
  '/fcm-token',
  verificarToken,
  notificacionController
    .registrarTokenFcm
);


// =======================================
// DESACTIVAR TOKEN FCM
// =======================================

router.delete(
  '/fcm-token',
  verificarToken,
  notificacionController
    .eliminarTokenFcm
);


module.exports =
  router;