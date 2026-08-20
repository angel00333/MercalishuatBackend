const express =
  require('express');

const {
  verificarToken,
} = require(
  '../middleware/auth.middleware'
);

const {
  permitirRoles,
} = require(
  '../middleware/rol.middleware'
);

const upload =
  require(
    '../middleware/upload.middleware'
  );

const {
  subirImagenProducto,
  listarImagenesProducto,
  establecerImagenPrincipal,
  eliminarImagenProducto,
} = require(
  '../controllers/imagen.controller'
);


const router =
  express.Router();


// ==========================================
// PÚBLICA
// ==========================================

router.get(
  '/producto/:productoId',
  listarImagenesProducto
);


// ==========================================
// EMPRENDEDOR
// ==========================================

router.post(
  '/producto/:productoId',

  verificarToken,

  permitirRoles(
    'emprendedor'
  ),

  upload.single('imagen'),

  subirImagenProducto
);


router.put(
  '/producto/:productoId/principal/:imagenId',

  verificarToken,

  permitirRoles(
    'emprendedor'
  ),

  establecerImagenPrincipal
);


router.delete(
  '/producto/:productoId/:imagenId',

  verificarToken,

  permitirRoles(
    'emprendedor'
  ),

  eliminarImagenProducto
);


module.exports = router;