const express =
  require('express');

const adminMiddleware =
  require(
    '../middleware/admin.middleware'
  );

const adminController =
  require(
    '../controllers/admin.controller'
  );

const reporteController =
  require(
    '../controllers/reporte.controller'
  );

const router =
  express.Router();

// ============================================================
// TODAS LAS RUTAS SON SOLO ADMIN
// ============================================================

router.use(
  adminMiddleware
);

// ============================================================
// DASHBOARD
// ============================================================

router.get(
  '/dashboard',
  adminController.dashboard
);

// ============================================================
// USUARIOS
// ============================================================

router.get(
  '/usuarios',
  adminController.listarUsuarios
);

router.get(
  '/usuarios/:id',
  adminController.obtenerUsuario
);

router.patch(
  '/usuarios/:id/estado',
  adminController.cambiarEstadoUsuario
);

// ============================================================
// REPORTES
// ============================================================

router.get(
  '/reportes',
  reporteController.listarAdmin
);

router.patch(
  '/reportes/:id/resolver',
  reporteController.resolver
);

// ============================================================
// MODERACIÓN DE PUBLICACIONES
// ============================================================

router.patch(
  '/moderacion/publicaciones/:id/estado',
  reporteController
      .cambiarEstadoPublicacion
);

// ============================================================
// MODERACIÓN DE COMENTARIOS
// ============================================================

router.patch(
  '/moderacion/comentarios/:id/estado',
  reporteController
      .cambiarEstadoComentario
);

module.exports =
  router;