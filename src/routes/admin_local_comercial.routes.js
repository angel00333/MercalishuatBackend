const express =
  require('express');

const authMiddleware =
  require(
    '../middleware/auth.middleware',
  );

// IMPORTANTE:
// Cambia rol.middleware por el nombre REAL del archivo
// donde ya tienes permitirRoles.
const {
  permitirRoles,
} = require(
  '../middleware/rol.middleware',
);

const adminLocalController =
  require(
    '../controllers/admin_local_comercial.controller',
  );

const router =
  express.Router();

// ============================================================
// AUTENTICACIÓN
// ============================================================

router.use(
  authMiddleware.verificarToken,
);

// ============================================================
// SOLO ADMINISTRADOR
// ============================================================

router.use(
  permitirRoles(
    'administrador',
  ),
);

// ============================================================
// LISTAR
// GET /api/admin/locales
// ============================================================

router.get(
  '/',
  adminLocalController.listar,
);

// ============================================================
// DETALLE
// GET /api/admin/locales/:id
// ============================================================

router.get(
  '/:id',
  adminLocalController.obtener,
);

// ============================================================
// OCULTAR / REACTIVAR
// PATCH /api/admin/locales/:id/estado
// ============================================================

router.patch(
  '/:id/estado',
  adminLocalController.cambiarEstado,
);

// ============================================================
// DISPONIBILIDAD
// PATCH /api/admin/locales/:id/disponibilidad
// ============================================================

router.patch(
  '/:id/disponibilidad',
  adminLocalController
      .cambiarDisponibilidad,
);

module.exports =
  router;