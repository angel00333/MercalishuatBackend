const pool = require('../config/db');


// ============================================
// VALIDAR COORDENADAS
// ============================================

const validarCoordenadas = (
  latitud,
  longitud
) => {
  // Las dos pueden venir vacías.
  // Esto permite tiendas antiguas
  // sin ubicación.
  if (
    (latitud === undefined ||
      latitud === null ||
      latitud === '') &&
    (longitud === undefined ||
      longitud === null ||
      longitud === '')
  ) {
    return {
      valido: true,
      latitud: null,
      longitud: null,
    };
  }

  // Si viene una coordenada,
  // deben venir ambas.
  if (
    latitud === undefined ||
    latitud === null ||
    latitud === '' ||
    longitud === undefined ||
    longitud === null ||
    longitud === ''
  ) {
    return {
      valido: false,
      message:
        'La latitud y longitud deben enviarse juntas',
    };
  }

  const lat = Number(latitud);
  const lng = Number(longitud);

  if (
    !Number.isFinite(lat) ||
    !Number.isFinite(lng)
  ) {
    return {
      valido: false,
      message:
        'Las coordenadas no son válidas',
    };
  }

  if (lat < -90 || lat > 90) {
    return {
      valido: false,
      message:
        'La latitud no es válida',
    };
  }

  if (lng < -180 || lng > 180) {
    return {
      valido: false,
      message:
        'La longitud no es válida',
    };
  }

  return {
    valido: true,
    latitud: lat,
    longitud: lng,
  };
};


// ============================================
// CREAR EMPRENDIMIENTO
// ============================================

const crearEmprendimiento = async (
  req,
  res
) => {
  try {
    const usuarioId =
      req.usuario.id;

    const {
      nombre,
      descripcion,
      telefono,
      correo_contacto,
      latitud,
      longitud,
    } = req.body;

    // ==========================================
    // VALIDAR NOMBRE
    // ==========================================

    if (
      !nombre ||
      nombre.trim() === ''
    ) {
      return res.status(400).json({
        message:
          'El nombre del emprendimiento es obligatorio',
      });
    }

    // ==========================================
    // VALIDAR COORDENADAS
    // ==========================================

    const coordenadas =
      validarCoordenadas(
        latitud,
        longitud
      );

    if (!coordenadas.valido) {
      return res.status(400).json({
        message:
          coordenadas.message,
      });
    }

    // ==========================================
    // VERIFICAR SI YA TIENE TIENDA
    // ==========================================

    const existente =
      await pool.query(
        `
        SELECT id
        FROM emprendimientos
        WHERE usuario_id = $1
        `,
        [usuarioId]
      );

    if (
      existente.rows.length >
      0
    ) {
      return res.status(409).json({
        message:
          'Este emprendedor ya tiene una tienda registrada',
      });
    }

    // ==========================================
    // CREAR
    // ==========================================

    const resultado =
      await pool.query(
        `
        INSERT INTO emprendimientos
        (
          usuario_id,
          nombre,
          descripcion,
          telefono,
          correo_contacto,
          latitud,
          longitud
        )
        VALUES
        (
          $1,
          $2,
          $3,
          $4,
          $5,
          $6,
          $7
        )

        RETURNING
          id,
          usuario_id,
          nombre,
          descripcion,
          imagen_url,
          telefono,
          correo_contacto,
          latitud,
          longitud,
          activo,
          fecha_creacion
        `,
        [
          usuarioId,
          nombre.trim(),
          descripcion?.trim() ||
            null,
          telefono?.trim() ||
            null,
          correo_contacto?.trim() ||
            null,
          coordenadas.latitud,
          coordenadas.longitud,
        ]
      );

    return res.status(201).json({
      message:
        'Emprendimiento creado correctamente',

      emprendimiento:
        resultado.rows[0],
    });
  } catch (error) {
    console.error(
      'Error creando emprendimiento:',
      error
    );

    return res.status(500).json({
      message:
        'Error interno del servidor',
    });
  }
};


// ============================================
// OBTENER MI EMPRENDIMIENTO
// ============================================

const obtenerMiEmprendimiento =
  async (req, res) => {
    try {
      const usuarioId =
        req.usuario.id;

      const resultado =
        await pool.query(
          `
          SELECT
            e.id,
            e.usuario_id,
            e.nombre,
            e.descripcion,
            e.imagen_url,
            e.telefono,
            e.correo_contacto,
            e.latitud,
            e.longitud,
            e.activo,
            e.fecha_creacion

          FROM emprendimientos e

          WHERE e.usuario_id = $1
          `,
          [usuarioId]
        );

      if (
        resultado.rows.length ===
        0
      ) {
        return res
          .status(404)
          .json({
            message:
              'No tienes un emprendimiento registrado',
          });
      }

      return res.json({
        emprendimiento:
          resultado.rows[0],
      });
    } catch (error) {
      console.error(
        'Error obteniendo emprendimiento:',
        error
      );

      return res
        .status(500)
        .json({
          message:
            'Error interno del servidor',
        });
    }
  };


