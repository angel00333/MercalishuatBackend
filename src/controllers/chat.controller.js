// ============================================================
// LISTAR CONVERSACIONES
//
// GET /api/chat/conversaciones
// ============================================================

exports.listarConversaciones =
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
            success: false,

            message:
              'Usuario no autenticado',
          });
      }

      const resultado =
        await pool.query(
          `
          SELECT
            c.id,
            c.created_at,
            c.updated_at,

            -- =================================================
            -- OTRO USUARIO / PROPIETARIO
            -- =================================================

            otro.usuario_id
              AS otro_usuario_id,

            u.nombre,

            '' AS apellido,

            u.correo,

            u.foto_perfil_url
              AS imagen_usuario_url,

            -- =================================================
            -- EMPRENDIMIENTO DEL OTRO USUARIO
            -- =================================================

            e.id
              AS emprendimiento_id,

            e.nombre
              AS emprendimiento_nombre,

            e.imagen_url
              AS emprendimiento_imagen_url,

            -- =================================================
            -- ÚLTIMO MENSAJE
            -- =================================================

            (
              SELECT
                m.contenido

              FROM mensajes m

              WHERE
                m.conversacion_id =
                  c.id

              ORDER BY
                m.created_at DESC,
                m.id DESC

              LIMIT 1
            )
              AS ultimo_mensaje,

            -- =================================================
            -- FECHA ÚLTIMO MENSAJE
            -- =================================================

            (
              SELECT
                m.created_at

              FROM mensajes m

              WHERE
                m.conversacion_id =
                  c.id

              ORDER BY
                m.created_at DESC,
                m.id DESC

              LIMIT 1
            )
              AS ultimo_mensaje_fecha,

            -- =================================================
            -- NO LEÍDOS
            -- =================================================

            (
              SELECT
                COUNT(*)

              FROM mensajes m

              WHERE
                m.conversacion_id =
                  c.id

                AND
                  m.remitente_id <>
                    $1

                AND
                  m.leido =
                    FALSE
            )::INTEGER
              AS mensajes_no_leidos

          FROM conversaciones c

          -- ===================================================
          // YO
          -- ===================================================

          JOIN participantes_conversacion yo
            ON yo.conversacion_id =
              c.id

            AND yo.usuario_id =
              $1

          -- ===================================================
          -- OTRO PARTICIPANTE
          -- ===================================================

          JOIN participantes_conversacion otro
            ON otro.conversacion_id =
              c.id

            AND otro.usuario_id <>
              $1

          JOIN usuarios u
            ON u.id =
              otro.usuario_id

          -- ===================================================
          -- TIENDA DEL OTRO USUARIO
          -- ===================================================

          LEFT JOIN emprendimientos e
            ON e.usuario_id =
              otro.usuario_id

            AND e.activo =
              TRUE

          -- ===================================================
          -- ORDEN
          -- ===================================================

          ORDER BY
            COALESCE(
              (
                SELECT
                  MAX(
                    m.created_at
                  )

                FROM mensajes m

                WHERE
                  m.conversacion_id =
                    c.id
              ),

              c.updated_at
            ) DESC
          `,
          [
            usuarioId,
          ]
        );

      return res.json({
        success: true,

        conversaciones:
          resultado.rows,
      });
    } catch (
      error
    ) {
      console.error(
        'ERROR LISTANDO CONVERSACIONES:',
        error
      );

      return res
        .status(500)
        .json({
          success: false,

          message:
            'No se pudieron cargar las conversaciones',

          error:
            error.message,
        });
    }
  };