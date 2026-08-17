const pool = require('../config/db');


// ============================================
// OBTENER TIENDA DEL EMPRENDEDOR
// ============================================

const obtenerEmprendimientoDelUsuario = async (usuarioId) => {
  const resultado = await pool.query(
    `
    SELECT id
    FROM emprendimientos
    WHERE usuario_id = $1
      AND activo = TRUE
    `,
    [usuarioId]
  );

  return resultado.rows[0] || null;
};


// ============================================
// CREAR PRODUCTO
// ============================================

const crearProducto = async (req, res) => {
  try {
    const usuarioId = req.usuario.id;

    const {
      categoria_id,
      nombre,
      descripcion,
      precio,
      disponible,
    } = req.body;

    if (
      !categoria_id ||
      !nombre ||
      nombre.trim() === '' ||
      precio === undefined ||
      precio === null
    ) {
      return res.status(400).json({
        message: 'Categoría, nombre y precio son obligatorios',
      });
    }

    const precioNumero = Number(precio);

    if (Number.isNaN(precioNumero) || precioNumero < 0) {
      return res.status(400).json({
        message: 'El precio no es válido',
      });
    }

    const emprendimiento =
      await obtenerEmprendimientoDelUsuario(usuarioId);

    if (!emprendimiento) {
      return res.status(400).json({
        message: 'Primero debes crear tu emprendimiento',
      });
    }

    const categoria = await pool.query(
      `
      SELECT id
      FROM categorias
      WHERE id = $1
        AND activo = TRUE
      `,
      [categoria_id]
    );

    if (categoria.rows.length === 0) {
      return res.status(400).json({
        message: 'La categoría seleccionada no existe',
      });
    }

    const resultado = await pool.query(
      `
      INSERT INTO productos
      (
        emprendimiento_id,
        categoria_id,
        nombre,
        descripcion,
        precio,
        disponible
      )

      VALUES ($1, $2, $3, $4, $5, $6)

      RETURNING
        id,
        emprendimiento_id,
        categoria_id,
        nombre,
        descripcion,
        precio,
        disponible,
        fecha_creacion,
        fecha_actualizacion
      `,
      [
        emprendimiento.id,
        categoria_id,
        nombre.trim(),
        descripcion?.trim() || null,
        precioNumero,
        disponible ?? true,
      ]
    );

    return res.status(201).json({
      message: 'Producto creado correctamente',
      producto: resultado.rows[0],
    });
  } catch (error) {
    console.error('Error creando producto:', error);

    return res.status(500).json({
      message: 'Error interno del servidor',
    });
  }
};


// ============================================
// MIS PRODUCTOS
// ============================================

const listarMisProductos = async (req, res) => {
  try {
    const usuarioId = req.usuario.id;

    const emprendimiento =
      await obtenerEmprendimientoDelUsuario(usuarioId);

    if (!emprendimiento) {
      return res.json({
        productos: [],
      });
    }

    const resultado = await pool.query(
      `
      SELECT
        p.id,
        p.nombre,
        p.descripcion,
        p.precio,
        p.disponible,
        p.fecha_creacion,
        p.fecha_actualizacion,

        c.id AS categoria_id,
        c.nombre AS categoria

      FROM productos p

      INNER JOIN categorias c
        ON c.id = p.categoria_id

      WHERE p.emprendimiento_id = $1

      ORDER BY p.fecha_creacion DESC
      `,
      [emprendimiento.id]
    );

    return res.json({
      productos: resultado.rows,
    });
  } catch (error) {
    console.error('Error listando productos:', error);

    return res.status(500).json({
      message: 'Error interno del servidor',
    });
  }
};


// ============================================
// PRODUCTOS DE UNA TIENDA
// ============================================

const listarProductosPorEmprendimiento = async (req, res) => {
  try {
    const { emprendimientoId } = req.params;

    const resultado = await pool.query(
      `
      SELECT
        p.id,
        p.nombre,
        p.descripcion,
        p.precio,
        p.disponible,
        p.fecha_creacion,

        c.id AS categoria_id,
        c.nombre AS categoria

      FROM productos p

      INNER JOIN categorias c
        ON c.id = p.categoria_id

      INNER JOIN emprendimientos e
        ON e.id = p.emprendimiento_id

      WHERE p.emprendimiento_id = $1
        AND e.activo = TRUE

      ORDER BY p.fecha_creacion DESC
      `,
      [emprendimientoId]
    );

    return res.json({
      productos: resultado.rows,
    });
  } catch (error) {
    console.error('Error listando catálogo:', error);

    return res.status(500).json({
      message: 'Error interno del servidor',
    });
  }
};


