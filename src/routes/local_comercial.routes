const express =
  require('express');

const authMiddleware =
  require(
    '../middleware/auth.middleware'
  );

const localComercialController =
  require(
    '../controllers/local_comercial.controller'
  );


const router =
  express.Router();


// ============================================================
// AUTENTICACIÓN
// ============================================================

router.use(
  authMiddleware.verificarToken
);


// ============================================================
// LISTAR TODOS
// ============================================================

router.get(
  '/',
  localComercialController.listar
);


// ============================================================
// MIS LOCALES
// IMPORTANTE: DEBE IR ANTES DE /:id
// ============================================================

router.get(
  '/mios',
  localComercialController.listarMios
);


// ============================================================
// DETALLE
// ============================================================

router.get(
  '/:id',
  localComercialController.obtener
);


// ============================================================
// CREAR
// ============================================================

router.post(
  '/',
  localComercialController.crear
);


// ============================================================
// ACTUALIZAR
// ============================================================

router.patch(
  '/:id',
  localComercialController.actualizar
);


// ============================================================
// DISPONIBILIDAD
// ============================================================

router.patch(
  '/:id/disponibilidad',
  localComercialController
      .cambiarDisponibilidad
);


// ============================================================
// ELIMINAR
// ============================================================

router.delete(
  '/:id',
  localComercialController.eliminar
);


module.exports =
  router;