const pool = require('../config/db');

const darMeGusta = async (
  req,
  res
) => {
  try {
    const usuarioId =
        req.usuario.id;

    const {
      id,
    } = req.params;

    const publicacion =
        await pool.query(
      `
      SELECT id
      FROM publicaciones
      WHERE id = $1
        AND activo = TRUE
      `,
      [id]
    );

    if (
      publicacion.rows.length === 0
    ) {
      return res.status(404).json({
        message:
          'Publicación no encontrada',
      });
    }

    await pool.query(
      `
      INSERT INTO reacciones
      (
        publicacion_id,
        usuario_id
      )

      VALUES ($1, $2)

      ON CONFLICT
      (
        publicacion_id,
        usuario_id
      )
      DO NOTHING
      `,
      [
        id,
        usuarioId,
      ]
    );

    return res.json({
      message: 'Me gusta',
      me_gusta: true,
    });

  } catch (error) {
    console.error(
      'Error agregando reacción:',
      error
    );

    return res.status(500).json({
      message:
        'Error interno del servidor',
    });
  }
};


const quitarMeGusta = async (
  req,
  res
) => {
  try {
    const usuarioId =
        req.usuario.id;

    const {
      id,
    } = req.params;

    await pool.query(
      `
      DELETE FROM reacciones

      WHERE publicacion_id = $1
        AND usuario_id = $2
      `,
      [
        id,
        usuarioId,
      ]
    );

    return res.json({
      message:
        'Me gusta eliminado',
      me_gusta: false,
    });

  } catch (error) {
    console.error(
      'Error quitando reacción:',
      error
    );

    return res.status(500).json({
      message:
        'Error interno del servidor',
    });
  }
};


module.exports = {
  darMeGusta,
  quitarMeGusta,
};