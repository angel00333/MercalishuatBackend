const pool = require('../config/db');

// ============================================================
// UTILIDAD
// ============================================================

function obtenerUsuarioId(req) {
  return (
    req.usuario?.id ||
    req.usuario?.id_usuario ||
    req.user?.id ||
    req.user?.id_usuario ||
    null
  );
}

// ============================================================
// CREAR O BUSCAR CONVERSACIÓN
//
// POST /api/chat/conversacion
//
// body:
// {
//   "usuario_destino_id": 5
// }
// ============================================================

exports.crearConversacion = async (
  req,
  res
) => {
  const client =
    await pool.connect();

  try {
    const usuarioId =
      obtenerUsuarioId(req);

    const {
      usuario_destino_id,
    } = req.body;

    // ========================================================
    // VALIDAR USUARIO AUTENTICADO
    // ========================================================

    if (!usuarioId) {
      return res.status(401).json({
        success: false,
        message:
          'Usuario no autenticado',
      });
    }

    // ========================================================
    // VALIDAR DESTINATARIO
    // ========================================================

    if (!usuario_destino_id) {
      return res.status(400).json({
        success: false,
        message:
          'Falta usuario_destino_id',
      });
    }

    const destinoId =
      Number(
        usuario_destino_id,
      );

    if (
      !Number.isInteger(
        destinoId,
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          'ID de usuario destinatario inválido',
      });
    }

    // ========================================================
    // EVITAR CHAT CONSIGO MISMO
    // ========================================================

    if (
      Number(usuarioId) ===
      destinoId
    ) {
      return res.status(400).json({
        success: false,
        message:
          'No puedes iniciar una conversación contigo mismo',
      });
    }

    // ========================================================
    // VERIFICAR QUE EL DESTINATARIO EXISTA
    // ========================================================

    const usuarioExiste =
      await client.query(
        `
          SELECT
            id
          FROM usuarios
          WHERE id = $1
          LIMIT 1
        `,
        [
          destinoId,
        ],
      );

    if (
      usuarioExiste.rowCount ===
      0
    ) {
      return res.status(404).json({
        success: false,
        message:
          'El usuario destinatario no existe',
      });
    }

    // ========================================================
    // BUSCAR SI YA EXISTE UNA CONVERSACIÓN ENTRE LOS DOS
    // ========================================================

    const conversacionExistente =
      await client.query(
        `
          SELECT
            c.id
          FROM conversaciones c

          JOIN participantes_conversacion p1
            ON p1.conversacion_id = c.id
            AND p1.usuario_id = $1

          JOIN participantes_conversacion p2
            ON p2.conversacion_id = c.id
            AND p2.usuario_id = $2

          WHERE (
            SELECT COUNT(*)
            FROM participantes_conversacion pc
            WHERE
              pc.conversacion_id = c.id
          ) = 2

          LIMIT 1
        `,
        [
          usuarioId,
          destinoId,
        ],
      );

    // ========================================================
    // SI YA EXISTE, DEVOLVERLA
    // ========================================================

    if (
      conversacionExistente
          .rowCount >
      0
    ) {
      return res.status(200).json({
        success: true,
        creada: false,
        conversacion_id:
          conversacionExistente
            .rows[0]
            .id,
      });
    }

    // ========================================================
    // CREAR NUEVA CONVERSACIÓN
    // ========================================================

    await client.query(
      'BEGIN',
    );

    const nuevaConversacion =
      await client.query(
        `
          INSERT INTO conversaciones (
            created_at,
            updated_at
          )
          VALUES (
            NOW(),
            NOW()
          )
          RETURNING id
        `,
      );

    const conversacionId =
      nuevaConversacion
        .rows[0]
        .id;

    // ========================================================
    // AGREGAR PARTICIPANTES
    // ========================================================

    await client.query(
      `
        INSERT INTO participantes_conversacion (
          conversacion_id,
          usuario_id
        )
        VALUES
          ($1, $2),
          ($1, $3)
      `,
      [
        conversacionId,
        usuarioId,
        destinoId,
      ],
    );

    await client.query(
      'COMMIT',
    );

    return res.status(201).json({
      success: true,
      creada: true,
      conversacion_id:
        conversacionId,
    });
  } catch (error) {
    try {
      await client.query(
        'ROLLBACK',
      );
    } catch (_) {}

    console.error(
      'ERROR CREANDO CONVERSACIÓN:',
      error,
    );

    return res.status(500).json({
      success: false,
      message:
        'No se pudo crear la conversación',
      error:
        error.message,
    });
  } finally {
    client.release();
  }
};

