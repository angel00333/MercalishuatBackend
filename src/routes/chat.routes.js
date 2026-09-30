const express =
  require('express');

const router =
  express.Router();

const chatController =
  require(
    '../controllers/chat.controller'
  );

// ============================================================
// CREAR O BUSCAR CONVERSACIÓN
// ============================================================

router.post(
  '/conversacion',
  chatController.crearConversacion
);

// ============================================================
// LISTAR CONVERSACIONES
// ============================================================

router.get(
  '/conversaciones',
  chatController.listarConversaciones
);

// ============================================================
// OBTENER MENSAJES
// ============================================================

router.get(
  '/conversacion/:id/mensajes',
  chatController.obtenerMensajes
);

// ============================================================
// ENVIAR MENSAJE
// ============================================================

router.post(
  '/conversacion/:id/mensaje',
  chatController.enviarMensaje
);

// ============================================================
// MARCAR COMO LEÍDOS
// ============================================================

router.put(
  '/conversacion/:id/leidos',
  chatController.marcarComoLeidos
);

// ============================================================
// EXPORTAR ROUTER
// ============================================================

module.exports =
  router;