/* =====================================================
   MOTOR DE POWERPOINT
   ManyaTuProfe / Reportes
===================================================== */


/* =====================================================
   CONFIGURACIÓN DE LOS ESPACIOS FOTOGRÁFICOS
===================================================== */

const PPT_LAYOUT = {

    fotoIzquierda: {
        x: 3.26,
        y: 1.15,
        width: 3,
        height: 3
    },

    fotoDerecha: {
        x: 6.65,
        y: 1.16,
        width: 3,
        height: 3
    }

};


/* =====================================================
   CALCULAR AJUSTE PROPORCIONAL
===================================================== */

function calcularPosicionFoto(
    imagenWidth,
    imagenHeight,
    espacio
) {

    const aspectRatio =
        imagenWidth / imagenHeight;


    const espacioRatio =
        espacio.width / espacio.height;


    let width;
    let height;


    /*
    FOTO HORIZONTAL
    */

    if (aspectRatio > espacioRatio) {

        width =
            espacio.width;

        height =
            width / aspectRatio;

    }


    /*
    FOTO VERTICAL
    */

    else if (
        aspectRatio < espacioRatio
    ) {

        height =
            espacio.height;

        width =
            height * aspectRatio;

    }


    /*
    FOTO CUADRADA
    */

    else {

        width =
            espacio.width;

        height =
            espacio.height;

    }


    /*
    ALINEACIÓN
    */

    let x =
        espacio.x +
        (
            espacio.width -
            width
        ) / 2;


    let y =
        espacio.y +
        (
            espacio.height -
            height
        ) / 2;


    return {

        x,
        y,
        width,
        height

    };

}