// ============================================================
// LISTAR MIS CONVERSACIONES
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
        obtenerUsuarioId(req);

      if (!usuarioId) {
        return res.status(401).json({
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

              otro.usuario_id
                AS otro_usuario_id,

              u.nombre,

              '' AS apellido,

              u.correo,

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

              (
                SELECT COUNT(*)
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

            JOIN participantes_conversacion yo
              ON yo.conversacion_id =
                 c.id
              AND yo.usuario_id =
                  $1

            JOIN participantes_conversacion otro
              ON otro.conversacion_id =
                 c.id
              AND otro.usuario_id <>
                  $1

            JOIN usuarios u
              ON u.id =
                 otro.usuario_id

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
          ],
        );

      return res.json({
        success: true,
        conversaciones:
          resultado.rows,
      });
    } catch (error) {
      console.error(
        'ERROR LISTANDO CONVERSACIONES:',
        error,
      );

      return res.status(500).json({
        success: false,
        message:
          'No se pudieron cargar las conversaciones',
        error:
          error.message,
      });
    }
  };

// ============================================================
// OBTENER MENSAJES
//
// GET /api/chat/conversacion/:id/mensajes
// ============================================================

exports.obtenerMensajes =
  async (
    req,
    res
  ) => {
    try {
      const usuarioId =
        obtenerUsuarioId(req);

      const conversacionId =
        Number(
          req.params.id,
        );

      // ======================================================
      // VALIDAR USUARIO
      // ======================================================

      if (!usuarioId) {
        return res.status(401).json({
          success: false,
          message:
            'Usuario no autenticado',
        });
      }

      // ======================================================
      // VALIDAR CONVERSACIÓN
      // ======================================================

      if (
        !Number.isInteger(
          conversacionId,
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            'ID de conversación inválido',
        });
      }

      // ======================================================
      // VERIFICAR PARTICIPANTE
      // ======================================================

      const pertenece =
        await pool.query(
          `
            SELECT
              id
            FROM participantes_conversacion
            WHERE
              conversacion_id =
                $1
              AND usuario_id =
                $2
            LIMIT 1
          `,
          [
            conversacionId,
            usuarioId,
          ],
        );

      if (
        pertenece.rowCount ===
        0
      ) {
        return res.status(403).json({
          success: false,
          message:
            'No tienes acceso a esta conversación',
        });
      }

      // ======================================================
      // OBTENER MENSAJES
      // ======================================================

      const resultado =
        await pool.query(
          `
            SELECT
              m.id,
              m.conversacion_id,
              m.remitente_id,
              m.contenido,
              m.leido,
              m.created_at,

              CASE
                WHEN
                  m.remitente_id =
                  $2
                THEN TRUE
                ELSE FALSE
              END
                AS es_mio

            FROM mensajes m

            WHERE
              m.conversacion_id =
                $1

            ORDER BY
              m.created_at ASC,
              m.id ASC
          `,
          [
            conversacionId,
            usuarioId,
          ],
        );

      return res.json({
        success: true,
        mensajes:
          resultado.rows,
      });
    } catch (error) {
      console.error(
        'ERROR OBTENIENDO MENSAJES:',
        error,
      );

      return res.status(500).json({
        success: false,
        message:
          'No se pudieron cargar los mensajes',
        error:
          error.message,
      });
    }
  };

// ============================================================
// ENVIAR MENSAJE
//
// POST /api/chat/conversacion/:id/mensaje
//
// body:
// {
//   "contenido": "Hola"
// }
// ============================================================

