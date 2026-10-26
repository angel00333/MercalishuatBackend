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


module.exports = {
  crearNotificacion,
};