const pool =
  require('../config/db');

// ============================================================
// CREAR REPORTE
// ============================================================

async function crearReporte({
  reportanteId,
  tipo,
  objetivoId,
  motivo,
  descripcion,
}) {
  const cliente =
    await pool.connect();

  try {
    await cliente.query(
      'BEGIN'
    );

    let publicacionId =
      null;

    let comentarioId =
      null;

    // =========================================================
    // VALIDAR PUBLICACIÓN
    // =========================================================

    if (tipo === 'publicacion') {
      const resultado =
          await cliente.query(
        `
          SELECT
            id,
            activo
          FROM publicaciones
          WHERE id = $1
          LIMIT 1
        `,
        [objetivoId]
      );

      if (
          resultado.rowCount ===
          0) {
        const error =
            new Error(
          'Publicación no encontrada'
        );

        error.status =
            404;

        throw error;
      }

      publicacionId =
          objetivoId;
    }

    // =========================================================
    // VALIDAR COMENTARIO
    // =========================================================

    if (tipo === 'comentario') {
      const resultado =
          await cliente.query(
        `
          SELECT
            id,
            activo
          FROM comentarios
          WHERE id = $1
          LIMIT 1
        `,
        [objetivoId]
      );

      if (
          resultado.rowCount ===
          0) {
        const error =
            new Error(
          'Comentario no encontrado'
        );

        error.status =
            404;

        throw error;
      }

      comentarioId =
          objetivoId;
    }

    // =========================================================
    // INSERTAR
    // =========================================================

    const resultado =
        await cliente.query(
      `
        INSERT INTO reportes (
          reportante_id,
          publicacion_id,
          comentario_id,
          motivo,
          descripcion
        )
        VALUES (
          $1,
          $2,
          $3,
          $4,
          $5
        )
        RETURNING
          id,
          reportante_id,
          publicacion_id,
          comentario_id,
          motivo,
          descripcion,
          estado,
          accion,
          fecha_creacion
      `,
      [
        reportanteId,
        publicacionId,
        comentarioId,
        motivo,
        descripcion ||
            null,
      ]
    );

    await cliente.query(
      'COMMIT'
    );

    return resultado.rows[0];
  } catch (error) {
    await cliente.query(
      'ROLLBACK'
    );

    if (
        error.code ===
        '23505') {
      const duplicado =
          new Error(
        'Ya reportaste este contenido y el reporte todavía está pendiente'
      );

      duplicado.status =
          409;

      throw duplicado;
    }

    throw error;
  } finally {
    cliente.release();
  }
}

// ============================================================
// LISTAR REPORTES ADMIN
// ============================================================

async function listarReportes({
  pagina = 1,
  limite = 20,
  estado = '',
}) {
  pagina =
      Number(pagina);

  limite =
      Number(limite);

  if (
      !Number.isInteger(
        pagina
      ) ||
      pagina < 1) {
    pagina =
        1;
  }

  if (
      !Number.isInteger(
        limite
      ) ||
      limite < 1) {
    limite =
        20;
  }

  if (limite > 100) {
    limite =
        100;
  }

  const offset =
      (pagina - 1) *
      limite;

  const valores =
      [];

  let where =
      '';

  if (
      estado &&
      [
        'pendiente',
        'resuelto',
        'descartado',
      ].includes(
        estado
      )) {
    valores.push(
      estado
    );

    where =
        `WHERE r.estado = $${valores.length}`;
  }

  // =========================================================
  // TOTAL
  // =========================================================

  const resultadoTotal =
      await pool.query(
    `
      SELECT
        COUNT(*)::INTEGER
          AS total
      FROM reportes r
      ${where}
    `,
    valores
  );

  const total =
      resultadoTotal
          .rows[0]
          .total;

  // =========================================================
  // LISTADO
  // =========================================================

  const posicionLimite =
      valores.length + 1;

  const posicionOffset =
      valores.length + 2;

  const resultado =
      await pool.query(
    `
      SELECT
        r.id,

        r.reportante_id,

        ur.nombre
          AS reportante_nombre,

        ur.correo
          AS reportante_correo,

        r.publicacion_id,
        r.comentario_id,

        CASE
          WHEN r.publicacion_id IS NOT NULL
            THEN 'publicacion'
          ELSE 'comentario'
        END
          AS tipo,

        r.motivo,
        r.descripcion,
        r.estado,
        r.accion,
        r.fecha_creacion,
        r.fecha_resolucion,
        r.resuelto_por,

        p.texto
          AS publicacion_texto,

        p.activo
          AS publicacion_activa,

        c.texto
          AS comentario_texto,

        c.activo
          AS comentario_activo,

        uc.id
          AS comentario_autor_id,

        uc.nombre
          AS comentario_autor_nombre,

        ep.usuario_id
          AS publicacion_autor_id,

        up.nombre
          AS publicacion_autor_nombre,

        ua.nombre
          AS administrador_nombre

      FROM reportes r

      INNER JOIN usuarios ur
        ON ur.id =
           r.reportante_id

      LEFT JOIN publicaciones p
        ON p.id =
           r.publicacion_id

      LEFT JOIN emprendimientos ep
        ON ep.id =
           p.emprendimiento_id

      LEFT JOIN usuarios up
        ON up.id =
           ep.usuario_id

      LEFT JOIN comentarios c
        ON c.id =
           r.comentario_id

      LEFT JOIN usuarios uc
        ON uc.id =
           c.usuario_id

      LEFT JOIN usuarios ua
        ON ua.id =
           r.resuelto_por

      ${where}

      ORDER BY
        CASE
          WHEN r.estado = 'pendiente'
            THEN 0
          ELSE 1
        END,
        r.fecha_creacion DESC

      LIMIT $${posicionLimite}
      OFFSET $${posicionOffset}
    `,
    [
      ...valores,
      limite,
      offset,
    ]
  );

  return {
    reportes:
        resultado.rows,

    paginacion: {
      pagina,
      limite,
      total,
      paginas:
          Math.max(
        1,
        Math.ceil(
          total /
          limite
        )
      ),
    },
  };
}

