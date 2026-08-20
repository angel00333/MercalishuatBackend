const express = require('express');
const cors = require('cors');

const authRoutes =
  require('./routes/auth.routes');

const emprendimientoRoutes =
  require('./routes/emprendimiento.routes');

const categoriaRoutes =
  require('./routes/categoria.routes');

const productoRoutes =
  require('./routes/producto.routes');

const imagenRoutes =
  require('./routes/imagen.routes');


const app = express();


// =======================================
// MIDDLEWARES
// =======================================

app.use(cors());

app.use(express.json());


// =======================================
// INICIO
// =======================================

app.get('/', (req, res) => {
  res.json({
    nombre: 'Mercalishuat API',
    estado: 'online',
    version: 'Beta 2',
  });
});


// =======================================
// RUTAS
// =======================================

app.use(
  '/api/auth',
  authRoutes
);

app.use(
  '/api/emprendimientos',
  emprendimientoRoutes
);

app.use(
  '/api/categorias',
  categoriaRoutes
);

app.use(
  '/api/productos',
  productoRoutes
);

app.use(
  '/api/imagenes',
  imagenRoutes
);

// =======================================
// 404 Imagenes
// =======================================
app.use(
  (error, req, res, next) => {

    if (
      error.code ===
      'LIMIT_FILE_SIZE'
    ) {

      return res.status(400).json({
        message:
          'La imagen no puede superar los 5 MB',
      });
    }


    if (error.message) {

      return res.status(400).json({
        message:
          error.message,
      });
    }


    next(error);
  }
);
// =======================================
// 404
// =======================================

app.use((req, res) => {
  res.status(404).json({
    message: 'Ruta no encontrada',
  });
});


module.exports = app;