const express = require('express');

const {
  listarCategorias,
  crearCategoria,
} = require('../controllers/categoria.controller');

const {
  verificarToken,
} = require('../middleware/auth.middleware');

const {
  permitirRoles,
} = require('../middleware/rol.middleware');

const router = express.Router();


// Pública
router.get(
  '/',
  listarCategorias
);


// Administrador
router.post(
  '/',
  verificarToken,
  permitirRoles('administrador'),
  crearCategoria
);


module.exports = router;