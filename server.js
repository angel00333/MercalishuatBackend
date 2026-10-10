require('dotenv').config();

const http =
  require('http');

const {
  Server,
} = require('socket.io');

const app =
  require('./src/app');

const pool =
  require('./src/config/db');

const configurarChatSocket =
  require(
    './src/sockets/chat.socket'
  );

const PORT =
  process.env.PORT || 3000;


// ============================================================
// SERVIDOR HTTP
//
// Antes:
// app.listen(...)
//
// Ahora:
// HTTP Server -> Express + Socket.IO
// ============================================================

const server =
  http.createServer(
    app
  );


// ============================================================
// SOCKET.IO
// ============================================================

const io =
  new Server(
    server,
    {
      cors: {
        origin: '*',

        methods: [
          'GET',
          'POST',
          'PUT',
          'DELETE',
        ],

        allowedHeaders: [
          'Authorization',
          'Content-Type',
        ],
      },
    }
  );


// ============================================================
// HACER SOCKET.IO ACCESIBLE DESDE EXPRESS
//
// En los controllers podremos usar:
//
// req.app.get('io')
//
// ============================================================

app.set(
  'io',
  io
);


// ============================================================
// CONFIGURAR CHAT SOCKET
// ============================================================

configurarChatSocket(
  io
);


// ============================================================
// INICIAR SERVIDOR
// ============================================================

async function iniciarServidor() {
  try {
    // ========================================================
    // PROBAR POSTGRESQL
    // ========================================================

    await pool.query(
      'SELECT NOW()'
    );

    console.log(
      'Base de datos conectada correctamente'
    );


    // ========================================================
    // INICIAR HTTP + SOCKET.IO
    // ========================================================

    server.listen(
      PORT,
      '0.0.0.0',
      () => {
        console.log(
          `Mercalishuat API ejecutándose en puerto ${PORT}`
        );

        console.log(
          'Socket.IO activo'
        );
      }
    );
  } catch (error) {
    console.error(
      'No fue posible conectar con PostgreSQL:',
      error
    );

    process.exit(1);
  }
}


// ============================================================
// CLOUDINARY
// ============================================================

console.log(
  'Cloudinary configurado:',
  !!process.env.CLOUDINARY_CLOUD_NAME,
  !!process.env.CLOUDINARY_API_KEY,
  !!process.env.CLOUDINARY_API_SECRET
);


// ============================================================
// EJECUTAR
// ============================================================

iniciarServidor();