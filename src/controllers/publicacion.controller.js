const pool = require('../config/db');


// ============================================
// CONSULTA BASE DE PUBLICACIÓN
// ============================================

const consultaBase = `
  SELECT
    p.id,
    p.emprendimiento_id,
    p.producto_id,
    p.texto,
    p.fecha_creacion,
    p.fecha_actualizacion,

    e.nombre AS emprendimiento_nombre,
    e.imagen_url AS emprendimiento_imagen,

    pr.nombre AS producto_nombre,
    pr.precio AS producto_precio,

    (
      SELECT ip.url
      FROM imagenes_publicacion ip
      WHERE ip.publicacion_id = p.id
      ORDER BY ip.orden ASC, ip.id ASC
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

    EXISTS (
      SELECT 1
      FROM guardados g
      WHERE g.publicacion_id = p.id
        AND g.usuario_id = $1
    ) AS guardado

  FROM publicaciones p

  INNER JOIN emprendimientos e
    ON e.id = p.emprendimiento_id

  LEFT JOIN productos pr
    ON pr.id = p.producto_id
`;


// ============================================
// FEED PAGINADO
// ============================================

const obtenerFeed = async (req, res) => {
  try {
    const usuarioId = req.usuario.id;

    let pagina =
        parseInt(req.query.pagina) || 1;

    let limite =
        parseInt(req.query.limite) || 10;

    if (pagina < 1) {
      pagina = 1;
    }

    if (limite < 1) {
      limite = 10;
    }

    if (limite > 30) {
      limite = 30;
    }

    const offset =
        (pagina - 1) * limite;

    const resultado = await pool.query(
      `
      ${consultaBase}

      WHERE p.activo = TRUE
        AND e.activo = TRUE

      ORDER BY
        p.fecha_creacion DESC,
        p.id DESC

      LIMIT $2
      OFFSET $3
      `,
      [
        usuarioId,
        limite,
        offset,
      ]
    );

    const total = await pool.query(
      `
      SELECT COUNT(*)::INTEGER AS total

      FROM publicaciones p

      INNER JOIN emprendimientos e
        ON e.id = p.emprendimiento_id

      WHERE p.activo = TRUE
        AND e.activo = TRUE
      `
    );

    const totalRegistros =
        total.rows[0].total;

    return res.json({
      publicaciones: resultado.rows,

      paginacion: {
        pagina,
        limite,
        total: totalRegistros,

        paginas: Math.ceil(
          totalRegistros / limite
        ),

        hay_mas:
          offset +
            resultado.rows.length <
          totalRegistros,
      },
    });

  } catch (error) {
    console.error(
      'Error obteniendo feed:',
      error
    );

    return res.status(500).json({
      message:
        'Error interno del servidor',
    });
  }
};


// ============================================
// DETALLE PUBLICACIÓN
// ============================================

const obtenerPublicacion = async (
  req,
  res
) => {
  try {
    const usuarioId =
        req.usuario.id;

    const {
      id,
    } = req.params;

    const resultado =
        await pool.query(
      `
      ${consultaBase}

      WHERE p.id = $2
        AND p.activo = TRUE
        AND e.activo = TRUE
      `,
      [
        usuarioId,
        id,
      ]
    );

    if (
      resultado.rows.length === 0
    ) {
      return res.status(404).json({
        message:
          'Publicación no encontrada',
      });
    }

    const imagenes =
        await pool.query(
      `
      SELECT
        id,
        url,
        orden

      FROM imagenes_publicacion

      WHERE publicacion_id = $1

      ORDER BY
        orden ASC,
        id ASC
      `,
      [id]
    );

    return res.json({
      publicacion:
        resultado.rows[0],

      imagenes:
        imagenes.rows,
    });

  } catch (error) {
    console.error(
      'Error obteniendo publicación:',
      error
    );

    return res.status(500).json({
      message:
        'Error interno del servidor',
    });
  }
};


// ============================================
// CREAR PUBLICACIÓN
// ============================================

const crearPublicacion = async (
  req,
  res
) => {
  try {
    const usuarioId =
        req.usuario.id;

    const {
      texto,
      producto_id,
    } = req.body;

    if (
      !texto ||
      texto.trim() === ''
    ) {
      return res.status(400).json({
        message:
          'Escribe algo para publicar',
      });
    }

    const tienda =
        await pool.query(
      `
      SELECT id

      FROM emprendimientos

      WHERE usuario_id = $1
        AND activo = TRUE
      `,
      [usuarioId]
    );

    if (
      tienda.rows.length === 0
    ) {
      return res.status(400).json({
        message:
          'Debes crear una tienda antes de publicar',
      });
    }

    const emprendimientoId =
        tienda.rows[0].id;

    let productoId = null;

    if (producto_id) {
      const producto =
          await pool.query(
        `
        SELECT id

        FROM productos

        WHERE id = $1
          AND emprendimiento_id = $2
        `,
        [
          producto_id,
          emprendimientoId,
        ]
      );

      if (
        producto.rows.length === 0
      ) {
        return res.status(403).json({
          message:
            'El producto no pertenece a tu tienda',
        });
      }

      productoId =
          producto_id;
    }

    const resultado =
        await pool.query(
      `
      INSERT INTO publicaciones
      (
        emprendimiento_id,
        producto_id,
        texto
      )

      VALUES ($1, $2, $3)

      RETURNING *
      `,
      [
        emprendimientoId,
        productoId,
        texto.trim(),
      ]
    );

    return res.status(201).json({
      message:
        'Publicación creada correctamente',

      publicacion:
        resultado.rows[0],
    });

  } catch (error) {
    console.error(
      'Error creando publicación:',
      error
    );

    return res.status(500).json({
      message:
        'Error interno del servidor',
    });
  }
};


