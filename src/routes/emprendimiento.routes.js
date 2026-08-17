const express = require('express');

const {
  crearEmprendimiento,
  obtenerMiEmprendimiento,
  obtenerEmprendimientoPorId,
  listarEmprendimientos,
  editarEmprendimiento,
} = require('../controllers/emprendimiento.controller');

const {
  verificarToken,
} = require('../middleware/auth.middleware');

const {
  permitirRoles,
} = require('../middleware/rol.middleware');

const router = express.Router();


// Públicas
router.get(
  '/',
  listarEmprendimientos
);

router.get(
  '/detalle/:id',
  obtenerEmprendimientoPorId
);


// Emprendedor
router.get(
  '/mi-tienda',
  verificarToken,
  permitirRoles('emprendedor'),
  obtenerMiEmprendimiento
);

router.post(
  '/',
  verificarToken,
  permitirRoles('emprendedor'),
  crearEmprendimiento
);

router.put(
  '/',
  verificarToken,
  permitirRoles('emprendedor'),
  editarEmprendimiento
);


module.exports = router;