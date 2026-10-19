/* =========================================================
   REPORTE.JS
   Gestión de la estructura y datos del reporte
   ========================================================= */


/* =========================================================
   1. ESTADO ACTUAL DEL REPORTE
========================================================= */

let reporteActual = {
    id: reporteGenerarId(),
    nombre: "",
    fecha: reporteFechaActual(),
    estado: "borrador",
    cadenas: []
};


/* =========================================================
   2. GENERAR ID ÚNICO
========================================================= */

function reporteGenerarId() {

    return Date.now().toString(36) +
        Math.random()
            .toString(36)
            .substring(2, 8);

}


/* =========================================================
   3. OBTENER FECHA ACTUAL
========================================================= */

function reporteFechaActual() {

    const fecha = new Date();

    const año = fecha.getFullYear();

    const mes = String(
        fecha.getMonth() + 1
    ).padStart(2, "0");

    const dia = String(
        fecha.getDate()
    ).padStart(2, "0");

    return `${año}-${mes}-${dia}`;

}


/* =========================================================
   4. CREAR NUEVO REPORTE
========================================================= */

function crearReporte(
    nombre,
    fecha = reporteFechaActual()
) {

    reporteActual = {

        id: reporteGenerarId(),

        nombre: nombre,

        fecha: fecha,

        estado: "borrador",

        cadenas: []

    };

    console.log(
        "Nuevo reporte creado:",
        reporteActual
    );

    return reporteActual;

}


/* =========================================================
   5. AGREGAR CADENA
========================================================= */

function agregarCadena(
    cadenaId,
    cadenaNombre
) {

    const existe =
        reporteActual.cadenas.some(
            cadena =>
                cadena.id === cadenaId
        );

    if (existe) {

        console.warn(
            `La cadena "${cadenaNombre}" ya está agregada.`
        );

        return reporteActual.cadenas.find(
            cadena =>
                cadena.id === cadenaId
        );

    }


    const nuevaCadena = {

        id: cadenaId,

        nombre: cadenaNombre,

        sucursales: []

    };


    reporteActual.cadenas.push(
        nuevaCadena
    );


    console.log(
        `Cadena agregada: ${cadenaNombre}`
    );


    return nuevaCadena;

}


/* =========================================================
   6. ELIMINAR CADENA
========================================================= */

function eliminarCadena(
    cadenaId
) {

    reporteActual.cadenas =
        reporteActual.cadenas.filter(
            cadena =>
                cadena.id !== cadenaId
        );

    return true;

}


/* =========================================================
   7. AGREGAR SUCURSAL
========================================================= */

function agregarSucursal(
    cadenaId,
    sucursalId,
    sucursalNombre
) {

    const cadena =
        reporteActual.cadenas.find(
            cadena =>
                cadena.id === cadenaId
        );


    if (!cadena) {

        console.error(
            "No se encontró la cadena:",
            cadenaId
        );

        return null;

    }


    const existe =
        cadena.sucursales.find(
            sucursal =>
                sucursal.id === sucursalId
        );


    if (existe) {

        console.warn(
            `La sucursal "${sucursalNombre}" ya está agregada.`
        );

        return existe;

    }


    const nuevaSucursal = {

        id: sucursalId,

        nombre: sucursalNombre,

        fotografias: []

    };


    cadena.sucursales.push(
        nuevaSucursal
    );


    console.log(
        `Sucursal agregada: ${sucursalNombre}`
    );


    return nuevaSucursal;

}


/* =========================================================
   8. ELIMINAR SUCURSAL
========================================================= */

function eliminarSucursal(
    cadenaId,
    sucursalId
) {

    const cadena =
        reporteActual.cadenas.find(
            cadena =>
                cadena.id === cadenaId
        );


    if (!cadena) {

        console.error(
            "Cadena no encontrada:",
            cadenaId
        );

        return false;

    }


    cadena.sucursales =
        cadena.sucursales.filter(
            sucursal =>
                sucursal.id !== sucursalId
        );


    return true;

}


/* =========================================================
   9. AGREGAR FOTOGRAFÍA
========================================================= */

