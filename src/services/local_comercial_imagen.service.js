const pool =
  require('../config/db');


// ============================================================
// VERIFICAR LOCAL PROPIO
// ============================================================

const obtenerLocalPropio =
    async ({
      localId,
      usuarioId,
    }) => {
      const resultado =
          await pool.query(
        `
        SELECT
          id,
          usuario_id

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
// CONTAR IMÁGENES
// ============================================================

const contarImagenes =
    async (
      localId
    ) => {
      const resultado =
          await pool.query(
        `
        SELECT
          COUNT(*)::int AS total

        FROM imagenes_local_comercial

        WHERE local_id = $1
        `,
        [
          localId,
        ]
      );

      return (
        resultado.rows[0]
            .total
      );
    };


// ============================================================
// SIGUIENTE ORDEN
// ============================================================

const siguienteOrden =
    async (
      localId
    ) => {
      const resultado =
          await pool.query(
        `
        SELECT
          COALESCE(
            MAX(orden),
            -1
          ) + 1 AS siguiente

        FROM imagenes_local_comercial

        WHERE local_id = $1
        `,
        [
          localId,
        ]
      );

      return Number(
        resultado.rows[0]
            .siguiente
      );
    };


// ============================================================
// GUARDAR IMAGEN
// ============================================================

const guardarImagen =
    async ({
      localId,
      url,
      publicId,
      orden,
      principal,
    }) => {
      const resultado =
          await pool.query(
        `
        INSERT INTO imagenes_local_comercial
        (
          local_id,
          url,
          public_id,
          orden,
          principal
        )

        VALUES
        (
          $1,
          $2,
          $3,
          $4,
          $5
        )

        RETURNING
          id,
          local_id,
          url,
          public_id,
          orden,
          principal,
          fecha_creacion
        `,
        [
          localId,
          url,
          publicId,
          orden,
          principal,
        ]
      );

      return (
        resultado.rows[0]
      );
    };


// ============================================================
// OBTENER IMAGEN PROPIA
// ============================================================

const obtenerImagenPropia =
    async ({
      imagenId,
      localId,
      usuarioId,
    }) => {
      const resultado =
          await pool.query(
        `
        SELECT
          i.id,
          i.local_id,
          i.url,
          i.public_id,
          i.orden,
          i.principal

        FROM imagenes_local_comercial i

        INNER JOIN locales_comerciales l
          ON l.id = i.local_id

        WHERE i.id = $1
          AND i.local_id = $2
          AND l.usuario_id = $3
          AND l.activo = TRUE

        LIMIT 1
        `,
        [
          imagenId,
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
// ELIMINAR REGISTRO
// ============================================================

const eliminarImagen =
    async ({
      imagenId,
    }) => {
      await pool.query(
        `
        DELETE FROM
          imagenes_local_comercial

        WHERE id = $1
        `,
        [
          imagenId,
        ]
      );
    };


// ============================================================
// DEFINIR PRINCIPAL
// ============================================================

const definirPrincipal =
    async ({
      localId,
      imagenId,
      usuarioId,
    }) => {
      const client =
          await pool.connect();

      try {
        await client.query(
          'BEGIN'
        );


        const imagen =
            await client.query(
          `
          SELECT
            i.id

          FROM imagenes_local_comercial i

          INNER JOIN locales_comerciales l
            ON l.id = i.local_id

          WHERE i.id = $1
            AND i.local_id = $2
            AND l.usuario_id = $3
            AND l.activo = TRUE

          LIMIT 1
          `,
          [
            imagenId,
            localId,
            usuarioId,
          ]
        );


        if (
          imagen.rows.length ===
          0
        ) {
          const error =
              new Error(
                'Imagen no encontrada o no autorizada'
              );

          error.statusCode =
              404;

          throw error;
        }


        await client.query(
          `
          UPDATE
            imagenes_local_comercial

          SET principal = FALSE

          WHERE local_id = $1
          `,
          [
            localId,
          ]
        );


        await client.query(
          `
          UPDATE
            imagenes_local_comercial

          SET principal = TRUE

          WHERE id = $1
          `,
          [
            imagenId,
          ]
        );


        await client.query(
          'COMMIT'
        );

        return true;

      } catch (error) {
        await client.query(
          'ROLLBACK'
        );

        throw error;

      } finally {
        client.release();
      }
    };


// ============================================================
// ESTABLECER OTRA COMO PRINCIPAL
// ============================================================

const asegurarPrincipal =
    async (
      localId
    ) => {
      const existe =
          await pool.query(
        `
        SELECT id

        FROM imagenes_local_comercial

        WHERE local_id = $1
          AND principal = TRUE

        LIMIT 1
        `,
        [
          localId,
        ]
      );


      if (
        existe.rows.length >
        0
      ) {
        return;
      }


      const primera =
          await pool.query(
        `
        SELECT id

        FROM imagenes_local_comercial

        WHERE local_id = $1

        ORDER BY
          orden ASC,
          id ASC

        LIMIT 1
        `,
        [
          localId,
        ]
      );


      if (
        primera.rows.length ===
        0
      ) {
        return;
      }


      await pool.query(
        `
        UPDATE
          imagenes_local_comercial

        SET principal = TRUE

        WHERE id = $1
        `,
        [
          primera.rows[0].id,
        ]
      );
    };


// ============================================================
// EXPORTACIONES
// ============================================================

module.exports = {
  obtenerLocalPropio,
  contarImagenes,
  siguienteOrden,
  guardarImagen,
  obtenerImagenPropia,
  eliminarImagen,
  definirPrincipal,
  asegurarPrincipal,
};