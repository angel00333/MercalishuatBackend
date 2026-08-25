const express =
  require('express');

const router =
  express.Router();

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
  obtenerFeed,
  obtenerPublicacion,
  crearPublicacion,
  misPublicaciones,
  editarPublicacion,
  eliminarPublicacion,
} = require(
  '../controllers/publicacion.controller'
);

const {
  darMeGusta,
  quitarMeGusta,
} = require(
  '../controllers/reaccion.controller'
);

const {
  guardarPublicacion,
  quitarGuardado,
  listarGuardados,
} = require(
  '../controllers/guardado.controller'
);

const {
  listarComentarios,
  crearComentario,
  eliminarComentario,
} = require(
  '../controllers/comentario.controller'
);

const {
  subirImagen,
  eliminarImagen,
} = require(
  '../controllers/publicacion_imagen.controller'
);


// IMPORTANTE:
// rutas específicas antes de /:id

router.get(
  '/feed',
  verificarToken,
  obtenerFeed
);

router.get(
  '/guardados',
  verificarToken,
  listarGuardados
);

router.get(
  '/mis-publicaciones',
  verificarToken,
  permitirRoles('emprendedor'),
  misPublicaciones
);

router.post(
  '/',
  verificarToken,
  permitirRoles('emprendedor'),
  crearPublicacion
);

router.get(
  '/:id',
  verificarToken,
  obtenerPublicacion
);

router.put(
  '/:id',
  verificarToken,
  permitirRoles('emprendedor'),
  editarPublicacion
);

router.delete(
  '/:id',
  verificarToken,
  permitirRoles('emprendedor'),
  eliminarPublicacion
);


// Likes

router.post(
  '/:id/me-gusta',
  verificarToken,
  darMeGusta
);

router.delete(
  '/:id/me-gusta',
  verificarToken,
  quitarMeGusta
);


// Guardados

router.post(
  '/:id/guardar',
  verificarToken,
  guardarPublicacion
);

router.delete(
  '/:id/guardar',
  verificarToken,
  quitarGuardado
);


// Comentarios

router.get(
  '/:id/comentarios',
  verificarToken,
  listarComentarios
);

router.post(
  '/:id/comentarios',
  verificarToken,
  crearComentario
);

router.delete(
  '/comentarios/:comentarioId',
  verificarToken,
  eliminarComentario
);


// Imágenes

router.post(
  '/:id/imagenes',
  verificarToken,
  permitirRoles('emprendedor'),
  upload.single('imagen'),
  subirImagen
);

router.delete(
  '/:id/imagenes/:imagenId',
  verificarToken,
  permitirRoles('emprendedor'),
  eliminarImagen
);


module.exports = router;