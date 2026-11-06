const express =
  require('express');

const {
  verificarToken
} =
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
// TODAS LAS RUTAS DE REPORTES REQUIEREN SESIÓN
// ============================================================

router.use(
  verificarToken
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