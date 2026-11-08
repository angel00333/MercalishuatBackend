const pool = require('../config/db');

// IMPORTANTE:
// Si tu local_comercial.service.js importa la conexión con otra ruta,
// usa exactamente esa misma ruta aquí.

const SELECT_LOCAL = `
  SELECT
    l.id,
    l.usuario_id,
    l.titulo,
    l.descripcion,
    l.tipo_operacion,
    l.tipo_local,
    l.precio,
    l.moneda,
    l.departamento,
    l.municipio,
    l.direccion,
    l.latitud,
    l.longitud,

    l.contacto_nombre,
    l.contacto_telefono,
    l.contacto_whatsapp,
    l.contacto_correo,

    l.disponible,
    l.activo,

    l.fecha_creacion,
    l.fecha_actualizacion,

    u.nombre AS propietario_nombre,

    COALESCE(
      json_agg(
        json_build_object(
          'id', i.id,
          'url', i.url,
          'public_id', i.public_id,
          'orden', i.orden,
          'principal', i.principal
        )
        ORDER BY
          i.principal DESC,
          i.orden ASC,
          i.id ASC
      )
      FILTER (
        WHERE i.id IS NOT NULL
      ),
      '[]'::json
    ) AS imagenes

  FROM locales_comerciales l

  INNER JOIN usuarios u
    ON u.id = l.usuario_id

  LEFT JOIN imagenes_local_comercial i
    ON i.local_id = l.id
`;

// ============================================================
// LISTAR TODOS LOS LOCALES PARA ADMIN
// ============================================================

async function listar({
  pagina = 1,
  limite = 20,
  buscar,
  estado = 'todos',
  tipoOperacion,
}) {
  const condiciones = [];

  const parametros = [];

  // ==========================================================
  // BUSCADOR
  // ==========================================================

  if (
    buscar &&
    String(buscar).trim().length > 0
  ) {
    parametros.push(
      `%${String(buscar).trim()}%`,
    );

    const posicion =
      parametros.length;

    condiciones.push(`
      (
        l.titulo ILIKE $${posicion}
        OR l.descripcion ILIKE $${posicion}
        OR l.departamento ILIKE $${posicion}
        OR l.municipio ILIKE $${posicion}
        OR l.direccion ILIKE $${posicion}
        OR u.nombre ILIKE $${posicion}
      )
    `);
  }

  // ==========================================================
  // FILTRO ESTADO
  // ==========================================================

  switch (estado) {
    case 'activos':
      condiciones.push(
        'l.activo = TRUE',
      );
      break;

    case 'ocultos':
      condiciones.push(
        'l.activo = FALSE',
      );
      break;

    case 'disponibles':
      condiciones.push(
        'l.activo = TRUE AND l.disponible = TRUE',
      );
      break;

    case 'no_disponibles':
      condiciones.push(
        'l.disponible = FALSE',
      );
      break;

    default:
      break;
  }

  // ==========================================================
  // FILTRO OPERACIÓN
  // ==========================================================

  if (
    tipoOperacion === 'venta' ||
    tipoOperacion === 'alquiler'
  ) {
    parametros.push(
      tipoOperacion,
    );

    condiciones.push(
      `l.tipo_operacion = $${parametros.length}`,
    );
  }

  const where =
    condiciones.length > 0
      ? `WHERE ${condiciones.join(' AND ')}`
      : '';

  // ==========================================================
  // PAGINACIÓN
  // ==========================================================

  const paginaNumero =
    Math.max(
      Number(pagina) || 1,
      1,
    );

  const limiteNumero =
    Math.min(
      Math.max(
        Number(limite) || 20,
        1,
      ),
      100,
    );

  const offset =
    (paginaNumero - 1) *
    limiteNumero;

  // ==========================================================
  // TOTAL
  // ==========================================================

  const totalResult =
    await pool.query(
      `
        SELECT
          COUNT(*)::int AS total

        FROM locales_comerciales l

        INNER JOIN usuarios u
          ON u.id = l.usuario_id

        ${where}
      `,
      parametros,
    );

  const total =
    Number(
      totalResult.rows[0]?.total ??
        0,
    );

  // ==========================================================
  // LISTADO
  // ==========================================================

  const parametrosDatos = [
    ...parametros,
    limiteNumero,
    offset,
  ];

  const posicionLimite =
    parametros.length + 1;

  const posicionOffset =
    parametros.length + 2;

  const resultado =
    await pool.query(
      `
        ${SELECT_LOCAL}

        ${where}

        GROUP BY
          l.id,
          u.nombre

        ORDER BY
          l.fecha_creacion DESC,
          l.id DESC

        LIMIT $${posicionLimite}
        OFFSET $${posicionOffset}
      `,
      parametrosDatos,
    );

  // ==========================================================
  // RESUMEN
  // ==========================================================

  const resumenResult =
    await pool.query(`
      SELECT
        COUNT(*)::int AS total,

        COUNT(*) FILTER (
          WHERE activo = TRUE
        )::int AS activos,

        COUNT(*) FILTER (
          WHERE activo = FALSE
        )::int AS ocultos,

        COUNT(*) FILTER (
          WHERE activo = TRUE
            AND disponible = TRUE
        )::int AS disponibles,

        COUNT(*) FILTER (
          WHERE disponible = FALSE
        )::int AS no_disponibles

      FROM locales_comerciales
    `);

  const resumen =
    resumenResult.rows[0];

  return {
    locales:
      resultado.rows,

    pagina:
      paginaNumero,

    limite:
      limiteNumero,

    total,

    paginas:
      Math.max(
        Math.ceil(
          total / limiteNumero,
        ),
        1,
      ),

    resumen: {
      total:
        Number(
          resumen?.total ?? 0,
        ),

      activos:
        Number(
          resumen?.activos ?? 0,
        ),

      ocultos:
        Number(
          resumen?.ocultos ?? 0,
        ),

      disponibles:
        Number(
          resumen?.disponibles ?? 0,
        ),

      no_disponibles:
        Number(
          resumen?.no_disponibles ??
            0,
        ),
    },
  };
}

// ============================================================
// OBTENER LOCAL
// ============================================================

async function obtenerPorId(
  localId,
) {
  const resultado =
    await pool.query(
      `
        ${SELECT_LOCAL}

        WHERE l.id = $1

        GROUP BY
          l.id,
          u.nombre
      `,
      [
        localId,
      ],
    );

  return resultado.rows[0] ??
      null;
}

// ============================================================
// OCULTAR / REACTIVAR
// ============================================================

async function cambiarEstado(
  localId,
  activo,
) {
  const resultado =
    await pool.query(
      `
        UPDATE locales_comerciales

        SET
          activo = $2,
          fecha_actualizacion =
            CURRENT_TIMESTAMP

        WHERE id = $1

        RETURNING id
      `,
      [
        localId,
        activo,
      ],
    );

  if (
    resultado.rowCount === 0
  ) {
    return null;
  }

  return obtenerPorId(
    localId,
  );
}

// ============================================================
// DISPONIBILIDAD
// ============================================================

async function cambiarDisponibilidad(
  localId,
  disponible,
) {
  const resultado =
    await pool.query(
      `
        UPDATE locales_comerciales

        SET
          disponible = $2,
          fecha_actualizacion =
            CURRENT_TIMESTAMP

        WHERE id = $1

        RETURNING id
      `,
      [
        localId,
        disponible,
      ],
    );

  if (
    resultado.rowCount === 0
  ) {
    return null;
  }

  return obtenerPorId(
    localId,
  );
}

module.exports = {
  listar,
  obtenerPorId,
  cambiarEstado,
  cambiarDisponibilidad,
};