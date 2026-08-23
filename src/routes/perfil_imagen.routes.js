const express =
  require('express');

const upload =
  require(
    '../middleware/upload.middleware'
  );

const {
  verificarToken,
} = require(
  '../middleware/auth.middleware'
);

const {
  subirFotoPerfil,
} = require(
  '../controllers/perfil_imagen.controller'
);

const router =
  express.Router();

router.post(
  '/foto',
  verificarToken,
  upload.single('imagen'),
  subirFotoPerfil
);

module.exports = router;