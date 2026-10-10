const jwt =
  require('jsonwebtoken');


// ============================================================
// OBTENER TOKEN
// ============================================================

function obtenerToken(
  socket
) {
  // ==========================================================
  // FLUTTER:
  //
  // socket.auth = {
  //   token: '...'
  // }
  // ==========================================================

  const tokenAuth =
    socket.handshake
      ?.auth
      ?.token;

  if (
    tokenAuth &&
    typeof tokenAuth ===
      'string'
  ) {
    return tokenAuth;
  }


  // ==========================================================
  // ALTERNATIVA:
  //
  // Authorization: Bearer TOKEN
  // ==========================================================

  const authorization =
    socket.handshake
      ?.headers
      ?.authorization;

  if (
    !authorization ||
    typeof authorization !==
      'string'
  ) {
    return null;
  }

  const partes =
    authorization.split(
      ' '
    );

  if (
    partes.length !== 2 ||
    partes[0] !==
      'Bearer'
  ) {
    return null;
  }

  return partes[1];
}


// ============================================================
// CONFIGURAR SOCKET CHAT
// ============================================================

module.exports =
  function configurarChatSocket(
    io
  ) {
    // ========================================================
    // AUTENTICACIÓN SOCKET
    // ========================================================

    io.use(
      (
        socket,
        next
      ) => {
        try {
          const token =
            obtenerToken(
              socket
            );

          if (!token) {
            return next(
              new Error(
                'Token no proporcionado'
              )
            );
          }

          const decoded =
            jwt.verify(
              token,
              process.env.JWT_SECRET
            );

          if (
            !decoded ||
            !decoded.id
          ) {
            return next(
              new Error(
                'Usuario no válido'
              )
            );
          }

          // Guardamos usuario
          // dentro del socket.

          socket.usuario =
            decoded;

          next();
        } catch (error) {
          console.error(
            'ERROR AUTENTICANDO SOCKET:',
            error.message
          );

          next(
            new Error(
              'Token inválido o expirado'
            )
          );
        }
      }
    );


    // ========================================================
    // CONEXIÓN
    // ========================================================

    io.on(
      'connection',
      (
        socket
      ) => {
        const usuarioId =
          Number(
            socket.usuario.id
          );

        console.log(
          `Socket conectado - usuario ${usuarioId}`
        );


        // ====================================================
        // SALA PERSONAL DEL USUARIO
        //
        // Cada usuario tendrá:
        //
        // usuario:1
        // usuario:2
        // usuario:3
        //
        // ====================================================

        socket.join(
          `usuario:${usuarioId}`
        );


        // ====================================================
        // ENTRAR A UNA CONVERSACIÓN
        // ====================================================

        socket.on(
          'entrar_conversacion',
          (
            conversacionId
          ) => {
            const id =
              Number(
                conversacionId
              );

            if (
              !Number.isInteger(
                id
              )
            ) {
              return;
            }

            socket.join(
              `conversacion:${id}`
            );

            console.log(
              `Usuario ${usuarioId} entró a conversación ${id}`
            );
          }
        );


        // ====================================================
        // SALIR DE UNA CONVERSACIÓN
        // ====================================================

        socket.on(
          'salir_conversacion',
          (
            conversacionId
          ) => {
            const id =
              Number(
                conversacionId
              );

            if (
              !Number.isInteger(
                id
              )
            ) {
              return;
            }

            socket.leave(
              `conversacion:${id}`
            );

            console.log(
              `Usuario ${usuarioId} salió de conversación ${id}`
            );
          }
        );


        // ====================================================
        // DESCONECTADO
        // ====================================================

        socket.on(
          'disconnect',
          (
            motivo
          ) => {
            console.log(
              `Socket desconectado - usuario ${usuarioId} - ${motivo}`
            );
          }
        );
      }
    );
  };