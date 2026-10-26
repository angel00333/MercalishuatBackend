const pool =
  require('../config/db');

const {
  obtenerMessaging,
} = require('../config/firebase');


// ============================================================
// ENVIAR PUSH A USUARIO
// ============================================================

async function enviarPushUsuario({
  usuarioId,
  titulo,
  mensaje,
  data = {},
}) {
  try {
    // ========================================================
    // BUSCAR INSTALACIONES ACTIVAS
    // ========================================================

    const resultado =
      await pool.query(
        `
        SELECT
          id,
          fid,
          plataforma

        FROM dispositivos_fcm

        WHERE
          usuario_id = $1
          AND activo = TRUE
          AND fid IS NOT NULL
          AND BTRIM(fid) <> ''
        `,
        [
          usuarioId,
        ]
      );

    if (
      resultado.rowCount === 0
    ) {
      console.log(
        `FCM: usuario ${usuarioId} sin instalaciones registradas`
      );

      return {
        success:
          true,

        enviados:
          0,
      };
    }

    const fids =
      resultado.rows
        .map(
          (
            fila
          ) =>
            fila.fid
              ?.toString()
              .trim()
        )
        .filter(
          Boolean
        );

    if (
      fids.length === 0
    ) {
      return {
        success:
          true,

        enviados:
          0,
      };
    }

    // ========================================================
    // DATA DE FCM DEBE SER STRING
    // ========================================================

    const dataString = {};

    for (
      const [
        key,
        value,
      ]
      of Object.entries(
        data
      )
    ) {
      if (
        value !== null &&
        value !== undefined
      ) {
        dataString[key] =
          String(
            value
          );
      }
    }

    const messaging =
      obtenerMessaging();

    // ========================================================
    // UN SOLO DISPOSITIVO
    // ========================================================

    if (
      fids.length === 1
    ) {
      const respuesta =
        await messaging.send({
          fid:
            fids[0],

          notification: {
            title:
              titulo,

            body:
              mensaje,
          },

          data:
            dataString,
        });

      console.log(
        'FCM PUSH ENVIADO:',
        respuesta
      );

      return {
        success:
          true,

        enviados:
          1,
      };
    }

    // ========================================================
    // VARIAS INSTALACIONES DEL MISMO USUARIO
    // ========================================================

    const respuesta =
      await messaging
        .sendEachForMulticast({
          fids,

          notification: {
            title:
              titulo,

            body:
              mensaje,
          },

          data:
            dataString,
        });

    console.log(
      'FCM MULTICAST:',
      {
        enviados:
          respuesta.successCount,

        fallidos:
          respuesta.failureCount,
      }
    );

    return {
      success:
        true,

      enviados:
        respuesta.successCount,

      fallidos:
        respuesta.failureCount,
    };

  } catch (
    error
  ) {
    console.error(
      'ERROR ENVIANDO PUSH FCM:',
      error
    );

    return {
      success:
        false,

      enviados:
        0,

      error:
        error.message,
    };
  }
}


module.exports = {
  enviarPushUsuario,
};