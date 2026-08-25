const pool = require('../config/db');

const guardarPublicacion = async (
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
      INSERT INTO guardados
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
      message:
        'Publicación guardada',
      guardado: true,
    });

  } catch (error) {
    console.error(
      'Error guardando publicación:',
      error
    );

    return res.status(500).json({
      message:
        'Error interno del servidor',
    });
  }
};


const quitarGuardado = async (
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
      DELETE FROM guardados

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
        'Publicación eliminada de guardados',
      guardado: false,
    });

  } catch (error) {
    console.error(
      'Error eliminando guardado:',
      error
    );

    return res.status(500).json({
      message:
        'Error interno del servidor',
    });
  }
};


const listarGuardados = async (
  req,
  res
) => {
  try {
    const usuarioId =
        req.usuario.id;

    const resultado =
        await pool.query(
      `
      SELECT
        p.id,
        p.emprendimiento_id,
        p.producto_id,
        p.texto,
        p.fecha_creacion,

        e.nombre
          AS emprendimiento_nombre,

        e.imagen_url
          AS emprendimiento_imagen,

        pr.nombre
          AS producto_nombre,

        pr.precio
          AS producto_precio,

        (
          SELECT ip.url

          FROM imagenes_publicacion ip

          WHERE ip.publicacion_id = p.id

          ORDER BY
            ip.orden ASC,
            ip.id ASC

          LIMIT 1
        ) AS imagen_principal,

        (
          SELECT COUNT(*)::INTEGER
          FROM reacciones r
          WHERE r.publicacion_id = p.id
        ) AS total_me_gusta,

        (
          SELECT COUNT(*)::INTEGER
          FROM comentarios c
          WHERE c.publicacion_id = p.id
        ) AS total_comentarios,

        EXISTS (
          SELECT 1

          FROM reacciones r

          WHERE r.publicacion_id = p.id
            AND r.usuario_id = $1
        ) AS me_gusta,

        TRUE AS guardado

      FROM guardados g

      INNER JOIN publicaciones p
        ON p.id = g.publicacion_id

      INNER JOIN emprendimientos e
        ON e.id = p.emprendimiento_id

      LEFT JOIN productos pr
        ON pr.id = p.producto_id

      WHERE g.usuario_id = $1
        AND p.activo = TRUE

      ORDER BY
        g.fecha_creacion DESC
      `,
      [usuarioId]
    );

    return res.json({
      publicaciones:
        resultado.rows,
    });

  } catch (error) {
    console.error(
      'Error listando guardados:',
      error
    );

    return res.status(500).json({
      message:
        'Error interno del servidor',
    });
  }
};


module.exports = {
  guardarPublicacion,
  quitarGuardado,
  listarGuardados,
};