// ============================================================
// RESOLVER REPORTE
// ============================================================

async function resolverReporte({
  reporteId,
  administradorId,
  accion,
}) {
  const cliente =
      await pool.connect();

  try {
    await cliente.query(
      'BEGIN'
    );

    // =========================================================
    // BLOQUEAR REPORTE
    // =========================================================

    const resultadoReporte =
        await cliente.query(
      `
        SELECT
          id,
          estado,
          publicacion_id,
          comentario_id
        FROM reportes
        WHERE id = $1
        FOR UPDATE
      `,
      [reporteId]
    );

    if (
        resultadoReporte
            .rowCount ===
        0) {
      const error =
          new Error(
        'Reporte no encontrado'
      );

      error.status =
          404;

      throw error;
    }

    const reporte =
        resultadoReporte
            .rows[0];

    if (
        reporte.estado !==
        'pendiente') {
      const error =
          new Error(
        'Este reporte ya fue procesado'
      );

      error.status =
          409;

      throw error;
    }

    // =========================================================
    // DESCARTAR
    // =========================================================

    if (
        accion ===
        'descartar') {
      const resultado =
          await cliente.query(
        `
          UPDATE reportes
          SET
            estado =
              'descartado',

            accion =
              'sin_accion',

            resuelto_por =
              $1,

            fecha_resolucion =
              CURRENT_TIMESTAMP

          WHERE id = $2

          RETURNING *
        `,
        [
          administradorId,
          reporteId,
        ]
      );

      await cliente.query(
        'COMMIT'
      );

      return resultado
          .rows[0];
    }

    // =========================================================
    // OCULTAR PUBLICACIÓN
    // =========================================================

    if (
        reporte.publicacion_id !==
        null) {
      await cliente.query(
        `
          UPDATE publicaciones
          SET
            activo = false,
            fecha_actualizacion =
              CURRENT_TIMESTAMP
          WHERE id = $1
        `,
        [
          reporte.publicacion_id,
        ]
      );
    }

    // =========================================================
    // OCULTAR COMENTARIO
    // =========================================================

    if (
        reporte.comentario_id !==
        null) {
      await cliente.query(
        `
          UPDATE comentarios
          SET
            activo = false,
            fecha_actualizacion =
              CURRENT_TIMESTAMP
          WHERE id = $1
        `,
        [
          reporte.comentario_id,
        ]
      );
    }

    // =========================================================
    // CERRAR REPORTE
    // =========================================================

    const resultado =
        await cliente.query(
      `
        UPDATE reportes
        SET
          estado =
            'resuelto',

          accion =
            'contenido_ocultado',

          resuelto_por =
            $1,

          fecha_resolucion =
            CURRENT_TIMESTAMP

        WHERE id = $2

        RETURNING *
      `,
      [
        administradorId,
        reporteId,
      ]
    );

    await cliente.query(
      'COMMIT'
    );

    return resultado
        .rows[0];
  } catch (error) {
    await cliente.query(
      'ROLLBACK'
    );

    throw error;
  } finally {
    cliente.release();
  }
}

// ============================================================
// CAMBIAR ESTADO PUBLICACIÓN
// ============================================================

async function cambiarEstadoPublicacion({
  publicacionId,
  activo,
}) {
  const resultado =
      await pool.query(
    `
      UPDATE publicaciones

      SET
        activo = $1,
        fecha_actualizacion =
          CURRENT_TIMESTAMP

      WHERE id = $2

      RETURNING
        id,
        emprendimiento_id,
        producto_id,
        texto,
        activo,
        fecha_creacion,
        fecha_actualizacion
    `,
    [
      activo,
      publicacionId,
    ]
  );

  return resultado
      .rows[0] ||
      null;
}

// ============================================================
// CAMBIAR ESTADO COMENTARIO
// ============================================================

async function cambiarEstadoComentario({
  comentarioId,
  activo,
}) {
  const resultado =
      await pool.query(
    `
      UPDATE comentarios

      SET
        activo = $1,
        fecha_actualizacion =
          CURRENT_TIMESTAMP

      WHERE id = $2

      RETURNING
        id,
        publicacion_id,
        usuario_id,
        texto,
        activo,
        fecha_creacion,
        fecha_actualizacion,
        comentario_padre_id
    `,
    [
      activo,
      comentarioId,
    ]
  );

  return resultado
      .rows[0] ||
      null;
}

// ============================================================

module.exports = {
  crearReporte,
  listarReportes,
  resolverReporte,
  cambiarEstadoPublicacion,
  cambiarEstadoComentario,
};