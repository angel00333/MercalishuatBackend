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

      WHERE c.publicacion_id = $1

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
      message: 'Error interno del servidor',
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

    // Validar texto
    if (
      !texto ||
      typeof texto !== 'string' ||
      texto.trim() === ''
    ) {
      return res.status(400).json({
        message: 'Escribe un comentario',
      });
    }

    // Verificar que la publicación exista
    const publicacion = await pool.query(
      `
      SELECT id
      FROM publicaciones
      WHERE id = $1
      LIMIT 1
      `,
      [id]
    );

    if (publicacion.rows.length === 0) {
      return res.status(404).json({
        message: 'Publicación no encontrada',
      });
    }

    // Crear comentario principal
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
        fecha_creacion
      `,
      [
        id,
        usuarioId,
        texto.trim(),
      ]
    );

    const comentarioCreado =
        resultado.rows[0];

    // Obtener datos del usuario para devolver
    // el comentario completo a Flutter
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
      `,
      [
        comentarioCreado.id,
      ]
    );

    return res.status(201).json({
      message: 'Comentario publicado correctamente',
      comentario:
          comentarioCompleto.rows[0],
    });

  } catch (error) {
    console.error(
      'Error creando comentario:',
      error
    );

    return res.status(500).json({
      message: 'Error interno del servidor',
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

    // Verificar que el comentario exista
    // y que la publicación pertenezca
    // al emprendimiento del usuario.
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
          'No puedes responder este comentario',
      });
    }

    const publicacionId =
        comentario.rows[0]
          .publicacion_id;

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
        fecha_creacion
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

    // Obtener respuesta completa
    // incluyendo usuario, foto y rol
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