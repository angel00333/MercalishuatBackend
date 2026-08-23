const express = require('express');

const {
  registrar,
  login,
  perfil,
  editarPerfil,
} = require(
  '../controllers/auth.controller'
);

const {
  verificarToken,
} = require(
  '../middleware/auth.middleware'
);


const router = express.Router();


router.post(
  '/register',
  registrar
);


router.post(
  '/login',
  login
);


router.get(
  '/profile',
  verificarToken,
  perfil
);

router.put(
  '/profile',
  verificarToken,
  editarPerfil
);

module.exports = router;