const pool =
  require('../config/db');

// ============================================================
// DASHBOARD
// ============================================================

async function obtenerDashboard() {
  const resultado =
    await pool.query(
      `
      SELECT

        (
          SELECT COUNT(*)::INTEGER
          FROM usuarios
        ) AS total_usuarios,

        (
          SELECT COUNT(*)::INTEGER
          FROM usuarios
          WHERE rol_id = 1
        ) AS usuarios,

        (
          SELECT COUNT(*)::INTEGER
          FROM usuarios
          WHERE rol_id = 2
        ) AS emprendedores,

        (
          SELECT COUNT(*)::INTEGER
          FROM usuarios
          WHERE rol_id = 3
        ) AS administradores,

        (
          SELECT COUNT(*)::INTEGER
          FROM emprendimientos
        ) AS emprendimientos,

        (
          SELECT COUNT(*)::INTEGER
          FROM publicaciones
        ) AS publicaciones,

        (
          SELECT COUNT(*)::INTEGER
          FROM comentarios
        ) AS comentarios
      `
    );

  return resultado.rows[0];
}

// ============================================================
// LISTAR USUARIOS
// ============================================================

async function listarUsuarios({
  pagina = 1,
  limite = 20,
  buscar = '',
  rolId = null,
}) {
  pagina =
    Number(pagina);

  limite =
    Number(limite);

  if (
    !Number.isInteger(pagina) ||
    pagina < 1
  ) {
    pagina = 1;
  }

  if (
    !Number.isInteger(limite) ||
    limite < 1
  ) {
    limite = 20;
  }

  if (limite > 100) {
    limite = 100;
  }

  const offset =
    (pagina - 1) * limite;

  const condiciones = [];

  const valores = [];

  // ==========================================================
  // BUSCADOR
  // ==========================================================

  if (
    buscar &&
    buscar.toString().trim().length > 0
  ) {
    valores.push(
      `%${buscar.toString().trim()}%`
    );

    condiciones.push(
      `
      (
        u.nombre ILIKE $${valores.length}
        OR
        u.correo ILIKE $${valores.length}
      )
      `
    );
  }

  // ==========================================================
  // FILTRO POR ROL
  // ==========================================================

  if (
    rolId !== null &&
    rolId !== undefined &&
    rolId !== ''
  ) {
    const rol =
      Number(rolId);

    if (
      Number.isInteger(rol) &&
      rol >= 1 &&
      rol <= 3
    ) {
      valores.push(rol);

      condiciones.push(
        `u.rol_id = $${valores.length}`
      );
    }
  }

  const where =
    condiciones.length > 0
      ? `WHERE ${condiciones.join(' AND ')}`
      : '';

  // ==========================================================
  // TOTAL
  // ==========================================================

  const resultadoTotal =
    await pool.query(
      `
      SELECT COUNT(*)::INTEGER AS total
      FROM usuarios u
      ${where}
      `,
      valores
    );

  const total =
    resultadoTotal.rows[0].total;

  // ==========================================================
  // PAGINACIÓN
  // ==========================================================

  const valoresListado = [
    ...valores,
    limite,
    offset,
  ];

  const posicionLimite =
    valores.length + 1;

  const posicionOffset =
    valores.length + 2;

  const resultado =
    await pool.query(
      `
      SELECT
        u.id,
        u.nombre,
        u.correo,
        u.rol_id,

        r.nombre AS rol

      FROM usuarios u

      INNER JOIN roles r
        ON r.id = u.rol_id

      ${where}

      ORDER BY
        u.id DESC

      LIMIT $${posicionLimite}
      OFFSET $${posicionOffset}
      `,
      valoresListado
    );

  return {
    usuarios:
      resultado.rows,

    paginacion: {
      pagina,
      limite,
      total,

      paginas:
        Math.max(
          1,
          Math.ceil(
            total / limite
          )
        ),
    },
  };
}

// ============================================================
// OBTENER USUARIO
// ============================================================

async function obtenerUsuarioPorId(
  id
) {
  const resultado =
    await pool.query(
      `
      SELECT
        u.id,
        u.nombre,
        u.correo,
        u.rol_id,

        r.nombre AS rol

      FROM usuarios u

      INNER JOIN roles r
        ON r.id = u.rol_id

      WHERE u.id = $1

      LIMIT 1
      `,
      [
        id,
      ]
    );

  return (
    resultado.rows[0] ||
    null
  );
}

module.exports = {
  obtenerDashboard,
  listarUsuarios,
  obtenerUsuarioPorId,
};