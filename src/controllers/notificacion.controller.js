const pool =
  require('../config/db');


// =======================================
// OBTENER USUARIO
// =======================================

function obtenerUsuarioId(
  req
) {
  return (
    req.usuario?.id ||
    req.user?.id ||
    null
  );
}


// =======================================
// LISTAR NOTIFICACIONES
// =======================================

exports.listarNotificaciones =
  async (
    req,
    res
  ) => {
    try {
      const usuarioId =
        obtenerUsuarioId(
          req
        );

      if (
        !usuarioId
      ) {
        return res
          .status(401)
          .json({
            success:
              false,

            message:
              'Usuario no autenticado',
          });
      }

      const resultado =
        await pool.query(
          `
          SELECT
            id,
            usuario_id,
            tipo,
            titulo,
            mensaje,
            referencia_id,
            referencia_tipo,
            leida,
            created_at

          FROM notificaciones

          WHERE usuario_id = $1

          ORDER BY
            created_at DESC,
            id DESC

          LIMIT 100
          `,
          [
            usuarioId,
          ]
        );

      return res.json({
        success:
          true,

        notificaciones:
          resultado.rows,
      });

    } catch (
      error
    ) {
      console.error(
        'ERROR LISTANDO NOTIFICACIONES:',
        error
      );

      return res
        .status(500)
        .json({
          success:
            false,

          message:
            'No se pudieron cargar las notificaciones',

          error:
            error.message,
        });
    }
  };


// =======================================
// CONTAR NO LEÍDAS
// =======================================

exports.contarNoLeidas =
  async (
    req,
    res
  ) => {
    try {
      const usuarioId =
        obtenerUsuarioId(
          req
        );

      if (
        !usuarioId
      ) {
        return res
          .status(401)
          .json({
            success:
              false,

            message:
              'Usuario no autenticado',
          });
      }

      const resultado =
        await pool.query(
          `
          SELECT
            COUNT(*)::INTEGER
              AS total

          FROM notificaciones

          WHERE
            usuario_id = $1
            AND leida = FALSE
          `,
          [
            usuarioId,
          ]
        );

      return res.json({
        success:
          true,

        total:
          resultado
            .rows[0]
            .total,
      });

    } catch (
      error
    ) {
      console.error(
        'ERROR CONTANDO NOTIFICACIONES:',
        error
      );

      return res
        .status(500)
        .json({
          success:
            false,

          message:
            'No se pudo obtener el contador',

          error:
            error.message,
        });
    }
  };


// =======================================
// MARCAR UNA COMO LEÍDA
// =======================================

exports.marcarComoLeida =
  async (
    req,
    res
  ) => {
    try {
      const usuarioId =
        obtenerUsuarioId(
          req
        );

      const id =
        Number(
          req.params.id
        );

      if (
        !usuarioId
      ) {
        return res
          .status(401)
          .json({
            success:
              false,

            message:
              'Usuario no autenticado',
          });
      }

      if (
        !Number.isInteger(
          id
        )
      ) {
        return res
          .status(400)
          .json({
            success:
              false,

            message:
              'ID inválido',
          });
      }

      const resultado =
        await pool.query(
          `
          UPDATE notificaciones

          SET
            leida = TRUE

          WHERE
            id = $1
            AND usuario_id = $2

          RETURNING id
          `,
          [
            id,
            usuarioId,
          ]
        );

      if (
        resultado.rowCount ===
        0
      ) {
        return res
          .status(404)
          .json({
            success:
              false,

            message:
              'Notificación no encontrada',
          });
      }

      return res.json({
        success:
          true,
      });

    } catch (
      error
    ) {
      console.error(
        'ERROR MARCANDO NOTIFICACIÓN:',
        error
      );

      return res
        .status(500)
        .json({
          success:
            false,

          message:
            'No se pudo actualizar la notificación',

          error:
            error.message,
        });
    }
  };


// =======================================
// MARCAR TODAS COMO LEÍDAS
// =======================================

exports.marcarTodasComoLeidas =
  async (
    req,
    res
  ) => {
    try {
      const usuarioId =
        obtenerUsuarioId(
          req
        );

      if (
        !usuarioId
      ) {
        return res
          .status(401)
          .json({
            success:
              false,

            message:
              'Usuario no autenticado',
          });
      }

      const resultado =
        await pool.query(
          `
          UPDATE notificaciones

          SET
            leida = TRUE

          WHERE
            usuario_id = $1
            AND leida = FALSE
          `,
          [
            usuarioId,
          ]
        );

      return res.json({
        success:
          true,

        actualizadas:
          resultado.rowCount,
      });

    } catch (
      error
    ) {
      console.error(
        'ERROR MARCANDO TODAS COMO LEÍDAS:',
        error
      );

      return res
        .status(500)
        .json({
          success:
            false,

          message:
            'No se pudieron actualizar las notificaciones',

          error:
            error.message,
        });
    }
  };


// =======================================
// REGISTRAR TOKEN FCM
// =======================================

exports.registrarTokenFcm =
  async (
    req,
    res
  ) => {
    try {
      const usuarioId =
        obtenerUsuarioId(
          req
        );

      if (!usuarioId) {
        return res
          .status(401)
          .json({
            success:
              false,

            message:
              'Usuario no autenticado',
          });
      }

      const fid =
        req.body.fid
          ?.toString()
          .trim();

      const plataforma =
        req.body.plataforma
          ?.toString()
          .trim() ||
        'web';

      if (!fid) {
        return res
          .status(400)
          .json({
            success:
              false,

            message:
              'Falta el FID',
          });
      }

      await pool.query(
        `
        INSERT INTO dispositivos_fcm (
          usuario_id,
          fid,
          plataforma,
          activo,
          updated_at
        )

        VALUES (
          $1,
          $2,
          $3,
          TRUE,
          NOW()
        )

        ON CONFLICT (fid)

        DO UPDATE SET
          usuario_id =
            EXCLUDED.usuario_id,

          plataforma =
            EXCLUDED.plataforma,

          activo =
            TRUE,

          updated_at =
            NOW()
        `,
        [
          usuarioId,
          fid,
          plataforma,
        ]
      );

      return res.json({
        success:
          true,

        message:
          'Dispositivo registrado',
      });

    } catch (
      error
    ) {
      console.error(
        'ERROR REGISTRANDO FID:',
        error
      );

      return res
        .status(500)
        .json({
          success:
            false,

          message:
            'No se pudo registrar el dispositivo',

          error:
            error.message,
        });
    }
  };
// =======================================
// ELIMINAR / DESACTIVAR TOKEN FCM
// =======================================

exports.eliminarTokenFcm =
  async (
    req,
    res
  ) => {
    try {
      const usuarioId =
        obtenerUsuarioId(
          req
        );

      const fid =
        req.body.fid
          ?.toString()
          .trim();

      if (
        !usuarioId ||
        !fid
      ) {
        return res
          .status(400)
          .json({
            success:
              false,
          });
      }

      await pool.query(
        `
        UPDATE dispositivos_fcm

        SET
          activo =
            FALSE,

          updated_at =
            NOW()

        WHERE
          usuario_id =
            $1

          AND
            fid =
              $2
        `,
        [
          usuarioId,
          fid,
        ]
      );

      return res.json({
        success:
          true,
      });

    } catch (
      error
    ) {
      console.error(
        'ERROR DESACTIVANDO FID:',
        error
      );

      return res
        .status(500)
        .json({
          success:
            false,
        });
    }
  };