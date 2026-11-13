const pool =
  require('../config/db');

const {
  enviarPushUsuario,
} = require(
  './firebase_push.service'
);


// ============================================================
// CREAR NOTIFICACIÓN
// ============================================================

async function crearNotificacion({
  usuarioId,
  tipo,
  titulo,
  mensaje,
  referenciaId = null,
  referenciaTipo = null,
  io = null,
}) {
  // ==========================================================
  // GUARDAR EN POSTGRESQL
  // ==========================================================

  const resultado =
    await pool.query(
      `
      INSERT INTO notificaciones (
        usuario_id,
        tipo,
        titulo,
        mensaje,
        referencia_id,
        referencia_tipo,
        leida,
        created_at
      )

      VALUES (
        $1,
        $2,
        $3,
        $4,
        $5,
        $6,
        FALSE,
        NOW()
      )

      RETURNING
        id,
        usuario_id,
        tipo,
        titulo,
        mensaje,
        referencia_id,
        referencia_tipo,
        leida,
        created_at
      `,
      [
        usuarioId,
        tipo,
        titulo,
        mensaje,
        referenciaId,
        referenciaTipo,
      ]
    );

  const notificacion =
    resultado.rows[0];

  // ==========================================================
  // SOCKET.IO
  // ==========================================================

  if (io) {
    io.to(
      `usuario:${usuarioId}`
    ).emit(
      'nueva_notificacion',
      notificacion
    );

    io.to(
      `usuario:${usuarioId}`
    ).emit(
      'contador_notificaciones',
      {
        incrementar:
          1,
      }
    );
  }

  // ==========================================================
  // FIREBASE PUSH
  //
  // Si Firebase falla, la notificación interna sigue existiendo.
  // ==========================================================

  try {
    await enviarPushUsuario({
      usuarioId,

      titulo,

      mensaje,

      data: {
        tipo,

        notificacion_id:
          notificacion.id,

        referencia_id:
          referenciaId,

        referencia_tipo:
          referenciaTipo,
      },
    });

  } catch (
    error
  ) {
    console.error(
      'ERROR PUSH DE NOTIFICACIÓN:',
      error
    );
  }

  return notificacion;
}




// ============================================================
// CREAR NOTIFICACIONES PARA TODOS LOS USUARIOS
//
// - Permite excluir al usuario que originó el evento.
// - Reutiliza crearNotificacion(), por lo que conserva:
//   PostgreSQL + Socket.IO + Firebase Push.
// - Un fallo individual no cancela el resto de notificaciones.
// ============================================================

async function crearNotificacionesParaTodos({
  excluirUsuarioId = null,
  tipo,
  titulo,
  mensaje,
  referenciaId = null,
  referenciaTipo = null,
  io = null,
}) {
  let consulta = `
    SELECT id
    FROM usuarios
  `;

  const parametros = [];

  if (
    excluirUsuarioId !== null &&
    excluirUsuarioId !== undefined
  ) {
    consulta += `
      WHERE id <> $1
    `;

    parametros.push(
      excluirUsuarioId
    );
  }

  consulta += `
    ORDER BY id ASC
  `;

  const resultadoUsuarios =
    await pool.query(
      consulta,
      parametros
    );

  const usuarios =
    resultadoUsuarios.rows;

  if (usuarios.length === 0) {
    return {
      total: 0,
      creadas: 0,
      fallidas: 0,
    };
  }

  const resultados =
    await Promise.allSettled(
      usuarios.map(
        (usuario) =>
          crearNotificacion({
            usuarioId:
              usuario.id,

            tipo,

            titulo,

            mensaje,

            referenciaId,

            referenciaTipo,

            io,
          })
      )
    );

  let creadas = 0;
  let fallidas = 0;

  for (
    const resultado
    of resultados
  ) {
    if (
      resultado.status ===
      'fulfilled'
    ) {
      creadas++;
    } else {
      fallidas++;

      console.error(
        'ERROR CREANDO NOTIFICACIÓN MASIVA:',
        resultado.reason
      );
    }
  }

  return {
    total:
      usuarios.length,

    creadas,

    fallidas,
  };
}

module.exports = {
  crearNotificacion,
  crearNotificacionesParaTodos,
};