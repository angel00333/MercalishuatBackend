const pool = require('../config/db');


// =====================================================
// LISTAR COMENTARIOS
// =====================================================

const listarComentarios = async (req, res) => {
  try {
    const { id } = req.params;
    const usuarioId = req.usuario.id;

    const resultado = await pool.query(
      `
      SELECT
        c.id,
        c.publicacion_id,
        c.usuario_id,
        c.texto,
        c.comentario_padre_id,
        c.fecha_creacion,

        u.nombre AS usuario_nombre,
        u.foto_perfil_url AS usuario_imagen,

        r.nombre AS usuario_rol,

        CASE
          WHEN c.usuario_id = $2
          THEN TRUE
          ELSE FALSE
        END AS puede_eliminar

      FROM comentarios c

      INNER JOIN usuarios u
        ON u.id = c.usuario_id

      INNER JOIN roles r
        ON r.id = u.rol_id

      INNER JOIN publicaciones p
        ON p.id = c.publicacion_id

      LEFT JOIN comentarios padre
        ON padre.id = c.comentario_padre_id

      WHERE c.publicacion_id = $1

        -- Solo comentarios visibles
        AND c.activo = TRUE

        -- La publicación también debe estar visible
        AND p.activo = TRUE

        -- Si es respuesta, su comentario padre
        -- también debe seguir visible
        AND (
          c.comentario_padre_id IS NULL
          OR padre.activo = TRUE
        )

      ORDER BY c.fecha_creacion ASC
      `,
      [
        id,
        usuarioId,
      ]
    );

    return res.json({
      comentarios: resultado.rows,
    });

  } catch (error) {
    console.error(
      'Error listando comentarios:',
      error
    );

    return res.status(500).json({
      message:
        'Error interno del servidor',
    });
  }
};


// =====================================================
// CREAR COMENTARIO
// =====================================================

const crearComentario = async (req, res) => {
  try {
    const { id } = req.params;
    const usuarioId = req.usuario.id;
    const { texto } = req.body;

    // =================================================
    // VALIDAR TEXTO
    // =================================================

    if (
      !texto ||
      typeof texto !== 'string' ||
      texto.trim() === ''
    ) {
      return res.status(400).json({
        message:
          'Escribe un comentario',
      });
    }

    // =================================================
    // VERIFICAR PUBLICACIÓN
    // =================================================
    // No se permite comentar una publicación
    // que haya sido ocultada por moderación.

    const publicacion = await pool.query(
      `
      SELECT id
      FROM publicaciones
      WHERE id = $1
        AND activo = TRUE
      LIMIT 1
      `,
      [
        id,
      ]
    );

    if (publicacion.rows.length === 0) {
      return res.status(404).json({
        message:
          'Publicación no encontrada o no disponible',
      });
    }

    // =================================================
    // CREAR COMENTARIO
    // =================================================

    const resultado = await pool.query(
      `
      INSERT INTO comentarios
      (
        publicacion_id,
        usuario_id,
        texto,
        comentario_padre_id
      )

      VALUES ($1, $2, $3, NULL)

      RETURNING
        id,
        publicacion_id,
        usuario_id,
        texto,
        comentario_padre_id,
        fecha_creacion,
        activo
      `,
      [
        id,
        usuarioId,
        texto.trim(),
      ]
    );

    const comentarioCreado =
        resultado.rows[0];

    // =================================================
    // OBTENER COMENTARIO COMPLETO
    // =================================================

    const comentarioCompleto =
        await pool.query(
      `
      SELECT
        c.id,
        c.publicacion_id,
        c.usuario_id,
        c.texto,
        c.comentario_padre_id,
        c.fecha_creacion,
        c.activo,

        u.nombre AS usuario_nombre,
        u.foto_perfil_url AS usuario_imagen,

        r.nombre AS usuario_rol,

        TRUE AS puede_eliminar

      FROM comentarios c

      INNER JOIN usuarios u
        ON u.id = c.usuario_id

      INNER JOIN roles r
        ON r.id = u.rol_id

      WHERE c.id = $1
        AND c.activo = TRUE

      LIMIT 1
      `,
      [
        comentarioCreado.id,
      ]
    );

    return res.status(201).json({
      message:
        'Comentario publicado correctamente',

      comentario:
          comentarioCompleto.rows[0],
    });

  } catch (error) {
    console.error(
      'Error creando comentario:',
      error
    );

    return res.status(500).json({
      message:
        'Error interno del servidor',
    });
  }
};


