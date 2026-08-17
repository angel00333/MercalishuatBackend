const express = require('express');

const {
  crearProducto,
  listarMisProductos,
  listarProductosPorEmprendimiento,
  obtenerProductoPorId,
  editarProducto,
  eliminarProducto,
} = require('../controllers/producto.controller');

const {
  verificarToken,
} = require('../middleware/auth.middleware');

const {
  permitirRoles,
} = require('../middleware/rol.middleware');

const router = express.Router();


// =======================================
// PUBLICAS
// =======================================

router.get(
  '/detalle/:id',
  obtenerProductoPorId
);

router.get(
  '/emprendimiento/:emprendimientoId',
  listarProductosPorEmprendimiento
);


// =======================================
// EMPRENDEDOR
// =======================================

router.get(
  '/mis-productos',
  verificarToken,
  permitirRoles('emprendedor'),
  listarMisProductos
);

router.post(
  '/',
  verificarToken,
  permitirRoles('emprendedor'),
  crearProducto
);

router.put(
  '/:id',
  verificarToken,
  permitirRoles('emprendedor'),
  editarProducto
);

router.delete(
  '/:id',
  verificarToken,
  permitirRoles('emprendedor'),
  eliminarProducto
);


module.exports = router;