function agregarFotografia(
    cadenaId,
    sucursalId,
    fotografia
) {

    const cadena =
        reporteActual.cadenas.find(
            cadena =>
                cadena.id === cadenaId
        );


    if (!cadena) {

        console.error(
            "Cadena no encontrada:",
            cadenaId
        );

        return null;

    }


    const sucursal =
        cadena.sucursales.find(
            sucursal =>
                sucursal.id === sucursalId
        );


    if (!sucursal) {

        console.error(
            "Sucursal no encontrada:",
            sucursalId
        );

        return null;

    }


    if (!fotografia) {

        console.error(
            "No se recibió una fotografía válida."
        );

        return null;

    }


    /*
    Si se recibe el objeto temporal
    creado por app.js, obtener el archivo real.
    */

    const archivoReal =
        fotografia.archivo ||
        fotografia;


    if (
        !archivoReal ||
        !archivoReal.name
    ) {

        console.error(
            "El archivo recibido no es válido:",
            fotografia
        );

        return null;

    }


    const foto = {

        id: reporteGenerarId(),

        nombre:
            archivoReal.name,

        archivo:
            archivoReal,

        url:
            URL.createObjectURL(
                archivoReal
            ),

        orden:
            sucursal.fotografias.length + 1

    };


    sucursal.fotografias.push(
        foto
    );


    console.log(
        `Fotografía agregada a ${sucursal.nombre}`
    );


    return foto;

}


/* =========================================================
   10. ELIMINAR FOTOGRAFÍA
========================================================= */

function eliminarFotografia(
    cadenaId,
    sucursalId,
    fotografiaId
) {

    const cadena =
        reporteActual.cadenas.find(
            cadena =>
                cadena.id === cadenaId
        );


    if (!cadena) {

        return false;

    }


    const sucursal =
        cadena.sucursales.find(
            sucursal =>
                sucursal.id === sucursalId
        );


    if (!sucursal) {

        return false;

    }


    const fotografia =
        sucursal.fotografias.find(
            foto =>
                foto.id === fotografiaId
        );


    if (!fotografia) {

        return false;

    }


    if (fotografia.url) {

        URL.revokeObjectURL(
            fotografia.url
        );

    }


    sucursal.fotografias =
        sucursal.fotografias.filter(
            foto =>
                foto.id !== fotografiaId
        );


    sucursal.fotografias.forEach(
        (foto, index) => {

            foto.orden =
                index + 1;

        }
    );


    return true;

}


/* =========================================================
   11. OBTENER UNA CADENA
========================================================= */

function obtenerCadena(
    cadenaId
) {

    if (!reporteActual) {

        return null;

    }


    return reporteActual.cadenas.find(
        cadena =>
            cadena.id === cadenaId
    ) || null;

}


/* =========================================================
   12. OBTENER UNA SUCURSAL
========================================================= */

function obtenerSucursal(
    cadenaId,
    sucursalId
) {

    const cadena =
        obtenerCadena(
            cadenaId
        );


    if (!cadena) {

        return null;

    }


    return cadena.sucursales.find(
        sucursal =>
            sucursal.id === sucursalId
    ) || null;

}


/* =========================================================
   13. CONTAR FOTOGRAFÍAS
========================================================= */

function contarFotografias() {

    if (!reporteActual) {

        return 0;

    }


    let total = 0;


    reporteActual.cadenas.forEach(
        cadena => {

            cadena.sucursales.forEach(
                sucursal => {

                    total +=
                        sucursal.fotografias.length;

                }
            );

        }
    );


    return total;

}


/* =========================================================
   14. VALIDAR REPORTE
========================================================= */

function validarReporte() {

    const errores = [];


    if (
        !reporteActual ||
        !reporteActual.nombre ||
        !reporteActual.nombre.trim()
    ) {

        errores.push(
            "El reporte necesita un nombre."
        );

    }


    if (
        !reporteActual ||
        reporteActual.cadenas.length === 0
    ) {

        errores.push(
            "Debes seleccionar al menos una cadena."
        );

    }


    if (reporteActual) {

        reporteActual.cadenas.forEach(
            cadena => {

                if (
                    cadena.sucursales.length === 0
                ) {

                    errores.push(
                        `${cadena.nombre} no tiene sucursales seleccionadas.`
                    );

                }


                cadena.sucursales.forEach(
                    sucursal => {

                        if (
                            sucursal.fotografias.length === 0
                        ) {

                            errores.push(
                                `${sucursal.nombre} no tiene fotografías.`
                            );

                        }

                    }
                );

            }
        );

    }


    return {

        valido:
            errores.length === 0,

        errores:
            errores

    };

}


