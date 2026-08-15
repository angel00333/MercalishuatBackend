const express = require('express');
const cors = require('cors');

const authRoutes =
  require('./routes/auth.routes');


const app = express();


// =======================================
// MIDDLEWARE
// =======================================

app.use(cors());

app.use(
  express.json()
);


// =======================================
// RUTA DE PRUEBA
// =======================================

app.get('/', (req, res) => {

  res.json({
    nombre: 'Mercalishuat API',
    estado: 'online',
    version: 'Beta 1',
  });
});


// =======================================
// RUTAS
// =======================================

app.use(
  '/api/auth',
  authRoutes
);


// =======================================
// RUTA NO ENCONTRADA
// =======================================

app.use((req, res) => {

  res.status(404).json({
    message:
      'Ruta no encontrada',
  });
});


module.exports = app;