CREATE TABLE IF NOT EXISTS roles (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(30) UNIQUE NOT NULL
);

INSERT INTO roles (nombre)
VALUES
    ('usuario'),
    ('emprendedor'),
    ('administrador')
ON CONFLICT (nombre) DO NOTHING;


CREATE TABLE IF NOT EXISTS usuarios (
    id SERIAL PRIMARY KEY,

    nombre VARCHAR(120) NOT NULL,

    correo VARCHAR(150)
        UNIQUE
        NOT NULL,

    password VARCHAR(255)
        NOT NULL,

    rol_id INTEGER
        NOT NULL,

    activo BOOLEAN
        DEFAULT TRUE,

    fecha_creacion TIMESTAMP
        DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_usuario_rol
        FOREIGN KEY (rol_id)
        REFERENCES roles(id)
);