/* =========================================================
   15. CAMBIAR ESTADO
========================================================= */

function cambiarEstadoReporte(
    nuevoEstado
) {

    const estadosPermitidos = [

        "borrador",

        "en-revision",

        "completado",

        "generado"

    ];


    if (
        !estadosPermitidos.includes(
            nuevoEstado
        )
    ) {

        console.error(
            "Estado no válido:",
            nuevoEstado
        );

        return false;

    }


    reporteActual.estado =
        nuevoEstado;


    return true;

}


/* =========================================================
   16. OBTENER REPORTE COMPLETO
========================================================= */

function obtenerReporte() {

    return reporteActual;

}


/* =========================================================
   17. MOSTRAR REPORTE EN CONSOLA
========================================================= */

function mostrarReporte() {

    console.log(
        "================================="
    );

    console.log(
        "REPORTE ACTUAL"
    );

    console.log(
        "================================="
    );

    console.log(
        reporteActual
    );

    console.log(
        "Cadenas:",
        reporteActual.cadenas.length
    );

    console.log(
        "Fotografías:",
        contarFotografias()
    );

}


/* =========================================================
   18. SELECCIONAR CADENA
========================================================= */

function seleccionarCadena(
    cadenaDato
) {

    /*
    Permitir tanto:

    seleccionarCadena("tottus")

    como:

    seleccionarCadena({
        id: "tottus",
        nombre: "Tottus"
    })
    */

    let cadenaId = cadenaDato;

    if (
        typeof cadenaDato === "object" &&
        cadenaDato !== null
    ) {

        cadenaId =
            cadenaDato.id ||
            cadenaDato.value;

    }


    const cadena =
        cadenas.find(
            item =>
                item.id === cadenaId
        );


    if (!cadena) {

        console.error(
            "Cadena no encontrada:",
            cadenaDato
        );

        return null;

    }


    return agregarCadena(
        cadena.id,
        cadena.nombre
    );

}


/* =========================================================
   19. GENERAR ID DE SUCURSAL
========================================================= */

function reporteSlugify(
    texto
) {

    if (
        texto === null ||
        texto === undefined
    ) {

        return "";

    }


    return String(texto)
        .toLowerCase()
        .normalize("NFD")
        .replace(
            /[\u0300-\u036f]/g,
            ""
        )
        .replace(
            /[^a-z0-9]+/g,
            "-"
        )
        .replace(
            /(^-|-$)/g,
            ""
        );

}


/* =========================================================
   20. NORMALIZAR NOMBRE DE SUCURSAL
========================================================= */

function obtenerNombreSucursal(
    sucursalDato
) {

    /*
    Caso 1:
    "Tottus Puruchuco"
    */

    if (
        typeof sucursalDato === "string"
    ) {

        return sucursalDato.trim();

    }


    /*
    Caso 2:
    {
        nombre: "Tottus Puruchuco"
    }
    */

    if (
        sucursalDato &&
        typeof sucursalDato.nombre === "string"
    ) {

        return sucursalDato.nombre.trim();

    }


    /*
    Caso 3:
    Elemento HTML:
    <input value="Tottus Puruchuco">
    */

    if (
        sucursalDato &&
        typeof sucursalDato.value === "string"
    ) {

        return sucursalDato.value.trim();

    }


    /*
    Caso 4:
    Objeto con texto
    */

    if (
        sucursalDato &&
        typeof sucursalDato.textContent === "string"
    ) {

        return sucursalDato.textContent.trim();

    }


    return "";

}


/* =========================================================
   21. SELECCIONAR SUCURSAL
========================================================= */

