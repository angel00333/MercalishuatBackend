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

const localImagenController =
  require(
    '../controllers/local_comercial_imagen.controller'
  );

const {
  subirImagenesLocal,
} = require(
  '../middleware/local_imagen.middleware'
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
// LISTAR
// ============================================================

router.get(
  '/',
  localComercialController.listar
);


// ============================================================
// MIS LOCALES
// ============================================================

router.get(
  '/mios',
  localComercialController.listarMios
);


// ============================================================
// SUBIR IMÁGENES
// ============================================================

router.post(
  '/:id/imagenes',
  subirImagenesLocal,
  localImagenController.subir
);


// ============================================================
// ESTABLECER PRINCIPAL
// ============================================================

router.patch(
  '/:id/imagenes/:imagenId/principal',
  localImagenController
      .establecerPrincipal
);


// ============================================================
// ELIMINAR IMAGEN
// ============================================================

router.delete(
  '/:id/imagenes/:imagenId',
  localImagenController.eliminar
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
// ELIMINAR LOCAL
// ============================================================

router.delete(
  '/:id',
  localComercialController.eliminar
);


module.exports =
  router;