exports.enviarMensaje =
  async (
    req,
    res
  ) => {
    const client =
      await pool.connect();

    try {
      const usuarioId =
        obtenerUsuarioId(req);

      const conversacionId =
        Number(
          req.params.id,
        );

      const contenido =
        req.body.contenido
          ?.toString()
          .trim();

      // ======================================================
      // VALIDAR USUARIO
      // ======================================================

      if (!usuarioId) {
        return res.status(401).json({
          success: false,
          message:
            'Usuario no autenticado',
        });
      }

      // ======================================================
      // VALIDAR CONVERSACIÓN
      // ======================================================

      if (
        !Number.isInteger(
          conversacionId,
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            'Conversación inválida',
        });
      }

      // ======================================================
      // VALIDAR CONTENIDO
      // ======================================================

      if (!contenido) {
        return res.status(400).json({
          success: false,
          message:
            'El mensaje no puede estar vacío',
        });
      }

      if (
        contenido.length >
        5000
      ) {
        return res.status(400).json({
          success: false,
          message:
            'El mensaje es demasiado largo',
        });
      }

      // ======================================================
      // VERIFICAR PARTICIPANTE
      // ======================================================

      const pertenece =
        await client.query(
          `
            SELECT
              id
            FROM participantes_conversacion
            WHERE
              conversacion_id =
                $1
              AND usuario_id =
                $2
            LIMIT 1
          `,
          [
            conversacionId,
            usuarioId,
          ],
        );

      if (
        pertenece.rowCount ===
        0
      ) {
        return res.status(403).json({
          success: false,
          message:
            'No tienes acceso a esta conversación',
        });
      }

      // ======================================================
      // INICIAR TRANSACCIÓN
      // ======================================================

      await client.query(
        'BEGIN',
      );

      // ======================================================
      // CREAR MENSAJE
      // ======================================================

      const resultado =
        await client.query(
          `
            INSERT INTO mensajes (
              conversacion_id,
              remitente_id,
              contenido,
              leido,
              created_at
            )
            VALUES (
              $1,
              $2,
              $3,
              FALSE,
              NOW()
            )

            RETURNING
              id,
              conversacion_id,
              remitente_id,
              contenido,
              leido,
              created_at
          `,
          [
            conversacionId,
            usuarioId,
            contenido,
          ],
        );

      // ======================================================
      // ACTUALIZAR FECHA DE CONVERSACIÓN
      // ======================================================

      await client.query(
        `
          UPDATE conversaciones
          SET updated_at =
            NOW()
          WHERE id =
            $1
        `,
        [
          conversacionId,
        ],
      );

      await client.query(
        'COMMIT',
      );

      const mensaje =
        resultado.rows[0];

      mensaje.es_mio =
        true;

      return res.status(201).json({
        success: true,
        mensaje,
      });
    } catch (error) {
      try {
        await client.query(
          'ROLLBACK',
        );
      } catch (_) {}

      console.error(
        'ERROR ENVIANDO MENSAJE:',
        error,
      );

      return res.status(500).json({
        success: false,
        message:
          'No se pudo enviar el mensaje',
        error:
          error.message,
      });
    } finally {
      client.release();
    }
  };

// ============================================================
// MARCAR MENSAJES COMO LEÍDOS
//
// PUT /api/chat/conversacion/:id/leidos
// ============================================================

exports.marcarComoLeidos =
  async (
    req,
    res
  ) => {
    try {
      const usuarioId =
        obtenerUsuarioId(req);

      const conversacionId =
        Number(
          req.params.id,
        );

      // ======================================================
      // VALIDAR USUARIO
      // ======================================================

      if (!usuarioId) {
        return res.status(401).json({
          success: false,
          message:
            'Usuario no autenticado',
        });
      }

      // ======================================================
      // VALIDAR CONVERSACIÓN
      // ======================================================

      if (
        !Number.isInteger(
          conversacionId,
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            'Conversación inválida',
        });
      }

      // ======================================================
      // VERIFICAR PARTICIPANTE
      // ======================================================

      const pertenece =
        await pool.query(
          `
            SELECT
              id
            FROM participantes_conversacion
            WHERE
              conversacion_id =
                $1
              AND usuario_id =
                $2
            LIMIT 1
          `,
          [
            conversacionId,
            usuarioId,
          ],
        );

      if (
        pertenece.rowCount ===
        0
      ) {
        return res.status(403).json({
          success: false,
          message:
            'No tienes acceso a esta conversación',
        });
      }

      // ======================================================
      // MARCAR COMO LEÍDOS LOS MENSAJES DEL OTRO USUARIO
      // ======================================================

      const resultado =
        await pool.query(
          `
            UPDATE mensajes

            SET leido =
              TRUE

            WHERE
              conversacion_id =
                $1

              AND
                remitente_id <>
                $2

              AND
                leido =
                FALSE

            RETURNING
              id
          `,
          [
            conversacionId,
            usuarioId,
          ],
        );

      return res.json({
        success: true,
        actualizados:
          resultado.rowCount,
      });
    } catch (error) {
      console.error(
        'ERROR MARCANDO LEÍDOS:',
        error,
      );

      return res.status(500).json({
        success: false,
        message:
          'No se pudieron actualizar los mensajes',
        error:
          error.message,
      });
    }
  };