function seleccionarSucursal(
    cadenaId,
    sucursalEntrada
) {

    const cadena =
        cadenas.find(
            item =>
                item.id === cadenaId
        );


    if (!cadena) {

        console.error(
            "Cadena no encontrada:",
            cadenaId
        );

        return null;

    }


    /*
    =========================================================
    NORMALIZAR SUCURSAL

    app.js puede enviar la sucursal como:

    1. Texto:
       "Tottus Puruchuco"

    2. Objeto:
       {
           id: "...",
           nombre: "Tottus Puruchuco"
       }

    Esta función acepta ambas formas.
    =========================================================
    */

    let sucursalNombre = "";


    if (
        typeof sucursalEntrada === "string"
    ) {

        sucursalNombre =
            sucursalEntrada.trim();

    }


    else if (
        sucursalEntrada &&
        typeof sucursalEntrada === "object"
    ) {

        sucursalNombre =
            sucursalEntrada.nombre ||
            sucursalEntrada.name ||
            sucursalEntrada.label ||
            "";

    }


    /*
    Validar nombre obtenido
    */

    if (!sucursalNombre) {

        console.error(
            "No se pudo determinar el nombre de la sucursal:",
            sucursalEntrada
        );

        return null;

    }


    /*
    =========================================================
    BUSCAR SUCURSAL EN data.js

    Soporta tanto sucursales guardadas
    como strings como objetos.
    =========================================================
    */

    const sucursalEncontrada =
        cadena.sucursales.find(
            item => {

                /*
                Caso 1:
                sucursal = "Tottus Puruchuco"
                */

                if (
                    typeof item === "string"
                ) {

                    return (
                        item === sucursalNombre
                    );

                }


                /*
                Caso 2:
                sucursal = {
                    id: "...",
                    nombre: "Tottus Puruchuco"
                }
                */

                if (
                    item &&
                    typeof item === "object"
                ) {

                    return (

                        item.nombre ===
                            sucursalNombre

                        ||

                        item.name ===
                            sucursalNombre

                        ||

                        item.label ===
                            sucursalNombre

                    );

                }


                return false;

            }
        );


    /*
    =========================================================
    SI NO ENCONTRAMOS POR NOMBRE,
    INTENTAR POR ID / SLUG
    =========================================================
    */

    let nombreFinal =
        sucursalNombre;


    if (!sucursalEncontrada) {

        const sucursalIdEntrada =
            (
                sucursalEntrada &&
                typeof sucursalEntrada === "object"
            )
                ? (
                    sucursalEntrada.id ||
                    sucursalEntrada.value ||
                    ""
                )
                : "";


        if (sucursalIdEntrada) {

            const encontradaPorId =
                cadena.sucursales.find(
                    item => {

                        if (
                            !item ||
                            typeof item !== "object"
                        ) {

                            return false;

                        }


                        return (
                            item.id ===
                            sucursalIdEntrada
                        );

                    }
                );


            if (encontradaPorId) {

                nombreFinal =
                    encontradaPorId.nombre ||
                    encontradaPorId.name ||
                    encontradaPorId.label ||
                    sucursalNombre;

            }

        }

    }


    /*
    =========================================================
    SI SIGUE SIN ENCONTRARSE
    =========================================================
    */

    if (!sucursalEncontrada) {

        /*
        Verificar si existe por slug.
        */

        const slugBuscado =
            reporteSlugify(
                nombreFinal
            );


        const encontradaPorSlug =
            cadena.sucursales.find(
                item => {

                    if (
                        typeof item === "string"
                    ) {

                        return (
                            reporteSlugify(item) ===
                            slugBuscado
                        );

                    }


                    if (
                        item &&
                        typeof item === "object"
                    ) {

                        const nombreItem =
                            item.nombre ||
                            item.name ||
                            item.label ||
                            "";

                        return (
                            reporteSlugify(
                                nombreItem
                            ) ===
                            slugBuscado
                        );

                    }


                    return false;

                }
            );


        if (!encontradaPorSlug) {

            console.error(
                "Sucursal no encontrada:",
                sucursalEntrada
            );

            console.error(
                "Nombre normalizado:",
                nombreFinal
            );

            console.error(
                "Sucursales disponibles:",
                cadena.sucursales
            );

            return null;

        }

    }


    /*
    =========================================================
    GENERAR ID INTERNO
    =========================================================

    El ID debe coincidir con el sistema utilizado
    por app.js para asignar las fotografías.
    */

    const sucursalId =
        reporteSlugify(
            nombreFinal
        );


    /*
    =========================================================
    AGREGAR SUCURSAL AL REPORTE
    =========================================================
    */

    return agregarSucursal(

        cadenaId,

        sucursalId,

        nombreFinal

    );

}


/* =========================================================
   22. ASIGNAR FOTOGRAFÍAS POR LOTE
========================================================= */

