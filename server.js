require('dotenv').config();

const app =
  require('./src/app');

const pool =
  require('./src/config/db');


const PORT =
  process.env.PORT || 3000;


async function iniciarServidor() {

  try {

    await pool.query(
      'SELECT NOW()'
    );


    console.log(
      'Base de datos conectada correctamente'
    );


    app.listen(
      PORT,
      '0.0.0.0',
      () => {

        console.log(
          `Mercalishuat API ejecutándose en puerto ${PORT}`
        );

      }
    );


  } catch (error) {

    console.error(
      'No fue posible conectar con PostgreSQL:',
      error
    );


    process.exit(1);
  }
}


iniciarServidor();