// ============================================
// MIS PUBLICACIONES
// ============================================

const misPublicaciones = async (
  req,
  res
) => {
  try {
    const usuarioId =
        req.usuario.id;

    const tienda =
        await pool.query(
      `
      SELECT id

      FROM emprendimientos

      WHERE usuario_id = $1
      `,
      [usuarioId]
    );

    if (
      tienda.rows.length === 0
    ) {
      return res.json({
        publicaciones: [],
      });
    }

    const resultado =
        await pool.query(
      `
      SELECT
        p.id,
        p.emprendimiento_id,
        p.producto_id,
        p.texto,
        p.activo,
        p.fecha_creacion,
        p.fecha_actualizacion,

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
        ) AS total_comentarios

      FROM publicaciones p

      WHERE p.emprendimiento_id = $1

      ORDER BY
        p.fecha_creacion DESC
      `,
      [
        tienda.rows[0].id,
      ]
    );

    return res.json({
      publicaciones:
        resultado.rows,
    });

  } catch (error) {
    console.error(
      'Error obteniendo mis publicaciones:',
      error
    );

    return res.status(500).json({
      message:
        'Error interno del servidor',
    });
  }
};


// ============================================
// EDITAR
// ============================================

const editarPublicacion = async (
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
      producto_id,
    } = req.body;

    if (
      !texto ||
      texto.trim() === ''
    ) {
      return res.status(400).json({
        message:
          'El texto es obligatorio',
      });
    }

    const tienda =
        await pool.query(
      `
      SELECT id

      FROM emprendimientos

      WHERE usuario_id = $1
      `,
      [usuarioId]
    );

    if (
      tienda.rows.length === 0
    ) {
      return res.status(403).json({
        message:
          'No tienes un emprendimiento',
      });
    }

    const emprendimientoId =
        tienda.rows[0].id;

    let productoId = null;

    if (producto_id) {
      const producto =
          await pool.query(
        `
        SELECT id

        FROM productos

        WHERE id = $1
          AND emprendimiento_id = $2
        `,
        [
          producto_id,
          emprendimientoId,
        ]
      );

      if (
        producto.rows.length === 0
      ) {
        return res.status(403).json({
          message:
            'El producto no pertenece a tu tienda',
        });
      }

      productoId =
          producto_id;
    }

    const resultado =
        await pool.query(
      `
      UPDATE publicaciones

      SET
        texto = $1,
        producto_id = $2,
        fecha_actualizacion =
          CURRENT_TIMESTAMP

      WHERE id = $3
        AND emprendimiento_id = $4

      RETURNING *
      `,
      [
        texto.trim(),
        productoId,
        id,
        emprendimientoId,
      ]
    );

    if (
      resultado.rows.length === 0
    ) {
      return res.status(404).json({
        message:
          'Publicación no encontrada',
      });
    }

    return res.json({
      message:
        'Publicación actualizada',

      publicacion:
        resultado.rows[0],
    });

  } catch (error) {
    console.error(
      'Error editando publicación:',
      error
    );

    return res.status(500).json({
      message:
        'Error interno del servidor',
    });
  }
};


// ============================================
// ELIMINAR
// ============================================

const eliminarPublicacion = async (
  req,
  res
) => {
  try {
    const usuarioId =
        req.usuario.id;

    const {
      id,
    } = req.params;

    const resultado =
        await pool.query(
      `
      DELETE FROM publicaciones

      WHERE id = $1

        AND emprendimiento_id IN (
          SELECT id

          FROM emprendimientos

          WHERE usuario_id = $2
        )

      RETURNING id
      `,
      [
        id,
        usuarioId,
      ]
    );

    if (
      resultado.rows.length === 0
    ) {
      return res.status(404).json({
        message:
          'Publicación no encontrada',
      });
    }

    return res.json({
      message:
        'Publicación eliminada',
    });

  } catch (error) {
    console.error(
      'Error eliminando publicación:',
      error
    );

    return res.status(500).json({
      message:
        'Error interno del servidor',
    });
  }
};


module.exports = {
  obtenerFeed,
  obtenerPublicacion,
  crearPublicacion,
  misPublicaciones,
  editarPublicacion,
  eliminarPublicacion,
};