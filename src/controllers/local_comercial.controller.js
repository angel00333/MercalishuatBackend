const LocalComercialService =
  require(
    '../services/local_comercial.service'
  );


// ============================================================
// HELPERS
// ============================================================

const enteroPositivo = (
  valor,
  fallback
) => {
  const numero =
      Number.parseInt(
        valor,
        10
      );

  if (
    !Number.isInteger(
      numero
    ) ||
    numero <= 0
  ) {
    return fallback;
  }

  return numero;
};


const numeroOpcional = (
  valor
) => {
  if (
    valor === undefined ||
    valor === null ||
    valor === ''
  ) {
    return null;
  }

  const numero =
      Number(valor);

  if (
    !Number.isFinite(
      numero
    )
  ) {
    return null;
  }

  return numero;
};


const texto = (
  valor
) => {
  if (
    typeof valor !==
    'string'
  ) {
    return '';
  }

  return valor.trim();
};


// ============================================================
// LISTAR
// ============================================================

const listar = async (
  req,
  res
) => {
  try {
    const pagina =
        enteroPositivo(
          req.query.pagina,
          1
        );

    const limiteSolicitado =
        enteroPositivo(
          req.query.limite,
          20
        );

    const limite =
        Math.min(
          limiteSolicitado,
          50
        );


    const precioMin =
        req.query.precio_min !==
        undefined
            ? Number(
                req.query.precio_min
              )
            : null;

    const precioMax =
        req.query.precio_max !==
        undefined
            ? Number(
                req.query.precio_max
              )
            : null;


    const resultado =
        await LocalComercialService
            .listar({
      pagina,
      limite,

      buscar:
          req.query.buscar,

      tipoOperacion:
          req.query.tipo_operacion,

      tipoLocal:
          req.query.tipo_local,

      departamento:
          req.query.departamento,

      municipio:
          req.query.municipio,

      precioMin:
          Number.isFinite(
            precioMin
          )
              ? precioMin
              : null,

      precioMax:
          Number.isFinite(
            precioMax
          )
              ? precioMax
              : null,
    });


    return res.json({
      ok:
          true,

      data:
          resultado.locales,

      paginacion: {
        pagina:
            resultado.pagina,

        limite:
            resultado.limite,

        total:
            resultado.total,

        paginas:
            resultado.paginas,
      },
    });

  } catch (error) {
    console.error(
      'Error listando locales comerciales:',
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


// ============================================================
// MIS LOCALES
// ============================================================

const listarMios = async (
  req,
  res
) => {
  try {
    const locales =
        await LocalComercialService
            .listarMios({
      usuarioId:
          req.usuario.id,
    });


    return res.json({
      ok:
          true,

      data:
          locales,
    });

  } catch (error) {
    console.error(
      'Error listando mis locales:',
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


// ============================================================
// OBTENER
// ============================================================

const obtener = async (
  req,
  res
) => {
  try {
    const localId =
        enteroPositivo(
          req.params.id,
          null
        );


    if (!localId) {
      return res
          .status(400)
          .json({
        message:
            'ID de local inválido',
      });
    }


    const local =
        await LocalComercialService
            .obtenerPorId(
      localId
    );


    if (!local) {
      return res
          .status(404)
          .json({
        message:
            'Local comercial no encontrado',
      });
    }


    return res.json({
      ok:
          true,

      data:
          local,
    });

  } catch (error) {
    console.error(
      'Error obteniendo local:',
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


// ============================================================
// CREAR
// ============================================================

const crear = async (
  req,
  res
) => {
  try {
    const {
      titulo,
      descripcion,
      tipo_operacion,
      tipo_local,
      precio,
      departamento,
      municipio,
      direccion,
      latitud,
      longitud,
      contacto_nombre,
      contacto_telefono,
      contacto_whatsapp,
      contacto_correo,
    } = req.body;


    // ==========================================================
    // TEXTOS OBLIGATORIOS
    // ==========================================================

    if (
      !texto(titulo)
    ) {
      return res
          .status(400)
          .json({
        message:
            'El título es obligatorio',
      });
    }


    if (
      !texto(descripcion)
    ) {
      return res
          .status(400)
          .json({
        message:
            'La descripción es obligatoria',
      });
    }


    if (
      !texto(tipo_local)
    ) {
      return res
          .status(400)
          .json({
        message:
            'El tipo de local es obligatorio',
      });
    }


    if (
      !texto(departamento)
    ) {
      return res
          .status(400)
          .json({
        message:
            'El departamento es obligatorio',
      });
    }


    if (
      !texto(municipio)
    ) {
      return res
          .status(400)
          .json({
        message:
            'El municipio es obligatorio',
      });
    }


    if (
      !texto(direccion)
    ) {
      return res
          .status(400)
          .json({
        message:
            'La dirección es obligatoria',
      });
    }


    // ==========================================================
    // OPERACIÓN
    // ==========================================================

    const operacion =
        texto(
          tipo_operacion
        ).toLowerCase();


    if (
      operacion !==
          'venta' &&
      operacion !==
          'alquiler'
    ) {
      return res
          .status(400)
          .json({
        message:
            'El tipo de operación debe ser venta o alquiler',
      });
    }


    // ==========================================================
    // PRECIO
    // ==========================================================

    const precioNumero =
        Number(precio);


    if (
      !Number.isFinite(
        precioNumero
      ) ||
      precioNumero < 0
    ) {
      return res
          .status(400)
          .json({
        message:
            'El precio es inválido',
      });
    }


    // ==========================================================
    // COORDENADAS
    // ==========================================================

    const latitudNumero =
        numeroOpcional(
          latitud
        );

    const longitudNumero =
        numeroOpcional(
          longitud
        );


    if (
      latitudNumero !== null &&
      (
        latitudNumero < -90 ||
        latitudNumero > 90
      )
    ) {
      return res
          .status(400)
          .json({
        message:
            'Latitud inválida',
      });
    }


    if (
      longitudNumero !== null &&
      (
        longitudNumero < -180 ||
        longitudNumero > 180
      )
    ) {
      return res
          .status(400)
          .json({
        message:
            'Longitud inválida',
      });
    }


    // ==========================================================
    // CONTACTO
    // ==========================================================

    const telefono =
        texto(
          contacto_telefono
        );

    const whatsapp =
        texto(
          contacto_whatsapp
        );

    const correo =
        texto(
          contacto_correo
        );


    if (
      !telefono &&
      !whatsapp &&
      !correo
    ) {
      return res
          .status(400)
          .json({
        message:
            'Debes proporcionar al menos un medio de contacto',
      });
    }


    // ==========================================================
    // CREAR
    // ==========================================================

    const local =
        await LocalComercialService
            .crear({
      usuarioId:
          req.usuario.id,

      titulo:
          texto(titulo),

      descripcion:
          texto(descripcion),

      tipoOperacion:
          operacion,

      tipoLocal:
          texto(tipo_local),

      precio:
          precioNumero,

      departamento:
          texto(departamento),

      municipio:
          texto(municipio),

      direccion:
          texto(direccion),

      latitud:
          latitudNumero,

      longitud:
          longitudNumero,

      contactoNombre:
          texto(
            contacto_nombre
          ) || null,

      contactoTelefono:
          telefono || null,

      contactoWhatsapp:
          whatsapp || null,

      contactoCorreo:
          correo || null,
    });


    return res
        .status(201)
        .json({
      ok:
          true,

      message:
          'Local comercial publicado correctamente',

      data:
          local,
    });

  } catch (error) {
    console.error(
      'Error creando local comercial:',
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


// ============================================================
// ACTUALIZAR
// ============================================================

const actualizar = async (
  req,
  res
) => {
  try {
    const localId =
        enteroPositivo(
          req.params.id,
          null
        );


    if (!localId) {
      return res
          .status(400)
          .json({
        message:
            'ID de local inválido',
      });
    }


    const cambios = {};


    // ==========================================================
    // TEXTOS
    // ==========================================================

    const camposTexto = [
      'titulo',
      'descripcion',
      'tipo_local',
      'departamento',
      'municipio',
      'direccion',
      'contacto_nombre',
      'contacto_telefono',
      'contacto_whatsapp',
      'contacto_correo',
    ];


    for (
      const campo of
      camposTexto
    ) {
      if (
        Object.prototype
            .hasOwnProperty.call(
              req.body,
              campo
            )
      ) {
        cambios[campo] =
            texto(
              req.body[campo]
            ) || null;
      }
    }


    // ==========================================================
    // OPERACIÓN
    // ==========================================================

    if (
      Object.prototype
          .hasOwnProperty.call(
            req.body,
            'tipo_operacion'
          )
    ) {
      const operacion =
          texto(
            req.body
                .tipo_operacion
          ).toLowerCase();


      if (
        operacion !==
            'venta' &&
        operacion !==
            'alquiler'
      ) {
        return res
            .status(400)
            .json({
          message:
              'El tipo de operación debe ser venta o alquiler',
        });
      }


      cambios.tipo_operacion =
          operacion;
    }


    // ==========================================================
    // PRECIO
    // ==========================================================

    if (
      Object.prototype
          .hasOwnProperty.call(
            req.body,
            'precio'
          )
    ) {
      const numero =
          Number(
            req.body.precio
          );


      if (
        !Number.isFinite(
          numero
        ) ||
        numero < 0
      ) {
        return res
            .status(400)
            .json({
          message:
              'El precio es inválido',
        });
      }


      cambios.precio =
          numero;
    }


    // ==========================================================
    // LATITUD
    // ==========================================================

    if (
      Object.prototype
          .hasOwnProperty.call(
            req.body,
            'latitud'
          )
    ) {
      const numero =
          numeroOpcional(
            req.body.latitud
          );


      if (
        numero !== null &&
        (
          numero < -90 ||
          numero > 90
        )
      ) {
        return res
            .status(400)
            .json({
          message:
              'Latitud inválida',
        });
      }


      cambios.latitud =
          numero;
    }


    // ==========================================================
    // LONGITUD
    // ==========================================================

    if (
      Object.prototype
          .hasOwnProperty.call(
            req.body,
            'longitud'
          )
    ) {
      const numero =
          numeroOpcional(
            req.body.longitud
          );


      if (
        numero !== null &&
        (
          numero < -180 ||
          numero > 180
        )
      ) {
        return res
            .status(400)
            .json({
          message:
              'Longitud inválida',
        });
      }


      cambios.longitud =
          numero;
    }


    const local =
        await LocalComercialService
            .actualizar({
      localId,

      usuarioId:
          req.usuario.id,

      cambios,
    });


    return res.json({
      ok:
          true,

      message:
          'Local comercial actualizado correctamente',

      data:
          local,
    });

  } catch (error) {
    console.error(
      'Error actualizando local comercial:',
      error
    );


    return res
        .status(
          error.statusCode ||
              500
        )
        .json({
      message:
          error.statusCode
              ? error.message
              : 'Error interno del servidor',
    });
  }
};


// ============================================================
// DISPONIBILIDAD
// ============================================================

const cambiarDisponibilidad =
    async (
      req,
      res
    ) => {
      try {
        const localId =
            enteroPositivo(
              req.params.id,
              null
            );


        if (!localId) {
          return res
              .status(400)
              .json({
            message:
                'ID de local inválido',
          });
        }


        const {
          disponible,
        } = req.body;


        if (
          typeof disponible !==
          'boolean'
        ) {
          return res
              .status(400)
              .json({
            message:
                'El campo disponible debe ser booleano',
          });
        }


        const local =
            await LocalComercialService
                .cambiarDisponibilidad({
          localId,

          usuarioId:
              req.usuario.id,

          disponible,
        });


        return res.json({
          ok:
              true,

          message:
              disponible
                  ? 'Local marcado como disponible'
                  : 'Local marcado como no disponible',

          data:
              local,
        });

      } catch (error) {
        console.error(
          'Error cambiando disponibilidad:',
          error
        );


        return res
            .status(
              error.statusCode ||
                  500
            )
            .json({
          message:
              error.statusCode
                  ? error.message
                  : 'Error interno del servidor',
        });
      }
    };


// ============================================================
// ELIMINAR
// ============================================================

const eliminar = async (
  req,
  res
) => {
  try {
    const localId =
        enteroPositivo(
          req.params.id,
          null
        );


    if (!localId) {
      return res
          .status(400)
          .json({
        message:
            'ID de local inválido',
      });
    }


    await LocalComercialService
        .eliminar({
      localId,

      usuarioId:
          req.usuario.id,
    });


    return res.json({
      ok:
          true,

      message:
          'Local comercial eliminado correctamente',
    });

  } catch (error) {
    console.error(
      'Error eliminando local comercial:',
      error
    );


    return res
        .status(
          error.statusCode ||
              500
        )
        .json({
      message:
          error.statusCode
              ? error.message
              : 'Error interno del servidor',
    });
  }
};


// ============================================================
// EXPORTACIONES
// ============================================================

module.exports = {
  listar,
  listarMios,
  obtener,
  crear,
  actualizar,
  cambiarDisponibilidad,
  eliminar,
};