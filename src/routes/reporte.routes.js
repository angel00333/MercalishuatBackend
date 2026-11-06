const express =
  require('express');

const authMiddleware =
  require(
    '../middleware/auth.middleware'
  );

const reporteController =
  require(
    '../controllers/reporte.controller'
  );

const router =
  express.Router();

// ============================================================
// TODO REPORTE REQUIERE SESIÓN
// ============================================================

router.use(
  authMiddleware
);

// ============================================================
// CREAR REPORTE
// ============================================================

router.post(
  '/',
  reporteController.crear
);

module.exports =
  router;