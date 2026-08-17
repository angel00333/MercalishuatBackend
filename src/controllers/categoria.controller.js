const pool = require('../config/db');


// ============================================
// LISTAR CATEGORIAS
// ============================================

const listarCategorias = async (req, res) => {
  try {
    const resultado = await pool.query(
      `
      SELECT
        id,
        nombre,
        activo
      FROM categorias
      WHERE activo = TRUE
      ORDER BY nombre ASC
      `
    );

    return res.json({
      categorias: resultado.rows,
    });
  } catch (error) {
    console.error('Error listando categorías:', error);

    return res.status(500).json({
      message: 'Error interno del servidor',
    });
  }
};


// ============================================
// CREAR CATEGORIA
// SOLO ADMIN EN EL FUTURO
// ============================================

const crearCategoria = async (req, res) => {
  try {
    const { nombre } = req.body;

    if (!nombre || nombre.trim() === '') {
      return res.status(400).json({
        message: 'El nombre de la categoría es obligatorio',
      });
    }

    const existente = await pool.query(
      `
      SELECT id
      FROM categorias
      WHERE LOWER(nombre) = LOWER($1)
      `,
      [nombre]
    );

    if (existente.rows.length > 0) {
      return res.status(409).json({
        message: 'La categoría ya existe',
      });
    }

    const resultado = await pool.query(
      `
      INSERT INTO categorias (nombre)
      VALUES ($1)

      RETURNING
        id,
        nombre,
        activo
      `,
      [nombre.trim()]
    );

    return res.status(201).json({
      message: 'Categoría creada correctamente',
      categoria: resultado.rows[0],
    });
  } catch (error) {
    console.error('Error creando categoría:', error);

    return res.status(500).json({
      message: 'Error interno del servidor',
    });
  }
};


module.exports = {
  listarCategorias,
  crearCategoria,
};