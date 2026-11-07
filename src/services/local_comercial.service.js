const pool = require('../config/db');


// ============================================================
// CAMPOS BASE
// ============================================================

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
      (
        SELECT json_agg(
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
        FROM imagenes_local_comercial i
        WHERE i.local_id = l.id
      ),
      '[]'::json
    ) AS imagenes

  FROM locales_comerciales l

  INNER JOIN usuarios u
    ON u.id = l.usuario_id
`;


// ============================================================
// LISTAR LOCALES
// ============================================================

const listar = async ({
  pagina = 1,
  limite = 20,
  buscar,
  tipoOperacion,
  tipoLocal,
  departamento,
  municipio,
  precioMin,
  precioMax,
}) => {
  const condiciones = [
    'l.activo = TRUE',
    'l.disponible = TRUE',
  ];

  const valores = [];

  const agregarValor = (valor) => {
    valores.push(valor);
    return `$${valores.length}`;
  };


  // ==========================================================
  // BUSCAR
  // ==========================================================

  if (
    buscar &&
    buscar.trim() !== ''
  ) {
    const parametro =
        agregarValor(
          `%${buscar.trim()}%`
        );

    condiciones.push(`
      (
        l.titulo ILIKE ${parametro}
        OR l.descripcion ILIKE ${parametro}
        OR l.departamento ILIKE ${parametro}
        OR l.municipio ILIKE ${parametro}
        OR l.direccion ILIKE ${parametro}
      )
    `);
  }


  // ==========================================================
  // OPERACIÓN
  // ==========================================================

  if (
    tipoOperacion &&
    tipoOperacion.trim() !== ''
  ) {
    condiciones.push(
      `l.tipo_operacion = ${agregarValor(
        tipoOperacion.trim().toLowerCase()
      )}`
    );
  }


  // ==========================================================
  // TIPO LOCAL
  // ==========================================================

  if (
    tipoLocal &&
    tipoLocal.trim() !== ''
  ) {
    condiciones.push(
      `l.tipo_local = ${agregarValor(
        tipoLocal.trim()
      )}`
    );
  }


  // ==========================================================
  // DEPARTAMENTO
  // ==========================================================

  if (
    departamento &&
    departamento.trim() !== ''
  ) {
    condiciones.push(
      `l.departamento = ${agregarValor(
        departamento.trim()
      )}`
    );
  }


  // ==========================================================
  // MUNICIPIO
  // ==========================================================

  if (
    municipio &&
    municipio.trim() !== ''
  ) {
    condiciones.push(
      `l.municipio = ${agregarValor(
        municipio.trim()
      )}`
    );
  }


  // ==========================================================
  // PRECIO MÍNIMO
  // ==========================================================

  if (
    precioMin !== undefined &&
    precioMin !== null
  ) {
    condiciones.push(
      `l.precio >= ${agregarValor(
        precioMin
      )}`
    );
  }


  // ==========================================================
  // PRECIO MÁXIMO
  // ==========================================================

  if (
    precioMax !== undefined &&
    precioMax !== null
  ) {
    condiciones.push(
      `l.precio <= ${agregarValor(
        precioMax
      )}`
    );
  }


  const where =
      condiciones.join(
        '\n AND '
      );


  // ==========================================================
  // TOTAL
  // ==========================================================

  const totalResultado =
      await pool.query(
    `
    SELECT COUNT(*)::int AS total

    FROM locales_comerciales l

    WHERE ${where}
    `,
    valores
  );

  const total =
      totalResultado.rows[0].total;


  // ==========================================================
  // PAGINACIÓN
  // ==========================================================

  const offset =
      (pagina - 1) * limite;

  const valoresLista = [
    ...valores,
  ];

  valoresLista.push(
    limite
  );

  const limiteParametro =
      `$${valoresLista.length}`;

  valoresLista.push(
    offset
  );

  const offsetParametro =
      `$${valoresLista.length}`;


  // ==========================================================
  // CONSULTA
  // ==========================================================

  const resultado =
      await pool.query(
    `
    ${SELECT_LOCAL}

    WHERE ${where}

    ORDER BY
      l.fecha_creacion DESC

    LIMIT ${limiteParametro}
    OFFSET ${offsetParametro}
    `,
    valoresLista
  );


  return {
    locales:
        resultado.rows,

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
  };
};


// ============================================================
// LISTAR MIS LOCALES
// ============================================================

const listarMios = async ({
  usuarioId,
}) => {
  const resultado =
      await pool.query(
    `
    ${SELECT_LOCAL}

    WHERE l.usuario_id = $1
      AND l.activo = TRUE

    ORDER BY
      l.fecha_creacion DESC
    `,
    [
      usuarioId,
    ]
  );

  return resultado.rows;
};


// ============================================================
// OBTENER LOCAL
// ============================================================

const obtenerPorId = async (
  localId
) => {
  const resultado =
      await pool.query(
    `
    ${SELECT_LOCAL}

    WHERE l.id = $1
      AND l.activo = TRUE

    LIMIT 1
    `,
    [
      localId,
    ]
  );

  return (
    resultado.rows[0] ||
    null
  );
};


// ============================================================
// CREAR LOCAL
// ============================================================

const crear = async ({
  usuarioId,
  titulo,
  descripcion,
  tipoOperacion,
  tipoLocal,
  precio,
  departamento,
  municipio,
  direccion,
  latitud,
  longitud,
  contactoNombre,
  contactoTelefono,
  contactoWhatsapp,
  contactoCorreo,
}) => {
  const resultado =
      await pool.query(
    `
    INSERT INTO locales_comerciales
    (
      usuario_id,
      titulo,
      descripcion,
      tipo_operacion,
      tipo_local,
      precio,
      moneda,
      departamento,
      municipio,
      direccion,
      latitud,
      longitud,
      contacto_nombre,
      contacto_telefono,
      contacto_whatsapp,
      contacto_correo
    )

    VALUES
    (
      $1,
      $2,
      $3,
      $4,
      $5,
      $6,
      'USD',
      $7,
      $8,
      $9,
      $10,
      $11,
      $12,
      $13,
      $14,
      $15
    )

    RETURNING id
    `,
    [
      usuarioId,
      titulo,
      descripcion,
      tipoOperacion,
      tipoLocal,
      precio,
      departamento,
      municipio,
      direccion,
      latitud,
      longitud,
      contactoNombre,
      contactoTelefono,
      contactoWhatsapp,
      contactoCorreo,
    ]
  );

  return obtenerPorId(
    resultado.rows[0].id
  );
};


// ============================================================
// VERIFICAR PROPIETARIO
// ============================================================

const obtenerPropio = async ({
  localId,
  usuarioId,
}) => {
  const resultado =
      await pool.query(
    `
    SELECT *
    FROM locales_comerciales

    WHERE id = $1
      AND usuario_id = $2
      AND activo = TRUE

    LIMIT 1
    `,
    [
      localId,
      usuarioId,
    ]
  );

  return (
    resultado.rows[0] ||
    null
  );
};


// ============================================================
// ACTUALIZAR LOCAL
// ============================================================

const actualizar = async ({
  localId,
  usuarioId,
  cambios,
}) => {
  const propio =
      await obtenerPropio({
    localId,
    usuarioId,
  });

  if (!propio) {
    const error =
        new Error(
          'Local comercial no encontrado o no autorizado'
        );

    error.statusCode =
        404;

    throw error;
  }


  const camposPermitidos = {
    titulo:
        'titulo',

    descripcion:
        'descripcion',

    tipo_operacion:
        'tipo_operacion',

    tipo_local:
        'tipo_local',

    precio:
        'precio',

    departamento:
        'departamento',

    municipio:
        'municipio',

    direccion:
        'direccion',

    latitud:
        'latitud',

    longitud:
        'longitud',

    contacto_nombre:
        'contacto_nombre',

    contacto_telefono:
        'contacto_telefono',

    contacto_whatsapp:
        'contacto_whatsapp',

    contacto_correo:
        'contacto_correo',
  };


  const asignaciones = [];

  const valores = [];


  for (
    const [
      clave,
      columna,
    ] of Object.entries(
      camposPermitidos
    )
  ) {
    if (
      Object.prototype
          .hasOwnProperty.call(
            cambios,
            clave
          )
    ) {
      valores.push(
        cambios[clave]
      );

      asignaciones.push(
        `${columna} = $${valores.length}`
      );
    }
  }


  if (
    asignaciones.length === 0
  ) {
    return obtenerPorId(
      localId
    );
  }


  asignaciones.push(
    'fecha_actualizacion = CURRENT_TIMESTAMP'
  );


  valores.push(
    localId
  );

  const idParametro =
      `$${valores.length}`;


  valores.push(
    usuarioId
  );

  const usuarioParametro =
      `$${valores.length}`;


  await pool.query(
    `
    UPDATE locales_comerciales

    SET
      ${asignaciones.join(
        ',\n'
      )}

    WHERE id = ${idParametro}
      AND usuario_id = ${usuarioParametro}
      AND activo = TRUE
    `,
    valores
  );


  return obtenerPorId(
    localId
  );
};


// ============================================================
// CAMBIAR DISPONIBILIDAD
// ============================================================

const cambiarDisponibilidad =
    async ({
      localId,
      usuarioId,
      disponible,
    }) => {
      const resultado =
          await pool.query(
        `
        UPDATE locales_comerciales

        SET
          disponible = $1,
          fecha_actualizacion =
            CURRENT_TIMESTAMP

        WHERE id = $2
          AND usuario_id = $3
          AND activo = TRUE

        RETURNING id
        `,
        [
          disponible,
          localId,
          usuarioId,
        ]
      );


      if (
        resultado.rows.length === 0
      ) {
        const error =
            new Error(
              'Local comercial no encontrado o no autorizado'
            );

        error.statusCode =
            404;

        throw error;
      }


      return obtenerPorId(
        localId
      );
    };


// ============================================================
// ELIMINAR LÓGICAMENTE
// ============================================================

const eliminar = async ({
  localId,
  usuarioId,
}) => {
  const resultado =
      await pool.query(
    `
    UPDATE locales_comerciales

    SET
      activo = FALSE,
      fecha_actualizacion =
        CURRENT_TIMESTAMP

    WHERE id = $1
      AND usuario_id = $2
      AND activo = TRUE

    RETURNING id
    `,
    [
      localId,
      usuarioId,
    ]
  );


  if (
    resultado.rows.length === 0
  ) {
    const error =
        new Error(
          'Local comercial no encontrado o no autorizado'
        );

    error.statusCode =
        404;

    throw error;
  }


  return true;
};


// ============================================================
// EXPORTACIONES
// ============================================================

module.exports = {
  listar,
  listarMios,
  obtenerPorId,
  crear,
  actualizar,
  cambiarDisponibilidad,
  eliminar,
};