document.addEventListener("DOMContentLoaded", () => {

    /* =====================================================
       ELEMENTOS PRINCIPALES
    ===================================================== */

    const newReportBtn = document.getElementById("newReportBtn");
    const mainContent = document.getElementById("mainContent");
    const uploadArea = document.getElementById("uploadArea");


    /* =====================================================
       VARIABLES DE FOTOGRAFÍAS
    ===================================================== */

    let fotografiasPendientes = [];
    let fotografiasSeleccionadas = [];


    /* =====================================================
       NUEVO REPORTE
    ===================================================== */

    if (newReportBtn) {

        newReportBtn.addEventListener("click", () => {
            mostrarNuevoReporte();
        });

    }


    /* =====================================================
       MOSTRAR NUEVO REPORTE
    ===================================================== */

    function mostrarNuevoReporte() {

        if (!mainContent) {
            return;
        }

        mainContent.innerHTML = `

            <div class="new-report-page">

                <div class="page-header">

                    <div>

                        <p class="section-label">
                            NUEVO REPORTE
                        </p>

                        <h2>
                            Crear reporte fotográfico
                        </h2>

                        <p>
                            Configura las cadenas y sucursales
                            que formarán parte del reporte.
                        </p>

                    </div>

                    <button
                        class="back-btn"
                        id="backDashboard"
                    >
                        ← Volver
                    </button>

                </div>


                <div class="form-card">

                    <div class="form-group">

                        <label>
                            Nombre del reporte
                        </label>

                        <input
                            type="text"
                            id="nombreReporte"
                            placeholder="Ej. Reporte Fotográfico Octubre"
                        >

                    </div>


                    <div class="form-group">

                        <label>
                            Fecha del reporte
                        </label>

                        <input
                            type="date"
                            id="fechaReporte"
                        >

                    </div>

                </div>


                <div class="form-card">

                    <div class="form-title">

                        <div>

                            <p class="section-label">
                                PASO 1
                            </p>

                            <h3>
                                Selecciona las cadenas
                            </h3>

                        </div>

                        <span id="contadorCadenas">
                            0 seleccionadas
                        </span>

                    </div>


                    <div
                        class="chains-grid"
                        id="chainsGrid"
                    ></div>

                </div>


                <div
                    class="form-card"
                    id="branchesSection"
                    style="display:none;"
                >

                    <div class="form-title">

                        <div>

                            <p class="section-label">
                                PASO 2
                            </p>

                            <h3>
                                Selecciona las sucursales
                            </h3>

                        </div>

                    </div>


                    <div
                        id="branchesContainer"
                    ></div>

                </div>


                <div class="form-actions">

                    <button
                        class="secondary-btn"
                        id="cancelReport"
                    >
                        Cancelar
                    </button>

                    <button
                        class="continue-btn"
                        id="continueReport"
                    >
                        Continuar →
                    </button>

                </div>

            </div>

        `;

        inicializarNuevoReporte();
    }


    /* =====================================================
       INICIALIZAR NUEVO REPORTE
    ===================================================== */

    function inicializarNuevoReporte() {

        const chainsGrid =
            document.getElementById("chainsGrid");

        const fechaReporte =
            document.getElementById("fechaReporte");


        if (fechaReporte) {
            fechaReporte.value = obtenerFechaActual();
        }


        /* CREAR TARJETAS DE CADENAS */

        if (chainsGrid) {

            cadenas.forEach(cadena => {

                const card =
                    document.createElement("div");

                card.className = "chain-card";

                card.innerHTML = `

                    <div class="chain-check">

                        <input
                            type="checkbox"
                            value="${cadena.id}"
                            id="chain-${cadena.id}"
                        >

                    </div>

                    <div class="chain-content">

                        <div class="chain-icon">
                            🏪
                        </div>

                        <div>

                            <strong>
                                ${cadena.nombre}
                            </strong>

                            <span>
                                ${cadena.sucursales.length}
                                sucursales
                            </span>

                        </div>

                    </div>

                `;

                chainsGrid.appendChild(card);


                /* CLICK SOBRE TARJETA */

                card.addEventListener("click", event => {

                    if (
                        event.target.tagName === "INPUT"
                    ) {
                        return;
                    }

                    const checkbox =
                        card.querySelector("input");

                    checkbox.checked =
                        !checkbox.checked;

                    actualizarCadenas();

                });


                /* CHECKBOX */

                const checkbox =
                    card.querySelector("input");

                checkbox.addEventListener(
                    "change",
                    actualizarCadenas
                );

            });

        }


        /* BOTÓN VOLVER */

        const backDashboard =
            document.getElementById("backDashboard");

        if (backDashboard) {

            backDashboard.addEventListener(
                "click",
                volverDashboard
            );

        }


        /* BOTÓN CANCELAR */

        const cancelReport =
            document.getElementById("cancelReport");

        if (cancelReport) {

            cancelReport.addEventListener(
                "click",
                volverDashboard
            );

        }


        /* BOTÓN CONTINUAR */

        const continueReport =
            document.getElementById("continueReport");

        if (continueReport) {

            continueReport.addEventListener(
                "click",
                guardarConfiguracionReporte
            );

        }

    }


    /* =====================================================
       ACTUALIZAR CADENAS
    ===================================================== */

    function actualizarCadenas() {

        const seleccionadas =
            document.querySelectorAll(
                "#chainsGrid input:checked"
            );

        const contador =
            document.getElementById("contadorCadenas");


        if (contador) {

            contador.textContent =
                `${seleccionadas.length} seleccionadas`;

        }


        if (seleccionadas.length > 0) {

            mostrarSucursales(
                [...seleccionadas].map(
                    input => input.value
                )
            );

        } else {

            const branchesSection =
                document.getElementById(
                    "branchesSection"
                );

            if (branchesSection) {

                branchesSection.style.display =
                    "none";

            }

        }

    }


    /* =====================================================
       MOSTRAR SUCURSALES
    ===================================================== */

    function mostrarSucursales(
        cadenasSeleccionadas
    ) {

        const container =
            document.getElementById(
                "branchesContainer"
            );

        const section =
            document.getElementById(
                "branchesSection"
            );


        if (!container || !section) {
            return;
        }


        container.innerHTML = "";


        cadenasSeleccionadas.forEach(cadenaId => {

            const cadena =
                cadenas.find(
                    item => item.id === cadenaId
                );


            if (!cadena) {
                return;
            }


            const block =
                document.createElement("div");

            block.className =
                "branch-block";


            block.innerHTML = `

                <div class="branch-title">

                    <h4>
                        ${cadena.nombre}
                    </h4>

                    <span>
                        Selecciona las tiendas
                    </span>

                </div>


                <div class="branches-grid">

                    ${cadena.sucursales
                    .map(sucursal => `

        <label
            class="branch-option"
        >

            <input
                type="checkbox"
                value="${sucursal.id}"
                data-chain="${cadena.id}"
            >

            <span>
                ${sucursal.nombre}
            </span>

        </label>

    `)
                    .join("")}
                </div>

            `;


            container.appendChild(block);

        });


        section.style.display = "block";

    }


    /* =====================================================
       GUARDAR CONFIGURACIÓN DEL REPORTE
    ===================================================== */

    function guardarConfiguracionReporte() {

        const nombreInput =
            document.getElementById(
                "nombreReporte"
            );

        const fechaInput =
            document.getElementById(
                "fechaReporte"
            );


        const nombre =
            nombreInput
                ? nombreInput.value.trim()
                : "";


        const fecha =
            fechaInput && fechaInput.value
                ? fechaInput.value
                : obtenerFechaActual();


        if (!nombre) {

            alert(
                "Ingresa un nombre para el reporte."
            );

            if (nombreInput) {
                nombreInput.focus();
            }

            return;
        }


        const cadenasSeleccionadas =
            document.querySelectorAll(
                "#chainsGrid input:checked"
            );


        if (
            cadenasSeleccionadas.length === 0
        ) {

            alert(
                "Selecciona al menos una cadena."
            );

            return;
        }


        /* CREAR REPORTE */

        crearReporte(
            nombre,
            fecha
        );


        /* AGREGAR CADENAS */

        cadenasSeleccionadas.forEach(checkbox => {

            seleccionarCadena(
                checkbox.value
            );

        });


        /* AGREGAR SUCURSALES */

        const sucursalesSeleccionadas =
            document.querySelectorAll(
                ".branch-option input:checked"
            );


        sucursalesSeleccionadas.forEach(checkbox => {

            seleccionarSucursal(
                checkbox.dataset.chain,
                checkbox.value
            );

        });


        /* VALIDAR SUCURSALES */

        const reporte =
            obtenerReporte();


        const cadenasSinSucursal =
            reporte.cadenas.filter(
                cadena =>
                    cadena.sucursales.length === 0
            );


        if (
            cadenasSinSucursal.length > 0
        ) {

            alert(
                "Selecciona al menos una sucursal para cada cadena seleccionada."
            );

            return;
        }


        console.log(
            "REPORTE CONFIGURADO:",
            obtenerReporte()
        );


        /* SIGUIENTE PASO */

        mostrarCargaFotografias();

    }


    /* =====================================================
       PANTALLA DE FOTOGRAFÍAS
    ===================================================== */

    function mostrarCargaFotografias() {

        mainContent.innerHTML = `

            <div class="new-report-page">

                <div class="page-header">

                    <div>

                        <p class="section-label">
                            PASO 3
                        </p>

                        <h2>
                            Clasificar fotografías
                        </h2>

                        <p>
                            Sube todas las fotografías y
                            asígnalas a su cadena y sucursal.
                        </p>

                    </div>


                    <button
                        class="back-btn"
                        id="backConfiguration"
                    >
                        ← Configuración
                    </button>

                </div>


                <!-- BANDEJA -->

                <div class="form-card">

                    <div class="form-title">

                        <div>

                            <p class="section-label">
                                01
                            </p>

                            <h3>
                                Bandeja de fotografías
                            </h3>

                        </div>

                        <span id="pendingCounter">
                            0 pendientes
                        </span>

                    </div>


                    <label
                        class="photo-drop-zone"
                        id="photoDropZone"
                    >

                        <input
                            type="file"
                            id="photoInput"
                            multiple
                            accept="image/*"
                            hidden
                        >

                        <div class="photo-drop-icon">
                            ↑
                        </div>

                        <strong>
                            Arrastra tus fotografías aquí
                        </strong>

                        <span>
                            o haz clic para seleccionar archivos
                        </span>

                        <small>
                            JPG, PNG o WEBP
                        </small>

                    </label>


                    <div
                        id="pendingPhotos"
                        class="pending-photos-grid"
                    ></div>

                </div>


                <!-- ASIGNACIÓN -->

                <div
                    class="form-card"
                    id="assignmentCard"
                >

                    <div class="form-title">

                        <div>

                            <p class="section-label">
                                02
                            </p>

                            <h3>
                                Asignar fotografías
                            </h3>

                        </div>

                        <span id="selectedPhotoCounter">
                            0 seleccionadas
                        </span>

                    </div>


                    <div class="assignment-form">

                        <div class="form-group">

                            <label>
                                Cadena
                            </label>

                            <select
                                id="assignmentChain"
                            >

                                <option value="">
                                    Selecciona una cadena
                                </option>

                            </select>

                        </div>


                        <div class="form-group">

                            <label>
                                Sucursal
                            </label>

                            <select
                                id="assignmentBranch"
                                disabled
                            >

                                <option value="">
                                    Primero selecciona una cadena
                                </option>

                            </select>

                        </div>


                        <button
                            class="continue-btn"
                            id="assignPhotos"
                        >
                            ✓ Asignar fotografías
                        </button>

                    </div>

                </div>


                <!-- CLASIFICADAS -->

                <div class="form-card">

                    <div class="form-title">

                        <div>

                            <p class="section-label">
                                03
                            </p>

                            <h3>
                                Fotografías clasificadas
                            </h3>

                        </div>

                        <span id="classifiedCounter">
                            0 fotografías
                        </span>

                    </div>


                    <div id="classifiedPhotos"></div>

                </div>


                <!-- ACCIONES -->

                <div class="form-actions">

                    <button
                        class="secondary-btn"
                        id="cancelPhotos"
                    >
                        Cancelar
                    </button>


                    <button
                        class="continue-btn"
                        id="generateReport"
                    >
                        Revisar y generar PPT →
                    </button>

                </div>

            </div>

        `;


        inicializarClasificadorFotografias();

    }


    /* =====================================================
       INICIALIZAR CLASIFICADOR
    ===================================================== */

    function inicializarClasificadorFotografias() {

        const input =
            document.getElementById(
                "photoInput"
            );

        const dropZone =
            document.getElementById(
                "photoDropZone"
            );


        if (!input || !dropZone) {
            return;
        }


        /* INPUT */

        input.addEventListener(
            "change",
            event => {

                procesarArchivos(
                    [...event.target.files]
                );

                /* Permitir volver a seleccionar
                   los mismos archivos */

                event.target.value = "";

            }
        );


        /* DRAG */

        dropZone.addEventListener(
            "dragover",
            event => {

                event.preventDefault();

                dropZone.classList.add(
                    "drag-active"
                );

            }
        );


        dropZone.addEventListener(
            "dragleave",
            () => {

                dropZone.classList.remove(
                    "drag-active"
                );

            }
        );


        dropZone.addEventListener(
            "drop",
            event => {

                event.preventDefault();

                dropZone.classList.remove(
                    "drag-active"
                );


                procesarArchivos(
                    [...event.dataTransfer.files]
                );

            }
        );


        /* CADENA */

        const chainSelect =
            document.getElementById(
                "assignmentChain"
            );


        if (chainSelect) {

            /*
             * IMPORTANTE:
             * Solo mostramos las cadenas que
             * fueron seleccionadas para ESTE reporte.
             */

            const reporte =
                obtenerReporte();


            reporte.cadenas.forEach(cadena => {

                const option =
                    document.createElement(
                        "option"
                    );

                option.value =
                    cadena.id;

                option.textContent =
                    cadena.nombre;

                chainSelect.appendChild(
                    option
                );

            });


            chainSelect.addEventListener(
                "change",
                actualizarSucursalesAsignacion
            );

        }


        /* ASIGNAR */

        const assignButton =
            document.getElementById(
                "assignPhotos"
            );


        if (assignButton) {

            assignButton.addEventListener(
                "click",
                asignarFotosSeleccionadas
            );

        }


        /* VOLVER */

        const backButton =
            document.getElementById(
                "backConfiguration"
            );


        if (backButton) {

            backButton.addEventListener(
                "click",
                mostrarNuevoReporte
            );

        }


        /* CANCELAR */

        const cancelButton =
            document.getElementById(
                "cancelPhotos"
            );


        if (cancelButton) {

            cancelButton.addEventListener(
                "click",
                volverDashboard
            );

        }


        /* GENERAR */

        const generateButton =
            document.getElementById(
                "generateReport"
            );


        if (generateButton) {

            generateButton.addEventListener(
                "click",
                prepararGeneracionPPT
            );

        }


        renderizarFotografiasPendientes();

        renderizarFotografiasClasificadas();

    }


    /* =====================================================
       PROCESAR ARCHIVOS
    ===================================================== */

    function procesarArchivos(archivos) {

        const imagenes =
            archivos.filter(
                archivo =>
                    archivo.type &&
                    archivo.type.startsWith("image/")
            );


        if (imagenes.length === 0) {

            alert(
                "No se encontraron archivos de imagen."
            );

            return;
        }


        imagenes.forEach(archivo => {

            const fotografia = {

                id:
                    `pending-${Date.now()}-${Math.random()
                        .toString(36)
                        .substring(2, 8)}`,

                nombre:
                    archivo.name,

                archivo:
                    archivo,

                url:
                    URL.createObjectURL(archivo)

            };


            fotografiasPendientes.push(
                fotografia
            );

        });


        renderizarFotografiasPendientes();

    }


    /* =====================================================
       RENDERIZAR PENDIENTES
    ===================================================== */

    function renderizarFotografiasPendientes() {

        const container =
            document.getElementById(
                "pendingPhotos"
            );


        const counter =
            document.getElementById(
                "pendingCounter"
            );


        if (!container) {
            return;
        }


        container.innerHTML = "";


        fotografiasPendientes.forEach(
            fotografia => {

                const seleccionado =
                    fotografiasSeleccionadas.some(
                        foto =>
                            foto.id ===
                            fotografia.id
                    );


                const card =
                    document.createElement(
                        "div"
                    );


                card.className =
                    "pending-photo-card";


                if (seleccionado) {

                    card.classList.add(
                        "selected"
                    );

                }


                card.innerHTML = `

                    <div class="photo-checkbox">

                        <input
                            type="checkbox"
                            ${seleccionado ? "checked" : ""}
                        >

                    </div>


                    <img
                        src="${fotografia.url}"
                        alt="${fotografia.nombre}"
                    >


                    <div class="photo-name">
                        ${fotografia.nombre}
                    </div>

                `;


                card.addEventListener(
                    "click",
                    event => {

                        if (
                            event.target.tagName ===
                            "INPUT"
                        ) {
                            return;
                        }

                        alternarSeleccionFoto(
                            fotografia.id
                        );

                    }
                );


                const checkbox =
                    card.querySelector("input");


                checkbox.addEventListener(
                    "change",
                    () => {

                        alternarSeleccionFoto(
                            fotografia.id
                        );

                    }
                );


                container.appendChild(card);

            }
        );


        if (counter) {

            counter.textContent =
                `${fotografiasPendientes.length} pendientes`;

        }


        actualizarContadorSeleccion();

    }


    /* =====================================================
       SELECCIONAR / DESELECCIONAR FOTO
    ===================================================== */

    function alternarSeleccionFoto(
        fotografiaId
    ) {

        const index =
            fotografiasSeleccionadas.findIndex(
                foto =>
                    foto.id === fotografiaId
            );


        if (index >= 0) {

            fotografiasSeleccionadas.splice(
                index,
                1
            );

        } else {

            const fotografia =
                fotografiasPendientes.find(
                    foto =>
                        foto.id === fotografiaId
                );


            if (fotografia) {

                fotografiasSeleccionadas.push(
                    fotografia
                );

            }

        }


        renderizarFotografiasPendientes();

    }


    /* =====================================================
       CONTADOR DE SELECCIONADAS
    ===================================================== */


    function actualizarContadorSeleccion() {

        const counter =
            document.getElementById(
                "selectedPhotoCounter"
            );

        if (!counter) {
            return;
        }

        const cantidad =
            fotografiasSeleccionadas.length;

        counter.textContent =
            `${cantidad} seleccionada${cantidad === 1 ? "" : "s"}`;

    }


    /* =====================================================
       ACTUALIZAR SUCURSALES
       
       ESTA ES UNA PARTE IMPORTANTE DE LA CORRECCIÓN.
       
       Antes se utilizaba:
       
       slugify(sucursal)
       
       Pero reporte.js crea:
       
       cadenaId + "-" + slugify(sucursal)
       
       Ahora usamos directamente el ID real
       almacenado en reporteActual.
    ===================================================== */

    function actualizarSucursalesAsignacion() {

        const chainSelect =
            document.getElementById(
                "assignmentChain"
            );


        const branchSelect =
            document.getElementById(
                "assignmentBranch"
            );


        if (!chainSelect || !branchSelect) {
            return;
        }


        const cadenaId =
            chainSelect.value;


        const cadena =
            obtenerCadena(cadenaId);


        branchSelect.innerHTML = "";


        if (!cadena) {

            branchSelect.disabled =
                true;


            branchSelect.innerHTML = `

                <option value="">
                    Primero selecciona una cadena
                </option>

            `;

            return;
        }


        branchSelect.disabled =
            false;


        branchSelect.innerHTML = `

            <option value="">
                Selecciona una sucursal
            </option>

        `;


        cadena.sucursales.forEach(
            sucursal => {

                const option =
                    document.createElement(
                        "option"
                    );


                /*
                 * AQUÍ ESTÁ LA CORRECCIÓN:
                 *
                 * Usamos sucursal.id
                 * y NO slugify(sucursal.nombre).
                 */

                option.value =
                    sucursal.id;


                option.textContent =
                    sucursal.nombre;


                branchSelect.appendChild(
                    option
                );

            }
        );

    }


    /* =====================================================
       ASIGNAR FOTOGRAFÍAS
    ===================================================== */

    function asignarFotosSeleccionadas() {

        if (
            fotografiasSeleccionadas.length === 0
        ) {

            alert(
                "Selecciona al menos una fotografía."
            );

            return;
        }


        const chainSelect =
            document.getElementById(
                "assignmentChain"
            );


        const branchSelect =
            document.getElementById(
                "assignmentBranch"
            );


        const cadenaId =
            chainSelect.value;


        const sucursalId =
            branchSelect.value;


        if (!cadenaId) {

            alert(
                "Selecciona una cadena."
            );

            return;
        }


        if (!sucursalId) {

            alert(
                "Selecciona una sucursal."
            );

            return;
        }


        /*
         * Buscar cadena REAL dentro del reporte.
         */

        const cadena =
            obtenerCadena(cadenaId);


        if (!cadena) {

            alert(
                "No se encontró la cadena seleccionada."
            );

            return;
        }


        /*
         * Buscar sucursal REAL.
         */

        const sucursal =
            cadena.sucursales.find(
                item =>
                    item.id === sucursalId
            );


        if (!sucursal) {

            alert(
                "No se encontró la sucursal seleccionada."
            );

            return;
        }


        /*
         * ASIGNAR FOTOS
         *
         * Aquí se utiliza el ID REAL de la sucursal.
         */

        const resultado =
            asignarFotografias(
                fotografiasSeleccionadas,
                cadenaId,
                sucursalId
            );


        if (!resultado) {

            alert(
                "No se pudieron asignar las fotografías."
            );

            return;
        }


        /*
         * Guardar IDs asignados.
         */

        const idsAsignados =
            fotografiasSeleccionadas.map(
                foto =>
                    foto.id
            );


        /*
         * Sacar fotos de pendientes.
         */

        const fotosAsignadas =
            fotografiasPendientes.filter(
                foto =>
                    idsAsignados.includes(
                        foto.id
                    )
            );


        fotografiasPendientes =
            fotografiasPendientes.filter(
                foto =>
                    !idsAsignados.includes(
                        foto.id
                    )
            );


        /*
         * Liberar URLs de las fotos
         * pendientes que ya fueron asignadas
         * NO se hace revoke porque las fotos
         * siguen utilizándose dentro del reporte.
         */


        /*
         * Limpiar selección.
         */

        fotografiasSeleccionadas = [];


        /*
         * Resetear select.
         */

        chainSelect.value = "";


        branchSelect.innerHTML = `

            <option value="">
                Primero selecciona una cadena
            </option>

        `;


        branchSelect.disabled =
            true;


        /*
         * Actualizar interfaz.
         */

        renderizarFotografiasPendientes();

        renderizarFotografiasClasificadas();


        /*
         * Confirmación.
         */

        alert(
            `${fotosAsignadas.length} fotografía(s) asignada(s) a ${cadena.nombre} → ${sucursal.nombre}`
        );

    }


    /* =====================================================
       RENDERIZAR FOTOGRAFÍAS CLASIFICADAS
    ===================================================== */

    function renderizarFotografiasClasificadas() {

        const container =
            document.getElementById(
                "classifiedPhotos"
            );


        const counter =
            document.getElementById(
                "classifiedCounter"
            );


        if (!container) {
            return;
        }


        const reporte =
            obtenerReporte();


        container.innerHTML = "";


        let total = 0;


        reporte.cadenas.forEach(
            cadena => {

                const cadenaBlock =
                    document.createElement(
                        "div"
                    );


                cadenaBlock.className =
                    "classified-chain";


                cadenaBlock.innerHTML = `

                    <div class="branch-title">

                        <h4>
                            ${cadena.nombre}
                        </h4>

                    </div>

                `;


                cadena.sucursales.forEach(
                    sucursal => {

                        total +=
                            sucursal.fotografias.length;


                        const row =
                            document.createElement(
                                "div"
                            );


                        row.className =
                            "classified-row";


                        row.innerHTML = `

                            <div>

                                <strong>
                                    ${sucursal.nombre}
                                </strong>

                                <span>
                                    ${sucursal.fotografias.length}
                                    fotografías
                                </span>

                            </div>


                            <div
                                class="classified-thumbnails"
                            >

                                ${sucursal.fotografias
                                .slice(0, 5)
                                .map(
                                    foto => `

                                            <img
                                                src="${foto.url}"
                                                alt="${foto.nombre}"
                                            >

                                        `
                                )
                                .join("")
                            }

                            </div>

                        `;


                        cadenaBlock.appendChild(
                            row
                        );

                    }
                );


                container.appendChild(
                    cadenaBlock
                );

            }
        );


        if (counter) {

            counter.textContent =
                `${total} fotografías`;

        }

    }


    /* =====================================================
       PREPARAR GENERACIÓN DE PPT
    ===================================================== */

    async function prepararGeneracionPPT() {
        try {
            // 1. Verificar que no haya fotografías pendientes
            if (
                typeof fotografiasPendientes !== 'undefined' &&
                fotografiasPendientes.length > 0
            ) {
                alert(
                    `Todavía tienes ${fotografiasPendientes.length} fotografía(s) sin clasificar.\n\n` +
                    'Clasifica todas las fotografías antes de generar la PPT.'
                );
                return;
            }

            // 2. Validar el reporte
            const validacion = validarReporte();

            if (!validacion.valido) {
                alert(
                    'El reporte todavía tiene problemas:\n\n' +
                    validacion.errores.join('\n')
                );
                return;
            }

            // 3. Verificar que exista el generador
            if (
                !window.generadorPPT ||
                typeof window.generadorPPT.generar !== 'function'
            ) {
                alert(
                    'El generador de PPT no está cargado.\n\n' +
                    'Verifica que generadorPPT.js esté incluido en index.html.'
                );
                return;
            }

            // 4. Generar PPT
            await window.generadorPPT.generar();

        } catch (error) {
            console.error('Error preparando generación de PPT:', error);

            alert(
                'Ocurrió un error al preparar la generación de la PPT.\n\n' +
                error.message
            );
        }
    }


    /* =====================================================
       RENDERIZAR SECCIONES DE FOTOGRAFÍAS
    ===================================================== */

    function renderizarSeccionesFotografias() {

        const reporte =
            obtenerReporte();


        const container =
            document.getElementById(
                "photoSections"
            );


        if (!container) {
            return;
        }


        container.innerHTML = "";


        reporte.cadenas.forEach(
            cadena => {

                const cadenaBlock =
                    document.createElement(
                        "div"
                    );


                cadenaBlock.className =
                    "branch-block";


                cadenaBlock.innerHTML = `

                    <div class="branch-title">

                        <h4>
                            ${cadena.nombre}
                        </h4>

                        <span>
                            ${cadena.sucursales.length}
                            sucursales
                        </span>

                    </div>

                `;


                cadena.sucursales.forEach(
                    sucursal => {

                        const sucursalBlock =
                            document.createElement(
                                "div"
                            );


                        sucursalBlock.style.marginTop =
                            "15px";


                        sucursalBlock.innerHTML = `

                            <div
                                style="
                                    display:flex;
                                    justify-content:space-between;
                                    align-items:center;
                                    margin-bottom:8px;
                                "
                            >

                                <strong
                                    style="
                                        font-size:11px;
                                    "
                                >
                                    ${sucursal.nombre}
                                </strong>


                                <span
                                    id="photo-count-${sucursal.id}"
                                    style="
                                        font-size:9px;
                                        color:#777;
                                    "
                                >
                                    0 fotografías
                                </span>

                            </div>


                            <label
                                class="photo-upload-box"
                                style="
                                    display:block;
                                    border:1px dashed #d8d2e8;
                                    border-radius:12px;
                                    padding:18px;
                                    text-align:center;
                                    cursor:pointer;
                                    background:#faf9fd;
                                "
                            >

                                <input
                                    type="file"
                                    multiple
                                    accept="image/*"
                                    data-chain="${cadena.id}"
                                    data-branch="${sucursal.id}"
                                    style="display:none;"
                                >

                                <div
                                    style="
                                        font-size:22px;
                                        margin-bottom:5px;
                                    "
                                >
                                    ↑
                                </div>

                                <strong
                                    style="
                                        display:block;
                                        font-size:10px;
                                    "
                                >
                                    Seleccionar fotografías
                                </strong>

                                <span
                                    style="
                                        display:block;
                                        font-size:9px;
                                        color:#888;
                                        margin-top:4px;
                                    "
                                >
                                    JPG, PNG o WEBP
                                </span>

                            </label>


                            <div
                                id="photos-${sucursal.id}"
                                style="
                                    display:grid;
                                    grid-template-columns:
                                        repeat(6, 1fr);
                                    gap:8px;
                                    margin-top:10px;
                                "
                            ></div>

                        `;


                        cadenaBlock.appendChild(
                            sucursalBlock
                        );


                        const input =
                            sucursalBlock.querySelector(
                                "input[type='file']"
                            );


                        input.addEventListener(
                            "change",
                            event => {

                                const archivos =
                                    [
                                        ...event.target.files
                                    ];


                                archivos.forEach(
                                    archivo => {

                                        agregarFotografia(
                                            cadena.id,
                                            sucursal.id,
                                            archivo
                                        );

                                    }
                                );


                                actualizarVistaFotos(
                                    cadena.id,
                                    sucursal.id
                                );


                                event.target.value = "";

                            }
                        );

                    }
                );


                container.appendChild(
                    cadenaBlock
                );

            }
        );

    }


    /* =====================================================
       ACTUALIZAR MINIATURAS
    ===================================================== */

    function actualizarVistaFotos(
        cadenaId,
        sucursalId
    ) {

        const sucursal =
            obtenerSucursal(
                cadenaId,
                sucursalId
            );


        if (!sucursal) {
            return;
        }


        const container =
            document.getElementById(
                `photos-${sucursalId}`
            );


        const counter =
            document.getElementById(
                `photo-count-${sucursalId}`
            );


        if (!container) {
            return;
        }


        container.innerHTML = "";


        sucursal.fotografias.forEach(
            foto => {

                const item =
                    document.createElement(
                        "div"
                    );


                item.style.cssText = `
                    position:relative;
                    aspect-ratio:1;
                    border-radius:8px;
                    overflow:hidden;
                    background:#eee;
                `;


                item.innerHTML = `

                    <img
                        src="${foto.url}"
                        alt="${foto.nombre}"
                        style="
                            width:100%;
                            height:100%;
                            object-fit:contain;
                            background:#f3f3f3;
                        "
                    >

                `;


                container.appendChild(
                    item
                );

            }
        );


        if (counter) {

            counter.textContent =
                `${sucursal.fotografias.length} fotografía${sucursal.fotografias.length === 1
                    ? ""
                    : "s"
                }`;

        }

    }


    /* =====================================================
       VOLVER AL DASHBOARD
    ===================================================== */

    function volverDashboard() {

        window.location.reload();

    }


    /* =====================================================
       FECHA ACTUAL
    ===================================================== */

    function obtenerFechaActual() {

        const fecha =
            new Date();


        const año =
            fecha.getFullYear();


        const mes =
            String(
                fecha.getMonth() + 1
            ).padStart(
                2,
                "0"
            );


        const dia =
            String(
                fecha.getDate()
            ).padStart(
                2,
                "0"
            );


        return `${año}-${mes}-${dia}`;

    }


    /* =====================================================
       DRAG & DROP DEL DASHBOARD
    ===================================================== */

    if (uploadArea) {

        uploadArea.addEventListener(
            "dragover",
            event => {

                event.preventDefault();

                uploadArea.style.borderColor =
                    "#6C3BFF";

                uploadArea.style.background =
                    "#F7F3FF";

            }
        );


        uploadArea.addEventListener(
            "dragleave",
            () => {

                uploadArea.style.borderColor =
                    "";

                uploadArea.style.background =
                    "";

            }
        );


        uploadArea.addEventListener(
            "drop",
            event => {

                event.preventDefault();

                uploadArea.style.borderColor =
                    "";

                uploadArea.style.background =
                    "";


                const files =
                    [
                        ...event.dataTransfer.files
                    ];


                const images =
                    files.filter(
                        file =>
                            file.type &&
                            file.type.startsWith(
                                "image/"
                            )
                    );


                if (images.length === 0) {

                    alert(
                        "Por favor, selecciona archivos de imagen."
                    );

                    return;
                }


                alert(
                    `${images.length} fotografía(s) detectada(s). Para clasificarlas, crea o abre un reporte.`
                );

            }
        );

    }

});