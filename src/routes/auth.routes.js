const express = require('express');

const {
  registrar,
  login,
  perfil,
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


module.exports = router;