function asignarFotografias(
    fotografias,
    cadenaId,
    sucursalId
) {

    if (!reporteActual) {

        console.error(
            "No existe un reporte activo."
        );

        return false;

    }


    /*
    Normalizar IDs
    */

    let cadenaRealId =
        cadenaId;


    if (
        typeof cadenaId === "object" &&
        cadenaId !== null
    ) {

        cadenaRealId =
            cadenaId.id ||
            cadenaId.value;

    }


    let sucursalRealId =
        sucursalId;


    if (
        typeof sucursalId === "object" &&
        sucursalId !== null
    ) {

        sucursalRealId =
            sucursalId.id ||
            sucursalId.value;

    }


    /*
    Buscar sucursal
    */

    let sucursal =
        obtenerSucursal(
            cadenaRealId,
            sucursalRealId
        );


    /*
    Si no existe con ese ID,
    intentar convertir el valor
    en slug.
    */

    if (!sucursal) {

        const posibleNombre =
            obtenerNombreSucursal(
                sucursalId
            );


        if (posibleNombre) {

            const posibleId =
                reporteSlugify(
                    posibleNombre
                );


            sucursal =
                obtenerSucursal(
                    cadenaRealId,
                    posibleId
                );


            sucursalRealId =
                posibleId;

        }

    }


    if (!sucursal) {

        console.error(
            "No se encontró la sucursal para asignar fotografías:",
            {
                cadenaId: cadenaRealId,
                sucursalId: sucursalRealId
            }
        );

        return false;

    }


    /*
    Agregar fotografías
    */

    fotografias.forEach(
        fotografia => {

            agregarFotografia(

                cadenaRealId,

                sucursalRealId,

                fotografia

            );

        }
    );


    return true;

}


/* =========================================================
   23. CONTADOR TOTAL DE FOTOGRAFÍAS
========================================================= */

function obtenerTotalFotografias() {

    if (!reporteActual) {

        return 0;

    }


    let total = 0;


    reporteActual.cadenas.forEach(
        cadena => {

            cadena.sucursales.forEach(
                sucursal => {

                    total +=
                        sucursal.fotografias.length;

                }
            );

        }
    );


    return total;

}


/* =========================================================
   24. OBTENER TODAS LAS FOTOGRAFÍAS
========================================================= */

function obtenerFotografiasReporte() {

    if (!reporteActual) {

        return [];

    }


    const fotografias = [];


    reporteActual.cadenas.forEach(
        cadena => {

            cadena.sucursales.forEach(
                sucursal => {

                    sucursal.fotografias.forEach(
                        fotografia => {

                            fotografias.push({

                                ...fotografia,

                                cadenaId:
                                    cadena.id,

                                cadenaNombre:
                                    cadena.nombre,

                                sucursalId:
                                    sucursal.id,

                                sucursalNombre:
                                    sucursal.nombre

                            });

                        }
                    );

                }
            );

        }
    );


    return fotografias;

}


/* =========================================================
   25. OBTENER RESUMEN DEL REPORTE
========================================================= */

function obtenerResumenReporte() {

    const resumen = {

        cadenas: 0,

        sucursales: 0,

        fotografias: 0,

        detalle: []

    };


    if (!reporteActual) {

        return resumen;

    }


    resumen.cadenas =
        reporteActual.cadenas.length;


    reporteActual.cadenas.forEach(
        cadena => {

            cadena.sucursales.forEach(
                sucursal => {

                    const cantidad =
                        sucursal.fotografias.length;


                    resumen.sucursales++;

                    resumen.fotografias +=
                        cantidad;


                    resumen.detalle.push({

                        cadenaId:
                            cadena.id,

                        cadenaNombre:
                            cadena.nombre,

                        sucursalId:
                            sucursal.id,

                        sucursalNombre:
                            sucursal.nombre,

                        fotografias:
                            cantidad

                    });

                }
            );

        }
    );


    return resumen;

}


/* =========================================================
   26. VERIFICAR SI TODAS LAS FOTOGRAFÍAS
       ESTÁN DISTRIBUIDAS
========================================================= */

function reporteEstaCompleto() {

    if (!reporteActual) {

        return false;

    }


    if (
        reporteActual.cadenas.length === 0
    ) {

        return false;

    }


    for (
        const cadena
        of reporteActual.cadenas
    ) {

        if (
            cadena.sucursales.length === 0
        ) {

            return false;

        }


        for (
            const sucursal
            of cadena.sucursales
        ) {

            if (
                sucursal.fotografias.length === 0
            ) {

                return false;

            }

        }

    }


    return true;

}


/* =========================================================
   FIN DE REPORTE.JS
========================================================= */