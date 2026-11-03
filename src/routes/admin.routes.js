const express =
  require('express');

const adminMiddleware =
  require('../middleware/admin.middleware');

const adminController =
  require('../controllers/admin.controller');

const router =
  express.Router();

// ============================================================
// TODAS LAS RUTAS DE ESTE ARCHIVO SON SOLO ADMIN
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

module.exports =
  router;