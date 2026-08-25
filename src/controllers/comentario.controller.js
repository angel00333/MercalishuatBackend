const pool = require('../config/db');


const listarComentarios = async (
  req,
  res
) => {
  try {
    const {
      id,
    } = req.params;

    const resultado =
        await pool.query(
      `
      SELECT
        c.id,
        c.publicacion_id,
        c.usuario_id,
        c.texto,
        c.fecha_creacion,

        u.nombre
          AS usuario_nombre,

        u.foto_perfil_url
          AS usuario_imagen

      FROM comentarios c

      INNER JOIN usuarios u
        ON u.id = c.usuario_id

      WHERE c.publicacion_id = $1

      ORDER BY
        c.fecha_creacion ASC
      `,
      [id]
    );

    return res.json({
      comentarios:
        resultado.rows,
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


const crearComentario = async (
  req,
  res
) => {
  try {
    const usuarioId =
        req.usuario.id;

    const {
      id,
    } = req.params;

    const {
      texto,
    } = req.body;

    if (
      !texto ||
      texto.trim() === ''
    ) {
      return res.status(400).json({
        message:
          'Escribe un comentario',
      });
    }

    const resultado =
        await pool.query(
      `
      INSERT INTO comentarios
      (
        publicacion_id,
        usuario_id,
        texto
      )

      VALUES ($1, $2, $3)

      RETURNING *
      `,
      [
        id,
        usuarioId,
        texto.trim(),
      ]
    );

    return res.status(201).json({
      message:
        'Comentario publicado',

      comentario:
        resultado.rows[0],
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


module.exports = {
  listarComentarios,
  crearComentario,
  eliminarComentario,
};