// ============================================
// DETALLE PRODUCTO
// ============================================

const obtenerProductoPorId = async (req, res) => {
  try {
    const { id } = req.params;

    const resultado = await pool.query(
      `
      SELECT
        p.id,
        p.nombre,
        p.descripcion,
        p.precio,
        p.disponible,
        p.fecha_creacion,

        c.id AS categoria_id,
        c.nombre AS categoria,

        e.id AS emprendimiento_id,
        e.nombre AS emprendimiento

      FROM productos p

      INNER JOIN categorias c
        ON c.id = p.categoria_id

      INNER JOIN emprendimientos e
        ON e.id = p.emprendimiento_id

      WHERE p.id = $1
        AND e.activo = TRUE
      `,
      [id]
    );

    if (resultado.rows.length === 0) {
      return res.status(404).json({
        message: 'Producto no encontrado',
      });
    }

    return res.json({
      producto: resultado.rows[0],
    });
  } catch (error) {
    console.error('Error obteniendo producto:', error);

    return res.status(500).json({
      message: 'Error interno del servidor',
    });
  }
};


// ============================================
// EDITAR PRODUCTO
// ============================================

const editarProducto = async (req, res) => {
  try {
    const usuarioId = req.usuario.id;
    const { id } = req.params;

    const {
      categoria_id,
      nombre,
      descripcion,
      precio,
      disponible,
    } = req.body;

    if (
      !categoria_id ||
      !nombre ||
      nombre.trim() === '' ||
      precio === undefined ||
      precio === null
    ) {
      return res.status(400).json({
        message: 'Categoría, nombre y precio son obligatorios',
      });
    }

    const precioNumero = Number(precio);

    if (Number.isNaN(precioNumero) || precioNumero < 0) {
      return res.status(400).json({
        message: 'El precio no es válido',
      });
    }

    const emprendimiento =
      await obtenerEmprendimientoDelUsuario(usuarioId);

    if (!emprendimiento) {
      return res.status(404).json({
        message: 'Emprendimiento no encontrado',
      });
    }

    const resultado = await pool.query(
      `
      UPDATE productos

      SET
        categoria_id = $1,
        nombre = $2,
        descripcion = $3,
        precio = $4,
        disponible = $5,
        fecha_actualizacion = CURRENT_TIMESTAMP

      WHERE id = $6
        AND emprendimiento_id = $7

      RETURNING
        id,
        emprendimiento_id,
        categoria_id,
        nombre,
        descripcion,
        precio,
        disponible,
        fecha_creacion,
        fecha_actualizacion
      `,
      [
        categoria_id,
        nombre.trim(),
        descripcion?.trim() || null,
        precioNumero,
        disponible ?? true,
        id,
        emprendimiento.id,
      ]
    );

    if (resultado.rows.length === 0) {
      return res.status(404).json({
        message: 'Producto no encontrado',
      });
    }

    return res.json({
      message: 'Producto actualizado correctamente',
      producto: resultado.rows[0],
    });
  } catch (error) {
    console.error('Error actualizando producto:', error);

    return res.status(500).json({
      message: 'Error interno del servidor',
    });
  }
};


// ============================================
// ELIMINAR PRODUCTO
// ============================================

const eliminarProducto = async (req, res) => {
  try {
    const usuarioId = req.usuario.id;
    const { id } = req.params;

    const emprendimiento =
      await obtenerEmprendimientoDelUsuario(usuarioId);

    if (!emprendimiento) {
      return res.status(404).json({
        message: 'Emprendimiento no encontrado',
      });
    }

    const resultado = await pool.query(
      `
      DELETE FROM productos

      WHERE id = $1
        AND emprendimiento_id = $2

      RETURNING id
      `,
      [
        id,
        emprendimiento.id,
      ]
    );

    if (resultado.rows.length === 0) {
      return res.status(404).json({
        message: 'Producto no encontrado',
      });
    }

    return res.json({
      message: 'Producto eliminado correctamente',
    });
  } catch (error) {
    console.error('Error eliminando producto:', error);

    return res.status(500).json({
      message: 'Error interno del servidor',
    });
  }
};


module.exports = {
  crearProducto,
  listarMisProductos,
  listarProductosPorEmprendimiento,
  obtenerProductoPorId,
  editarProducto,
  eliminarProducto,
};