// ============================================
// OBTENER EMPRENDIMIENTO POR ID
// ============================================

const obtenerEmprendimientoPorId =
  async (req, res) => {
    try {
      const { id } =
        req.params;

      const resultado =
        await pool.query(
          `
          SELECT
            e.id,
            e.usuario_id,
            e.nombre,
            e.descripcion,
            e.imagen_url,
            e.telefono,
            e.correo_contacto,
            e.latitud,
            e.longitud,
            e.activo,
            e.fecha_creacion,

            u.nombre
              AS propietario

          FROM emprendimientos e

          INNER JOIN usuarios u
            ON u.id =
               e.usuario_id

          WHERE e.id = $1
            AND e.activo = TRUE
          `,
          [id]
        );

      if (
        resultado.rows.length ===
        0
      ) {
        return res
          .status(404)
          .json({
            message:
              'Emprendimiento no encontrado',
          });
      }

      return res.json({
        emprendimiento:
          resultado.rows[0],
      });
    } catch (error) {
      console.error(
        'Error obteniendo emprendimiento:',
        error
      );

      return res
        .status(500)
        .json({
          message:
            'Error interno del servidor',
        });
    }
  };


// ============================================
// LISTAR EMPRENDIMIENTOS
// ============================================

const listarEmprendimientos =
  async (req, res) => {
    try {
      const resultado =
        await pool.query(
          `
          SELECT
            e.id,
            e.usuario_id,
            e.nombre,
            e.descripcion,
            e.imagen_url,
            e.telefono,
            e.correo_contacto,
            e.latitud,
            e.longitud,
            e.activo,
            e.fecha_creacion,

            u.nombre
              AS propietario

          FROM emprendimientos e

          INNER JOIN usuarios u
            ON u.id =
               e.usuario_id

          WHERE e.activo = TRUE

          ORDER BY
            e.fecha_creacion DESC
          `
        );

      return res.json({
        emprendimientos:
          resultado.rows,
      });
    } catch (error) {
      console.error(
        'Error listando emprendimientos:',
        error
      );

      return res
        .status(500)
        .json({
          message:
            'Error interno del servidor',
        });
    }
  };


// ============================================
// EDITAR EMPRENDIMIENTO
// ============================================

const editarEmprendimiento =
  async (req, res) => {
    try {
      const usuarioId =
        req.usuario.id;

      const {
        nombre,
        descripcion,
        telefono,
        correo_contacto,
        latitud,
        longitud,
      } = req.body;

      // ========================================
      // VALIDAR NOMBRE
      // ========================================

      if (
        !nombre ||
        nombre.trim() === ''
      ) {
        return res
          .status(400)
          .json({
            message:
              'El nombre del emprendimiento es obligatorio',
          });
      }

      // ========================================
      // VALIDAR COORDENADAS
      // ========================================

      const coordenadas =
        validarCoordenadas(
          latitud,
          longitud
        );

      if (!coordenadas.valido) {
        return res
          .status(400)
          .json({
            message:
              coordenadas.message,
          });
      }

      // ========================================
      // ACTUALIZAR
      // ========================================

      const resultado =
        await pool.query(
          `
          UPDATE emprendimientos

          SET
            nombre = $1,
            descripcion = $2,
            telefono = $3,
            correo_contacto = $4,
            latitud = $5,
            longitud = $6

          WHERE usuario_id = $7

          RETURNING
            id,
            usuario_id,
            nombre,
            descripcion,
            imagen_url,
            telefono,
            correo_contacto,
            latitud,
            longitud,
            activo,
            fecha_creacion
          `,
          [
            nombre.trim(),
            descripcion?.trim() ||
              null,
            telefono?.trim() ||
              null,
            correo_contacto?.trim() ||
              null,
            coordenadas.latitud,
            coordenadas.longitud,
            usuarioId,
          ]
        );

      if (
        resultado.rows.length ===
        0
      ) {
        return res
          .status(404)
          .json({
            message:
              'No tienes un emprendimiento registrado',
          });
      }

      return res.json({
        message:
          'Emprendimiento actualizado correctamente',

        emprendimiento:
          resultado.rows[0],
      });
    } catch (error) {
      console.error(
        'Error actualizando emprendimiento:',
        error
      );

      return res
        .status(500)
        .json({
          message:
            'Error interno del servidor',
        });
    }
  };


// ============================================
// EXPORTAR
// ============================================

module.exports = {
  crearEmprendimiento,
  obtenerMiEmprendimiento,
  obtenerEmprendimientoPorId,
  listarEmprendimientos,
  editarEmprendimiento,
};