// =====================================================
// ELIMINAR COMENTARIO
// =====================================================

const eliminarComentario = async (
  req,
  res
) => {
  try {
    const usuarioId =
        req.usuario.id;

    const {
      comentarioId,
    } = req.params;

    const resultado =
        await pool.query(
      `
      DELETE FROM comentarios

      WHERE id = $1
        AND usuario_id = $2

      RETURNING id
      `,
      [
        comentarioId,
        usuarioId,
      ]
    );

    if (
      resultado.rows.length === 0
    ) {
      return res.status(403).json({
        message:
          'No puedes eliminar este comentario',
      });
    }

    return res.json({
      message:
        'Comentario eliminado',
    });

  } catch (error) {
    console.error(
      'Error eliminando comentario:',
      error
    );

    return res.status(500).json({
      message:
        'Error interno del servidor',
    });
  }
};


// =====================================================
// RESPONDER COMENTARIO
// =====================================================

const responderComentario = async (
  req,
  res
) => {
  try {
    const usuarioId =
        req.usuario.id;

    const {
      comentarioId,
    } = req.params;

    const {
      texto,
    } = req.body;

    // =================================================
    // VALIDAR TEXTO
    // =================================================

    if (
      !texto ||
      typeof texto !== 'string' ||
      texto.trim() === ''
    ) {
      return res.status(400).json({
        message:
          'Escribe una respuesta',
      });
    }

    // =================================================
    // VERIFICAR COMENTARIO Y PUBLICACIÓN
    // =================================================
    // Solo puede responder el propietario del
    // emprendimiento.
    //
    // El comentario y la publicación deben seguir
    // activos.

    const comentario =
        await pool.query(
      `
      SELECT
        c.id,
        c.publicacion_id,
        p.emprendimiento_id

      FROM comentarios c

      INNER JOIN publicaciones p
        ON p.id = c.publicacion_id

      INNER JOIN emprendimientos e
        ON e.id = p.emprendimiento_id

      WHERE c.id = $1

        AND e.usuario_id = $2

        AND c.activo = TRUE

        AND p.activo = TRUE

      LIMIT 1
      `,
      [
        comentarioId,
        usuarioId,
      ]
    );

    if (
      comentario.rows.length === 0
    ) {
      return res.status(403).json({
        message:
          'No puedes responder este comentario o el contenido ya no está disponible',
      });
    }

    const publicacionId =
        comentario.rows[0]
            .publicacion_id;

    // =================================================
    // CREAR RESPUESTA
    // =================================================

    const resultado =
        await pool.query(
      `
      INSERT INTO comentarios
      (
        publicacion_id,
        usuario_id,
        texto,
        comentario_padre_id
      )

      VALUES ($1, $2, $3, $4)

      RETURNING
        id,
        publicacion_id,
        usuario_id,
        texto,
        comentario_padre_id,
        fecha_creacion,
        activo
      `,
      [
        publicacionId,
        usuarioId,
        texto.trim(),
        comentarioId,
      ]
    );

    const respuestaCreada =
        resultado.rows[0];

    // =================================================
    // OBTENER RESPUESTA COMPLETA
    // =================================================

    const respuestaCompleta =
        await pool.query(
      `
      SELECT
        c.id,
        c.publicacion_id,
        c.usuario_id,
        c.texto,
        c.comentario_padre_id,
        c.fecha_creacion,
        c.activo,

        u.nombre AS usuario_nombre,
        u.foto_perfil_url AS usuario_imagen,

        r.nombre AS usuario_rol,

        TRUE AS puede_eliminar

      FROM comentarios c

      INNER JOIN usuarios u
        ON u.id = c.usuario_id

      INNER JOIN roles r
        ON r.id = u.rol_id

      WHERE c.id = $1
        AND c.activo = TRUE

      LIMIT 1
      `,
      [
        respuestaCreada.id,
      ]
    );

    return res.status(201).json({
      message:
        'Respuesta publicada correctamente',

      comentario:
          respuestaCompleta.rows[0],
    });

  } catch (error) {
    console.error(
      'Error respondiendo comentario:',
      error
    );

    return res.status(500).json({
      message:
        'Error interno del servidor',
    });
  }
};


// =====================================================
// EXPORTACIONES
// =====================================================

module.exports = {
  listarComentarios,
  crearComentario,
  eliminarComentario,
  responderComentario,
};