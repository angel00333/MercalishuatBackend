const express = require('express');

const authMiddleware = require('../middleware/auth.middleware');

// USA AQUÍ EL MISMO MIDDLEWARE QUE YA TIENES
const {
  permitirRoles,
} = require('../middleware/rol.middleware');

const localComercialController =
  require('../controllers/local_comercial.controller');

const localImagenController =
  require('../controllers/local_comercial_imagen.controller');

const {
  subirImagenesLocal,
} = require('../middleware/local_imagen.middleware');

const router = express.Router();

// ============================================================
// TODAS LAS RUTAS REQUIEREN AUTENTICACIÓN
// ============================================================

router.use(authMiddleware.verificarToken);

// ============================================================
// CATÁLOGO DE LOCALES
//
// Usuario y Emprendedor pueden consultar.
// No se aplica permitirRoles porque ambos pueden entrar.
// ============================================================

router.get(
  '/',
  localComercialController.listar,
);

// ============================================================
// MIS LOCALES
//
// Exclusivo para Emprendedor.
//
// IMPORTANTE:
// Esta ruta debe ir ANTES de /:id.
// ============================================================

router.get(
  '/mios',
  permitirRoles('emprendedor'),
  localComercialController.listarMios,
);

// ============================================================
// CREAR LOCAL
//
// Exclusivo para Emprendedor.
// ============================================================

router.post(
  '/',
  permitirRoles('emprendedor'),
  localComercialController.crear,
);

// ============================================================
// SUBIR IMÁGENES
//
// Exclusivo para Emprendedor.
// El controlador también valida que el local le pertenezca.
// ============================================================

router.post(
  '/:id/imagenes',
  permitirRoles('emprendedor'),
  subirImagenesLocal,
  localImagenController.subir,
);

// ============================================================
// ESTABLECER IMAGEN PRINCIPAL
// ============================================================

router.patch(
  '/:id/imagenes/:imagenId/principal',
  permitirRoles('emprendedor'),
  localImagenController.establecerPrincipal,
);

// ============================================================
// ELIMINAR IMAGEN
// ============================================================

router.delete(
  '/:id/imagenes/:imagenId',
  permitirRoles('emprendedor'),
  localImagenController.eliminar,
);

// ============================================================
// CAMBIAR DISPONIBILIDAD
// ============================================================

router.patch(
  '/:id/disponibilidad',
  permitirRoles('emprendedor'),
  localComercialController.cambiarDisponibilidad,
);

// ============================================================
// ACTUALIZAR LOCAL
// ============================================================

router.patch(
  '/:id',
  permitirRoles('emprendedor'),
  localComercialController.actualizar,
);

// ============================================================
// ELIMINAR LOCAL
// ============================================================

router.delete(
  '/:id',
  permitirRoles('emprendedor'),
  localComercialController.eliminar,
);

// ============================================================
// VER DETALLE
//
// Usuario y Emprendedor.
// Debe ir después de /mios.
// ============================================================

router.get(
  '/:id',
  localComercialController.obtener,
);

module.exports = router;