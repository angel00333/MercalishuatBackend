const express = require('express');

const router = express.Router();

const chatController =
  require(
    '../controllers/chat.controller'
  );

const {
  verificarToken,
} = require(
  '../middleware/auth.middleware'
);

// ============================================================
// CREAR O BUSCAR CONVERSACIÓN
// ============================================================

router.post(
  '/conversacion',
  verificarToken,
  chatController.crearConversacion
);

// ============================================================
// LISTAR CONVERSACIONES
// ============================================================

router.get(
  '/conversaciones',
  verificarToken,
  chatController.listarConversaciones
);

// ============================================================
// OBTENER MENSAJES
// ============================================================

router.get(
  '/conversacion/:id/mensajes',
  verificarToken,
  chatController.obtenerMensajes
);

// ============================================================
// ENVIAR MENSAJE
// ============================================================

router.post(
  '/conversacion/:id/mensaje',
  verificarToken,
  chatController.enviarMensaje
);

// ============================================================
// MARCAR COMO LEÍDOS
// ============================================================

router.put(
  '/conversacion/:id/leidos',
  verificarToken,
  chatController.marcarComoLeidos
);

// ============================================================
// EXPORTAR
// ============================================================

module.exports = router;