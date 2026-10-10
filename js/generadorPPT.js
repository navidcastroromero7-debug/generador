/* ============================================================
   generadorPPT.js
   Generador de reportes PPTX a partir de plantilla existente
   ============================================================ */

(function () {
    "use strict";

    /* =========================================================
       CONFIGURACIÓN
       ========================================================= */

    const RUTAS_PLANTILLA = [
        "./plantillas/RF Amaras Makro.pptx",
        "./RF Amaras Makro.pptx"
    ];

    // Diapositivas originales de contenido de la plantilla
    const SLIDES_BASE = [2, 3, 4];

    // Nombres de los marcos fotográficos de la plantilla
    const NOMBRES_FOTOS = ["Image 0", "Image 8"];

    // Nombre de los campos de punto de venta
    const NOMBRE_PUNTO_VENTA = "Text 6";

    // Texto fijo que debe conservarse
    const GIRO_NEGOCIO = "AASS";
    const EMPRESA = "ALICORP PERÚ";

    const NS = {
        P:
            "http://schemas.openxmlformats.org/presentationml/2006/main",
        A:
            "http://schemas.openxmlformats.org/drawingml/2006/main",
        R:
            "http://schemas.openxmlformats.org/officeDocument/2006/relationships",
        REL:
            "http://schemas.openxmlformats.org/package/2006/relationships",
        CT:
            "http://schemas.openxmlformats.org/package/2006/content-types"
    };

    let jszipPromise = null;

    /* =========================================================
       CARGAR JSZIP
       ========================================================= */

    function cargarJSZip() {
        if (window.JSZip) {
            return Promise.resolve(window.JSZip);
        }

        if (jszipPromise) {
            return jszipPromise;
        }

        jszipPromise = new Promise((resolve, reject) => {
            const script = document.createElement("script");

            script.src =
                "https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js";

            script.onload = () => {
                if (window.JSZip) {
                    resolve(window.JSZip);
                } else {
                    reject(
                        new Error("JSZip se cargó pero no está disponible.")
                    );
                }
            };

            script.onerror = () => {
                reject(
                    new Error(
                        "No se pudo cargar JSZip desde el CDN."
                    )
                );
            };

            document.head.appendChild(script);
        });

        return jszipPromise;
    }

    /* =========================================================
       UTILIDADES GENERALES
       ========================================================= */

    function escaparXML(valor) {
        return String(valor ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&apos;");
    }

    function obtenerExtension(nombre) {
        const match = String(nombre || "").match(/\.([^.]+)$/);
        return match ? match[1].toLowerCase() : "jpg";
    }

    function obtenerMime(extension) {
        const ext = extension.toLowerCase();

        if (ext === "png") return "image/png";
        if (ext === "jpg" || ext === "jpeg") return "image/jpeg";
        if (ext === "gif") return "image/gif";
        if (ext === "bmp") return "image/bmp";
        if (ext === "webp") return "image/webp";

        return "image/jpeg";
    }

    function normalizarNombre(nombre) {
        return String(nombre || "")
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .toLowerCase()
            .trim();
    }

    function obtenerNombreSucursal(sucursal) {
        if (!sucursal) {
            return "";
        }

        if (typeof sucursal === "string") {
            return sucursal;
        }

        return (
            sucursal.nombre ||
            sucursal.name ||
            sucursal.nombreSucursal ||
            sucursal.nombre_sucursal ||
            sucursal.label ||
            sucursal.titulo ||
            sucursal.id ||
            sucursal.codigo ||
            ""
        );
    }

    function obtenerNombreCadena(cadena) {
        if (!cadena) {
            return "";
        }

        if (typeof cadena === "string") {
            return cadena;
        }

        return (
            cadena.nombre ||
            cadena.name ||
            cadena.nombreCadena ||
            cadena.label ||
            cadena.titulo ||
            cadena.id ||
            ""
        );
    }

    /* =========================================================
       OBTENER FOTOS
       ========================================================= */

    function obtenerFotosDeSucursal(sucursal) {
        if (!sucursal) {
            return [];
        }

        if (Array.isArray(sucursal.fotografias)) {
            return sucursal.fotografias;
        }

        if (Array.isArray(sucursal.fotos)) {
            return sucursal.fotos;
        }

        if (Array.isArray(sucursal.photos)) {
            return sucursal.photos;
        }

        return [];
    }

    function obtenerArchivoFoto(foto) {
        if (!foto) {
            return null;
        }

        // Si directamente es File
        if (foto instanceof File || foto instanceof Blob) {
            return foto;
        }

        return (
            foto.archivo ||
            foto.file ||
            foto.blob ||
            foto.imagen ||
            foto.image ||
            null
        );
    }

    /* =========================================================
       CONSTRUIR PÁGINAS
       ========================================================= */

    function construirPaginas(reporte) {
        const paginas = [];

        if (!reporte) {
            return paginas;
        }

        const cadenas = Array.isArray(reporte.cadenas)
            ? reporte.cadenas
            : [];

        cadenas.forEach((cadena) => {
            const nombreCadena = obtenerNombreCadena(cadena);

            const sucursales = Array.isArray(cadena.sucursales)
                ? cadena.sucursales
                : [];

            sucursales.forEach((sucursal) => {
                const nombreSucursal =
                    obtenerNombreSucursal(sucursal);

                const fotos = obtenerFotosDeSucursal(sucursal);

                fotos.forEach((foto) => {
                    const archivo = obtenerArchivoFoto(foto);

                    if (!archivo) {
                        return;
                    }

                    paginas.push({
                        archivo: archivo,
                        foto: foto,
                        cadena: nombreCadena,
                        sucursal: nombreSucursal,
                        puntoVenta: nombreSucursal
                    });
                });
            });
        });

        // Compatibilidad por si el reporte utiliza un arreglo general
        if (
            paginas.length === 0 &&
            Array.isArray(reporte.fotografias)
        ) {
            reporte.fotografias.forEach((foto) => {
                const archivo = obtenerArchivoFoto(foto);

                if (!archivo) {
                    return;
                }

                paginas.push({
                    archivo: archivo,
                    foto: foto,
                    cadena:
                        foto.cadenaNombre ||
                        foto.cadena ||
                        "",
                    sucursal:
                        foto.sucursalNombre ||
                        foto.sucursal ||
                        foto.puntoVenta ||
                        "",
                    puntoVenta:
                        foto.puntoVenta ||
                        foto.sucursalNombre ||
                        foto.sucursal ||
                        ""
                });
            });
        }

        return paginas;
    }

    /* =========================================================
       AGRUPAR 2 FOTOS POR DIAPOSITIVA
       ========================================================= */

    function agruparFotosPorPagina(fotos) {
        const paginas = [];

        for (let i = 0; i < fotos.length; i += 2) {
            paginas.push([
                fotos[i] || null,
                fotos[i + 1] || null
            ]);
        }

        return paginas;
    }

    /* =========================================================
       LEER ARCHIVO
       ========================================================= */

    async function leerArchivoComoArrayBuffer(archivo) {
        if (archivo instanceof ArrayBuffer) {
            return archivo;
        }

        if (archivo instanceof Blob) {
            return await archivo.arrayBuffer();
        }

        if (archivo && typeof archivo.arrayBuffer === "function") {
            return await archivo.arrayBuffer();
        }

        throw new Error(
            "No se pudo leer una de las fotografías."
        );
    }

    /* =========================================================
       CARGAR PLANTILLA
       ========================================================= */

    async function cargarPlantilla(JSZip) {
        let ultimoError = null;

        for (const ruta of RUTAS_PLANTILLA) {
            try {
                console.log("Intentando cargar plantilla:", ruta);

                const respuesta = await fetch(ruta, {
                    cache: "no-store"
                });

                if (!respuesta.ok) {
                    ultimoError = new Error(
                        `HTTP ${respuesta.status} al cargar ${ruta}`
                    );

                    continue;
                }

                const buffer = await respuesta.arrayBuffer();

                if (!buffer || buffer.byteLength === 0) {
                    ultimoError = new Error(
                        `La plantilla está vacía: ${ruta}`
                    );

                    continue;
                }

                console.log(
                    "Plantilla cargada correctamente:",
                    ruta
                );

                return await JSZip.loadAsync(buffer);
            } catch (error) {
                console.warn(
                    "No se pudo cargar:",
                    ruta,
                    error
                );

                ultimoError = error;
            }
        }

        throw new Error(
            "No se encontró la plantilla PowerPoint.\n\n" +
            "Verifica que el archivo esté en:\n" +
            "./plantillas/RF Amaras Makro.pptx\n\n" +
            "o directamente junto al index.html."
        );
    }

    /* =========================================================
       XML
       ========================================================= */

    async function leerXML(zip, ruta) {
        const archivo = zip.file(ruta);

        if (!archivo) {
            throw new Error(
                `No existe ${ruta} dentro de la plantilla.`
            );
        }

        return await archivo.async("string");
    }

    function obtenerNumeroRid(xml) {
        const rids = [...xml.matchAll(/Id="rId(\d+)"/g)]
            .map((m) => parseInt(m[1], 10))
            .filter(Number.isFinite);

        return rids.length ? Math.max(...rids) : 0;
    }

    function obtenerSiguienteRid(xml) {
        return "rId" + (obtenerNumeroRid(xml) + 1);
    }

    /* =========================================================
       REEMPLAZAR TEXTO DENTRO DE UNA SHAPE
       ========================================================= */

    function reemplazarTextoEnShape(shapeXml, texto) {
        const textoEscapado = escaparXML(texto);

        // Si ya existe un <a:t>, reemplazarlo.
        if (/<a:t>[\s\S]*?<\/a:t>/.test(shapeXml)) {
            return shapeXml.replace(
                /<a:t>[\s\S]*?<\/a:t>/,
                `<a:t>${textoEscapado}</a:t>`
            );
        }

        // Caso de la plantilla:
        // <a:p><a:endParaRPr .../></a:p>
        const patron =
            /<a:p>([\s\S]*?)<a:endParaRPr([^>]*)\/><\/a:p>/;

        const match = shapeXml.match(patron);

        if (!match) {
            return shapeXml;
        }

        const atributosRPr = match[2] || "";

        const nuevoParrafo =
            `<a:p>` +
            `<a:r>` +
            `<a:rPr${atributosRPr}/>` +
            `<a:t>${textoEscapado}</a:t>` +
            `</a:r>` +
            `<a:endParaRPr${atributosRPr}/>` +
            `</a:p>`;

        return shapeXml.replace(
            patron,
            nuevoParrafo
        );
    }

    /* =========================================================
       OBTENER SHAPES TEXTUALES POR NOMBRE
       ========================================================= */

    function obtenerShapesPorNombre(slideXml, nombre) {
        const shapes = [];

        const regex = /<p:sp>[\s\S]*?<\/p:sp>/g;
        let match;

        while ((match = regex.exec(slideXml)) !== null) {
            const shape = match[0];

            const nombreMatch = shape.match(
                /<p:cNvPr[^>]*\sname="([^"]+)"/
            );

            if (
                nombreMatch &&
                nombreMatch[1] === nombre
            ) {
                shapes.push({
                    inicio: match.index,
                    fin: regex.lastIndex,
                    xml: shape
                });
            }
        }

        return shapes;
    }

    /* =========================================================
       ESCRIBIR LOS DOS PUNTOS DE VENTA
       ========================================================= */

    function actualizarPuntosDeVenta(
        slideXml,
        puntoVentaIzquierdo,
        puntoVentaDerecho
    ) {
        const valores = [
            puntoVentaIzquierdo || "",
            puntoVentaDerecho || ""
        ];

        const regex = /<p:sp>[\s\S]*?<\/p:sp>/g;

        let contador = 0;

        slideXml = slideXml.replace(
            regex,
            (shape) => {
                const nombreMatch = shape.match(
                    /<p:cNvPr[^>]*\sname="([^"]+)"/
                );

                if (
                    !nombreMatch ||
                    nombreMatch[1] !== NOMBRE_PUNTO_VENTA
                ) {
                    return shape;
                }

                if (contador >= 2) {
                    return shape;
                }

                const valor = valores[contador];

                contador++;

                return reemplazarTextoEnShape(
                    shape,
                    valor
                );
            }
        );

        console.log(
            "Puntos de venta actualizados:",
            valores,
            "campos encontrados:",
            contador
        );

        return slideXml;
    }

    /* =========================================================
       CALCULAR RECORTE PROPORCIONAL
       ========================================================= */

    /* =========================================================
      AJUSTE PROPORCIONAL SIN RECORTE
      ========================================================= */

    function calcularSrcRect(anchoImagen, altoImagen) {
        /*
         * Ya NO se realiza ningún recorte.
         *
         * La fotografía completa debe conservarse.
         * El ajuste de tamaño se realiza posteriormente
         * modificando el tamaño de la imagen dentro del marco.
         */
        return {
            left: 0,
            right: 0,
            top: 0,
            bottom: 0
        };
    }

    /* =========================================================
       OBTENER DIMENSIONES DE IMAGEN
       ========================================================= */

    async function obtenerDimensionesImagen(blob) {
        return await new Promise((resolve, reject) => {
            const url = URL.createObjectURL(blob);

            const img = new Image();

            img.onload = () => {
                const resultado = {
                    width: img.naturalWidth,
                    height: img.naturalHeight
                };

                URL.revokeObjectURL(url);

                resolve(resultado);
            };

            img.onerror = () => {
                URL.revokeObjectURL(url);

                // Si no podemos leer dimensiones,
                // dejamos que PowerPoint use el marco.
                resolve({
                    width: 1,
                    height: 1
                });
            };

            img.src = url;
        });
    }

    /* =========================================================
       MODIFICAR BLIP DE UNA FOTO
       ========================================================= */

    function reemplazarRidDeImagen(
        slideXml,
        nombreImagen,
        nuevoRid
    ) {
        const regex = /<p:pic>[\s\S]*?<\/p:pic>/g;

        slideXml = slideXml.replace(
            regex,
            (picXml) => {
                const nombreMatch =
                    picXml.match(
                        /<p:cNvPr[^>]*\sname="([^"]+)"/
                    );

                if (
                    !nombreMatch ||
                    nombreMatch[1] !== nombreImagen
                ) {
                    return picXml;
                }

                return picXml.replace(
                    /r:embed="[^"]+"/,
                    `r:embed="${nuevoRid}"`
                );
            }
        );

        return slideXml;
    }

    /* =========================================================
       APLICAR SRCRECT A UNA IMAGEN
       ========================================================= */

    /* =========================================================
      AJUSTAR IMAGEN DENTRO DEL MARCO SIN RECORTAR
      ========================================================= */

    function aplicarSrcRect(
        slideXml,
        nombreImagen,
        srcRect,
        anchoImagen,
        altoImagen
    ) {
        const regex = /<p\:pic>[\s\S]*?<\/p\:pic>/g;

        slideXml = slideXml.replace(
            regex,
            (picXml) => {

                const nombreMatch = picXml.match(
                    /<p\:cNvPr[^>]*\sname="([^"]+)"/
                );

                if (
                    !nombreMatch ||
                    nombreMatch[1] !== nombreImagen
                ) {
                    return picXml;
                }

                /*
                 * --------------------------------------------------
                 * 1. ELIMINAR CUALQUIER RECORTE EXISTENTE
                 * --------------------------------------------------
                 */

                picXml = picXml.replace(
                    /<a\:srcRect\b[^>]*\/>/g,
                    ""
                );

                /*
                 * --------------------------------------------------
                 * 2. BUSCAR EL MARCO ORIGINAL
                 * --------------------------------------------------
                 *
                 * PowerPoint utiliza:
                 *
                 * <a:off x="" y=""/>
                 * <a:ext cx="" cy=""/>
                 *
                 * El marco original se conserva como referencia.
                 */

                const xfrmMatch = picXml.match(
                    /<a\:xfrm>([\s\S]*?)<\/a\:xfrm>/
                );

                if (!xfrmMatch) {
                    return picXml;
                }

                const xfrmXml = xfrmMatch[0];

                const offMatch = xfrmXml.match(
                    /<a\:off\s+x="(-?\d+)"\s+y="(-?\d+)"\s*\/>/
                );

                const extMatch = xfrmXml.match(
                    /<a\:ext\s+cx="(\d+)"\s+cy="(\d+)"\s*\/>/
                );

                if (!offMatch || !extMatch) {
                    return picXml;
                }

                /*
                 * --------------------------------------------------
                 * 3. DIMENSIONES DEL MARCO
                 * --------------------------------------------------
                 */

                const marcoX = parseInt(offMatch[1], 10);
                const marcoY = parseInt(offMatch[2], 10);

                const marcoAncho = parseInt(
                    extMatch[1],
                    10
                );

                const marcoAlto = parseInt(
                    extMatch[2],
                    10
                );

                if (
                    !Number.isFinite(marcoAncho) ||
                    !Number.isFinite(marcoAlto) ||
                    !Number.isFinite(anchoImagen) ||
                    !Number.isFinite(altoImagen) ||
                    anchoImagen <= 0 ||
                    altoImagen <= 0
                ) {
                    return picXml;
                }

                /*
                 * --------------------------------------------------
                 * 4. CALCULAR ESCALA "CONTAIN"
                 * --------------------------------------------------
                 *
                 * La fotografía completa debe entrar dentro
                 * del marco.
                 *
                 * No se utiliza "cover".
                 * No se recorta.
                 * No se deforma.
                 */

                const escalaX =
                    marcoAncho / anchoImagen;

                const escalaY =
                    marcoAlto / altoImagen;

                const escala =
                    Math.min(
                        escalaX,
                        escalaY
                    );

                /*
                 * Dimensiones finales manteniendo
                 * exactamente la proporción original.
                 */

                const nuevoAncho = Math.round(
                    anchoImagen * escala
                );

                const nuevoAlto = Math.round(
                    altoImagen * escala
                );

                /*
                 * --------------------------------------------------
                 * 5. CENTRAR DENTRO DEL MARCO
                 * --------------------------------------------------
                 */

                const nuevoX =
                    marcoX +
                    Math.round(
                        (marcoAncho - nuevoAncho) / 2
                    );

                const nuevoY =
                    marcoY +
                    Math.round(
                        (marcoAlto - nuevoAlto) / 2
                    );

                /*
                 * --------------------------------------------------
                 * 6. REEMPLAZAR TRANSFORMACIÓN
                 * --------------------------------------------------
                 */

                const nuevoXfrm =
                    xfrmXml
                        .replace(
                            /<a\:off\s+x="(-?\d+)"\s+y="(-?\d+)"\s*\/>/,
                            `<a:off x="${nuevoX}" y="${nuevoY}"/>`
                        )
                        .replace(
                            /<a\:ext\s+cx="(\d+)"\s+cy="(\d+)"\s*\/>/,
                            `<a:ext cx="${nuevoAncho}" cy="${nuevoAlto}"/>`
                        );

                picXml = picXml.replace(
                    xfrmXml,
                    nuevoXfrm
                );

                return picXml;
            }
        );

        return slideXml;
    }

    /* =========================================================
       AGREGAR RELACIÓN DE IMAGEN
       ========================================================= */

    function agregarRelacionImagen(
        relsXml,
        rid,
        nombreArchivo
    ) {
        const relacion =
            `<Relationship ` +
            `Id="${rid}" ` +
            `Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" ` +
            `Target="../media/${nombreArchivo}"/>`;

        return relsXml.replace(
            "</Relationships>",
            relacion + "</Relationships>"
        );
    }

    /* =========================================================
       AGREGAR MEDIA
       ========================================================= */

    function agregarContentType(
        contentTypesXml,
        extension,
        mime
    ) {
        const existe =
            new RegExp(
                `<Default[^>]*Extension="${extension}"`,
                "i"
            ).test(contentTypesXml);

        if (existe) {
            return contentTypesXml;
        }

        const nuevoDefault =
            `<Default Extension="${extension}" ContentType="${mime}"/>`;

        return contentTypesXml.replace(
            "</Types>",
            nuevoDefault + "</Types>"
        );
    }

    /* =========================================================
       PREPARAR UNA DIAPOSITIVA
       ========================================================= */

    async function prepararSlide(
        zip,
        numeroSlide,
        fotosPagina,
        indicePagina
    ) {
        const slidePath =
            `ppt/slides/slide${numeroSlide}.xml`;

        const relsPath =
            `ppt/slides/_rels/slide${numeroSlide}.xml.rels`;

        let slideXml = await leerXML(
            zip,
            slidePath
        );

        let relsXml = await leerXML(
            zip,
            relsPath
        );

        /*
         * ------------------------------------------------------
         * PUNTOS DE VENTA
         * ------------------------------------------------------
         */

        const fotoIzquierda =
            fotosPagina[0] || null;

        const fotoDerecha =
            fotosPagina[1] || null;

        const puntoVentaIzquierdo =
            fotoIzquierda
                ? fotoIzquierda.puntoVenta ||
                fotoIzquierda.sucursal ||
                ""
                : "";

        const puntoVentaDerecho =
            fotoDerecha
                ? fotoDerecha.puntoVenta ||
                fotoDerecha.sucursal ||
                ""
                : "";

        slideXml = actualizarPuntosDeVenta(
            slideXml,
            puntoVentaIzquierdo,
            puntoVentaDerecho
        );

        /*
         * ------------------------------------------------------
         * FOTOGRAFÍA IZQUIERDA
         * ------------------------------------------------------
         */

        if (fotoIzquierda) {
            const archivo =
                fotoIzquierda.archivo;

            const buffer =
                await leerArchivoComoArrayBuffer(
                    archivo
                );

            const extension =
                obtenerExtension(
                    archivo.name || "foto.jpg"
                );

            const mime =
                obtenerMime(extension);

            const nombreMedia =
                `reportx_foto_${indicePagina}_1.${extension}`;

            zip.file(
                `ppt/media/${nombreMedia}`,
                buffer
            );

            let nuevoRid =
                obtenerSiguienteRid(relsXml);

            relsXml =
                agregarRelacionImagen(
                    relsXml,
                    nuevoRid,
                    nombreMedia
                );

            slideXml =
                reemplazarRidDeImagen(
                    slideXml,
                    "Image 0",
                    nuevoRid
                );

            const dimensiones =
                await obtenerDimensionesImagen(
                    archivo
                );

            const srcRect =
                calcularSrcRect(
                    dimensiones.width,
                    dimensiones.height
                );

            slideXml =
                aplicarSrcRect(
                    slideXml,
                    "Image 8",
                    srcRect,
                    dimensiones.width,
                    dimensiones.height
                );

            console.log(
                `Foto izquierda colocada en slide ${numeroSlide}:`,
                puntoVentaIzquierdo
            );
        }

        /*
         * ------------------------------------------------------
         * FOTOGRAFÍA DERECHA
         * ------------------------------------------------------
         */

        if (fotoDerecha) {
            const archivo =
                fotoDerecha.archivo;

            const buffer =
                await leerArchivoComoArrayBuffer(
                    archivo
                );

            const extension =
                obtenerExtension(
                    archivo.name || "foto.jpg"
                );

            const mime =
                obtenerMime(extension);

            const nombreMedia =
                `reportx_foto_${indicePagina}_2.${extension}`;

            zip.file(
                `ppt/media/${nombreMedia}`,
                buffer
            );

            let nuevoRid =
                obtenerSiguienteRid(relsXml);

            relsXml =
                agregarRelacionImagen(
                    relsXml,
                    nuevoRid,
                    nombreMedia
                );

            slideXml =
                reemplazarRidDeImagen(
                    slideXml,
                    "Image 8",
                    nuevoRid
                );

            const dimensiones =
                await obtenerDimensionesImagen(
                    archivo
                );



            console.log(
                `Foto derecha colocada en slide ${numeroSlide}:`,
                puntoVentaDerecho
            );
        }

        /*
         * ------------------------------------------------------
         * SI NO HAY SEGUNDA FOTO
         * ------------------------------------------------------
         *
         * No eliminamos la estructura de la plantilla.
         * Solamente vaciamos el punto de venta derecho.
         */

        if (!fotoDerecha) {
            slideXml =
                actualizarPuntosDeVenta(
                    slideXml,
                    puntoVentaIzquierdo,
                    ""
                );
        }

        zip.file(
            slidePath,
            slideXml
        );

        zip.file(
            relsPath,
            relsXml
        );

        /*
         * Actualizar Content Types para la extensión usada.
         */

        let contentTypesXml =
            await leerXML(
                zip,
                "[Content_Types].xml"
            );

        if (fotoIzquierda) {
            const ext =
                obtenerExtension(
                    fotoIzquierda.archivo.name ||
                    "foto.jpg"
                );

            contentTypesXml =
                agregarContentType(
                    contentTypesXml,
                    ext,
                    obtenerMime(ext)
                );
        }

        if (fotoDerecha) {
            const ext =
                obtenerExtension(
                    fotoDerecha.archivo.name ||
                    "foto.jpg"
                );

            contentTypesXml =
                agregarContentType(
                    contentTypesXml,
                    ext,
                    obtenerMime(ext)
                );
        }

        zip.file(
            "[Content_Types].xml",
            contentTypesXml
        );
    }

    /* =========================================================
       CLONAR DIAPOSITIVA
       ========================================================= */

    async function clonarSlide(
        zip,
        slideOriginal,
        nuevoNumero
    ) {
        const originalSlidePath =
            `ppt/slides/slide${slideOriginal}.xml`;

        const originalRelsPath =
            `ppt/slides/_rels/slide${slideOriginal}.xml.rels`;

        const nuevoSlidePath =
            `ppt/slides/slide${nuevoNumero}.xml`;

        const nuevoRelsPath =
            `ppt/slides/_rels/slide${nuevoNumero}.xml.rels`;

        const slideXml =
            await leerXML(
                zip,
                originalSlidePath
            );

        let relsXml =
            await leerXML(
                zip,
                originalRelsPath
            );

        /*
         * Las notesSlide no deben copiarse como relación
         * del nuevo slide.
         */
        relsXml =
            relsXml.replace(
                /<Relationship[^>]*Type="[^"]*\/notesSlide"[^>]*\/>/g,
                ""
            );

        zip.file(
            nuevoSlidePath,
            slideXml
        );

        zip.file(
            nuevoRelsPath,
            relsXml
        );

        /*
         * Actualizar Content Types
         */

        let contentTypesXml =
            await leerXML(
                zip,
                "[Content_Types].xml"
            );

        const override =
            `<Override ` +
            `PartName="/ppt/slides/slide${nuevoNumero}.xml" ` +
            `ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>`;

        if (
            !contentTypesXml.includes(
                `/ppt/slides/slide${nuevoNumero}.xml`
            )
        ) {
            contentTypesXml =
                contentTypesXml.replace(
                    "</Types>",
                    override + "</Types>"
                );
        }

        zip.file(
            "[Content_Types].xml",
            contentTypesXml
        );

        /*
         * Actualizar presentation.xml.rels
         */

        const presentationRelsPath =
            "ppt/_rels/presentation.xml.rels";

        let presentationRelsXml =
            await leerXML(
                zip,
                presentationRelsPath
            );

        const rids =
            [...presentationRelsXml.matchAll(
                /Id="rId(\d+)"/g
            )]
                .map((m) => parseInt(m[1], 10))
                .filter(Number.isFinite);

        const nuevoRid =
            "rId" +
            ((rids.length
                ? Math.max(...rids)
                : 0) + 1);

        const nuevaRelacion =
            `<Relationship ` +
            `Id="${nuevoRid}" ` +
            `Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide" ` +
            `Target="slides/slide${nuevoNumero}.xml"/>`;

        presentationRelsXml =
            presentationRelsXml.replace(
                "</Relationships>",
                nuevaRelacion +
                "</Relationships>"
            );

        zip.file(
            presentationRelsPath,
            presentationRelsXml
        );

        /*
         * Actualizar presentation.xml
         */

        const presentationPath =
            "ppt/presentation.xml";

        let presentationXml =
            await leerXML(
                zip,
                presentationPath
            );

        const slideIds =
            [...presentationXml.matchAll(
                /<p:sldId\b[^>]*id="(\d+)"/g
            )]
                .map((m) => parseInt(m[1], 10))
                .filter(Number.isFinite);

        const nuevoSlideId =
            (slideIds.length
                ? Math.max(...slideIds)
                : 255) + 1;

        const nuevoSldId =
            `<p:sldId ` +
            `id="${nuevoSlideId}" ` +
            `r:id="${nuevoRid}"/>`;

        const insertPosition =
            presentationXml.indexOf(
                "</p:sldIdLst>"
            );

        if (insertPosition !== -1) {
            presentationXml =
                presentationXml.slice(
                    0,
                    insertPosition
                ) +
                nuevoSldId +
                presentationXml.slice(
                    insertPosition
                );
        }

        zip.file(
            presentationPath,
            presentationXml
        );

        console.log(
            `Slide ${slideOriginal} clonado como slide ${nuevoNumero}.`
        );
    }

    /* =========================================================
       OBTENER NÚMERO DE SLIDES EXISTENTES
       ========================================================= */

    async function obtenerNumeroMaximoSlide(zip) {
        let maximo = 0;

        Object.keys(zip.files).forEach((ruta) => {
            const match =
                ruta.match(
                    /^ppt\/slides\/slide(\d+)\.xml$/
                );

            if (match) {
                maximo = Math.max(
                    maximo,
                    parseInt(match[1], 10)
                );
            }
        });

        return maximo;
    }

    /* =========================================================
       LIMPIAR DIAPOSITIVAS ANTIGUAS
       ========================================================= */

    async function prepararDiapositivas(
        zip,
        paginas
    ) {
        if (!paginas.length) {
            throw new Error(
                "No hay fotografías clasificadas para generar la PPT."
            );
        }

        const numeroPaginasNecesarias =
            paginas.length;

        console.log(
            "Páginas necesarias:",
            numeroPaginasNecesarias
        );

        /*
         * La plantilla ya tiene 3 diapositivas
         * de contenido:
         * 2, 3 y 4.
         */

        let ultimoSlide =
            await obtenerNumeroMaximoSlide(zip);

        /*
         * Si necesitamos más de 3 páginas,
         * clonamos el slide 4.
         */

        while (
            SLIDES_BASE.length <
            numeroPaginasNecesarias
        ) {
            ultimoSlide++;

            await clonarSlide(
                zip,
                4,
                ultimoSlide
            );

            SLIDES_BASE.push(
                ultimoSlide
            );
        }

        /*
         * Preparar cada página.
         */

        for (
            let i = 0;
            i < paginas.length;
            i++
        ) {
            const slideNumero =
                SLIDES_BASE[i];

            await prepararSlide(
                zip,
                slideNumero,
                paginas[i],
                i + 1
            );
        }
    }

    /* =========================================================
       GENERAR PPT
       ========================================================= */

    async function generarPPT() {
        try {
            console.log(
                "======================================"
            );

            console.log(
                "INICIANDO GENERACIÓN DE PPT"
            );

            console.log(
                "======================================"
            );

            /*
             * Obtener reporte actual
             */

            let reporte = null;

            if (typeof obtenerReporte === "function") {
                reporte = obtenerReporte();
            } else if (window.reporteActual) {
                reporte = window.reporteActual;
            } else if (window.reporte) {
                reporte = window.reporte;
            }
            if (!reporte) {
                throw new Error(
                    "No existe un reporte activo."
                );
            }

            if (!reporte) {
                throw new Error(
                    "No existe un reporte activo."
                );
            }

            console.log(
                "Reporte encontrado:",
                reporte
            );

            /*
             * Construir lista de fotografías
             */

            const fotos =
                construirPaginas(reporte);

            console.log(
                "Fotografías encontradas:",
                fotos.length
            );

            if (!fotos.length) {
                throw new Error(
                    "No hay fotografías clasificadas."
                );
            }

            /*
             * Agrupar de 2 en 2
             */

            const paginas =
                agruparFotosPorPagina(
                    fotos
                );

            console.log(
                "Páginas generadas:",
                paginas.length
            );

            /*
             * Cargar JSZip
             */

            const JSZip =
                await cargarJSZip();

            /*
             * Cargar plantilla
             */

            const zip =
                await cargarPlantilla(
                    JSZip
                );

            /*
             * Preparar diapositivas
             */

            await prepararDiapositivas(
                zip,
                paginas
            );

            /*
             * Generar archivo
             */

            console.log(
                "Generando archivo PPTX..."
            );

            const blob =
                await zip.generateAsync({
                    type: "blob",
                    mimeType:
                        "application/vnd.openxmlformats-officedocument.presentationml.presentation",
                    compression: "DEFLATE"
                });

            /*
             * Nombre del archivo
             */

            const nombreReporte =
                reporte.nombre ||
                reporte.titulo ||
                "Reporte";

            const fecha =
                reporte.fecha ||
                new Date()
                    .toISOString()
                    .slice(0, 10);

            const nombreArchivo =
                `${nombreReporte}_${fecha}.pptx`
                    .replace(
                        /[\\/:*?"<>|]/g,
                        "-"
                    );

            /*
             * Descargar
             */

            descargarBlob(
                blob,
                nombreArchivo
            );

            console.log(
                "======================================"
            );

            console.log(
                "PPT GENERADA CORRECTAMENTE"
            );

            console.log(
                "======================================"
            );

            return true;
        } catch (error) {
            console.error(
                "ERROR AL GENERAR PPT:",
                error
            );

            alert(
                "No se pudo generar la PPT.\n\n" +
                error.message
            );

            return false;
        }
    }

    /* =========================================================
       DESCARGAR BLOB
       ========================================================= */

    function descargarBlob(
        blob,
        nombreArchivo
    ) {
        const url =
            URL.createObjectURL(blob);

        const enlace =
            document.createElement("a");

        enlace.href = url;
        enlace.download = nombreArchivo;

        document.body.appendChild(
            enlace
        );

        enlace.click();

        enlace.remove();

        setTimeout(() => {
            URL.revokeObjectURL(url);
        }, 1000);
    }

    /* =========================================================
       API PÚBLICA
       ========================================================= */

    window.generarPPT =
        generarPPT;

    window.generadorPPT = {
        generar:
            generarPPT,

        construirPaginas:
            construirPaginas,

        agruparFotosPorPagina:
            agruparFotosPorPagina
    };

    console.log(
        "generadorPPT.js cargado correctamente."
    );
})();