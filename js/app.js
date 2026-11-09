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
    // Conserva las sedes marcadas mientras se agregan o quitan cadenas.
    let sucursalesMarcadas = new Set();
    // IDs de fotografías ya clasificadas que el usuario marcó para borrar.
    const fotografiasClasificadasMarcadas = new Set();


    /* =====================================================
       AUTOGUARDADO DEL REPORTE EN INDEXEDDB
       Se guarda por nombre + fecha del documento. Las fotos
       se almacenan como File/Blob, no como URLs temporales.
    ===================================================== */

    const AUTOSAVE_DB = "ReportX_Autosave_DB";
    const AUTOSAVE_STORE = "borradores";
    let autosaveTimer = null;
    let autosaveRestoring = false;
    let autosaveLastKey = null;

    function abrirDBAutoguardado() {
        return new Promise((resolve, reject) => {
            if (!window.indexedDB) {
                reject(new Error("Este navegador no permite almacenamiento local avanzado."));
                return;
            }
            const request = indexedDB.open(AUTOSAVE_DB, 1);
            request.onupgradeneeded = () => {
                const db = request.result;
                if (!db.objectStoreNames.contains(AUTOSAVE_STORE)) {
                    db.createObjectStore(AUTOSAVE_STORE, { keyPath: "key" });
                }
            };
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    function claveAutoguardado(nombre, fecha) {
        const normalizado = String(nombre || "reporte")
            .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
            .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
        return `${normalizado || "reporte"}__${fecha || "sin-fecha"}`;
    }

    function actualizarEstadoAutoguardado(texto, error = false) {
        const el = document.getElementById("autosaveStatus");
        if (!el) return;
        el.textContent = texto;
        el.style.color = error ? "#b42318" : "#667085";
    }

    function crearSnapshotAutoguardado() {
        const reporte = typeof obtenerReporte === "function" ? obtenerReporte() : null;
        if (!reporte || !reporte.nombre || !reporte.id) return null;

        const copiarFoto = foto => ({
            id: foto.id,
            nombre: foto.nombre || foto.archivo?.name || "fotografia",
            archivo: foto.archivo instanceof Blob ? foto.archivo : null,
            orden: foto.orden || 0
        });

        return {
            key: claveAutoguardado(reporte.nombre, reporte.fecha),
            nombre: reporte.nombre,
            fecha: reporte.fecha,
            updatedAt: Date.now(),
            etapa: document.getElementById("classifiedPhotos") ? "clasificacion" : "configuracion",
            reporte: {
                id: reporte.id, nombre: reporte.nombre, fecha: reporte.fecha,
                estado: reporte.estado,
                cadenas: (reporte.cadenas || []).map(cadena => ({
                    id: cadena.id, nombre: cadena.nombre,
                    sucursales: (cadena.sucursales || []).map(sucursal => ({
                        id: sucursal.id, nombre: sucursal.nombre,
                        fotografias: (sucursal.fotografias || []).map(copiarFoto)
                    }))
                }))
            },
            pendientes: fotografiasPendientes.map(copiarFoto)
        };
    }

    async function guardarAutoguardado() {
        if (autosaveRestoring) return;
        const snapshot = crearSnapshotAutoguardado();
        if (!snapshot) return;
        try {
            const db = await abrirDBAutoguardado();
            await new Promise((resolve, reject) => {
                const tx = db.transaction(AUTOSAVE_STORE, "readwrite");
                tx.objectStore(AUTOSAVE_STORE).put(snapshot);
                tx.oncomplete = resolve;
                tx.onerror = () => reject(tx.error);
                tx.onabort = () => reject(tx.error);
            });
            db.close();
            autosaveLastKey = snapshot.key;
            actualizarEstadoAutoguardado(`Guardado automáticamente · ${new Date(snapshot.updatedAt).toLocaleTimeString("es-PE", {hour:"2-digit", minute:"2-digit"})}`);
        } catch (error) {
            console.error("Error en autoguardado de ReportX:", error);
            actualizarEstadoAutoguardado("No se pudo guardar automáticamente. Revisa el espacio disponible del navegador.", true);
        }
    }

    async function leerUltimoAutoguardado() {
        const db = await abrirDBAutoguardado();
        const items = await new Promise((resolve, reject) => {
            const tx = db.transaction(AUTOSAVE_STORE, "readonly");
            const req = tx.objectStore(AUTOSAVE_STORE).getAll();
            req.onsuccess = () => resolve(req.result || []);
            req.onerror = () => reject(req.error);
        });
        db.close();
        return items.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0))[0] || null;
    }

    async function restaurarUltimoAutoguardado() {
        try {
            const draft = await leerUltimoAutoguardado();
            if (!draft || !draft.reporte) return;
            const continuar = confirm(`Se encontró un avance guardado de «${draft.nombre}» (${draft.fecha}).\n\n¿Deseas continuar donde lo dejaste?`);
            if (!continuar) return;

            autosaveRestoring = true;
            const restaurado = restaurarReporteDesdeAutoguardado(draft.reporte);
            if (!restaurado) throw new Error("El borrador no tiene una estructura válida.");

            fotografiasPendientes = (draft.pendientes || []).map(foto => ({
                ...foto, archivo: foto.archivo || null,
                url: foto.archivo ? URL.createObjectURL(foto.archivo) : ""
            }));
            fotografiasSeleccionadas = [];
            fotografiasClasificadasMarcadas.clear();
            sucursalesMarcadas = new Set();

            mostrarCargaFotografias();
            renderizarFotografiasPendientes();
            renderizarFotografiasClasificadas();
            actualizarEstadoAutoguardado(`Borrador recuperado · ${draft.nombre}`);
            autosaveLastKey = draft.key;
            autosaveRestoring = false;
        } catch (error) {
            autosaveRestoring = false;
            console.error("No se pudo recuperar el borrador:", error);
            actualizarEstadoAutoguardado("No se pudo recuperar el borrador guardado.", true);
        }
    }

    function programarAutoguardado() {
        if (autosaveRestoring) return;
        clearTimeout(autosaveTimer);
        autosaveTimer = setTimeout(guardarAutoguardado, 700);
    }

    // Captura cambios de nombre/fecha, selección, carga, asignación y eliminación.
    document.addEventListener("input", event => {
        if (event.target.closest("#mainContent")) programarAutoguardado();
    }, true);
    document.addEventListener("change", event => {
        if (event.target.closest("#mainContent")) programarAutoguardado();
    }, true);
    document.addEventListener("click", event => {
        if (event.target.closest("#mainContent")) programarAutoguardado();
    }, true);
    document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "hidden") guardarAutoguardado();
    });
    window.addEventListener("beforeunload", () => { guardarAutoguardado(); });
    setInterval(() => {
        if (typeof obtenerReporte === "function" && obtenerReporte()?.nombre) guardarAutoguardado();
    }, 5000);

    // Recuperación automática al abrir la aplicación.
    setTimeout(restaurarUltimoAutoguardado, 900);


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

        // Cada nuevo reporte comienza con una selección limpia de sedes.
        sucursalesMarcadas = new Set();

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

                    <div class="form-title branch-section-heading">

                        <div>

                            <p class="section-label">
                                PASO 2
                            </p>

                            <h3>
                                Selecciona las sucursales
                            </h3>

                        </div>

                        <div class="branch-bulk-actions">

                            <span id="contadorSucursales">
                                0 de 0 sedes seleccionadas
                            </span>

                            <button
                                type="button"
                                class="select-all-branches-btn"
                                id="toggleAllBranches"
                                disabled
                            >
                                Seleccionar todas
                            </button>

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


        /* SELECCIONAR / DESMARCAR TODAS LAS SEDES */

        const toggleAllBranches =
            document.getElementById("toggleAllBranches");

        if (toggleAllBranches) {

            toggleAllBranches.addEventListener("click", () => {

                const checkboxes = [
                    ...document.querySelectorAll(
                        "#branchesContainer .branch-option input"
                    )
                ];

                if (checkboxes.length === 0) {
                    return;
                }

                const todasSeleccionadas =
                    checkboxes.every(checkbox => checkbox.checked);

                const nuevoEstado = !todasSeleccionadas;

                checkboxes.forEach(checkbox => {

                    checkbox.checked = nuevoEstado;

                    const key = `${checkbox.dataset.chain}::${checkbox.value}`;

                    if (nuevoEstado) {
                        sucursalesMarcadas.add(key);
                    } else {
                        sucursalesMarcadas.delete(key);
                    }

                });

                actualizarControlSeleccionSucursales();

            });

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
                    .map(sucursal => {

                        const key = `${cadena.id}::${sucursal.id}`;
                        const checked = sucursalesMarcadas.has(key)
                            ? "checked"
                            : "";

                        return `

                            <label class="branch-option">

                                <input
                                    type="checkbox"
                                    value="${sucursal.id}"
                                    data-chain="${cadena.id}"
                                    ${checked}
                                >

                                <span>
                                    ${sucursal.nombre}
                                </span>

                            </label>

                        `;

                    })
                    .join("")}

                </div>

            `;


            container.appendChild(block);

        });


        // Sincroniza la selección individual con el botón global.
        container
            .querySelectorAll(".branch-option input")
            .forEach(checkbox => {

                checkbox.addEventListener("change", () => {

                    const key = `${checkbox.dataset.chain}::${checkbox.value}`;

                    if (checkbox.checked) {
                        sucursalesMarcadas.add(key);
                    } else {
                        sucursalesMarcadas.delete(key);
                    }

                    actualizarControlSeleccionSucursales();

                });

            });


        section.style.display = "block";
        actualizarControlSeleccionSucursales();

    }


    /* =====================================================
       ACTUALIZAR CONTROL DE SELECCIÓN DE SUCURSALES
    ===================================================== */

    function actualizarControlSeleccionSucursales() {

        const checkboxes = [
            ...document.querySelectorAll(
                "#branchesContainer .branch-option input"
            )
        ];

        const contador =
            document.getElementById("contadorSucursales");

        const boton =
            document.getElementById("toggleAllBranches");

        const seleccionadas =
            checkboxes.filter(checkbox => checkbox.checked).length;

        const total = checkboxes.length;

        if (contador) {
            contador.textContent =
                `${seleccionadas} de ${total} sedes seleccionadas`;
        }

        if (boton) {
            const todasSeleccionadas =
                total > 0 && seleccionadas === total;

            boton.textContent = todasSeleccionadas
                ? "Desmarcar todas"
                : "Seleccionar todas";

            boton.disabled = total === 0;
            boton.setAttribute(
                "aria-pressed",
                todasSeleccionadas ? "true" : "false"
            );
        }

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
                        <small id="autosaveStatus" class="reportx-autosave-status">Autoguardado activo · se guarda según el nombre del reporte</small>

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


                    <p class="reportx-tip">Selecciona las fotografías una por una en el orden en que deben aparecer en el PowerPoint. Puedes quitar cualquier imagen antes de asignarla.</p>
                    <div id="pendingPhotos" class="pending-photos-grid"></div>

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

                            <input type="search" id="assignmentBranchSearch" class="reportx-search" placeholder="Buscar tienda por nombre..." aria-label="Filtrar tiendas por nombre" disabled autocomplete="off">
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


                    <div class="reportx-restore-store">
                        <h4>Agregar o recuperar una tienda</h4>
                        <p>Si eliminaste una tienda, selecciónala aquí para incorporarla nuevamente sin perder tu avance.</p>
                        <div class="reportx-restore-controls">
                            <select id="restoreChain" aria-label="Cadena para agregar tienda"><option value="">Selecciona una cadena</option></select>
                            <input id="restoreBranchSearch" class="reportx-search" type="search" placeholder="Buscar tienda..." disabled aria-label="Buscar tienda para agregar">
                            <select id="restoreBranch" disabled aria-label="Tienda para agregar"><option value="">Selecciona una tienda</option></select>
                            <button type="button" class="continue-btn" id="restoreStore">+ Agregar tienda</button>
                        </div>
                        <small id="reportxCatalogCount"></small>
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


            chainSelect.addEventListener("change", () => {
                const busqueda = document.getElementById("assignmentBranchSearch");
                if (busqueda) busqueda.value = "";
                actualizarSucursalesAsignacion();
            });
            document.getElementById("assignmentBranchSearch")?.addEventListener("input", actualizarSucursalesAsignacion);

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


        // Inicializar los controles de recuperación cada vez que se abre
        // el clasificador. Los elementos se recrean al cambiar de pantalla.
        inicializarRecuperacionTiendas();

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
        programarAutoguardado();

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


                    ${seleccionado ? `<span class="reportx-selection-order" title="Orden de selección">${fotografiasSeleccionadas.findIndex(f => f.id === fotografia.id) + 1}</span>` : ""}
                    <button type="button" class="reportx-remove-pending" title="Eliminar imagen" aria-label="Eliminar imagen">×</button>
                    <img
                        src="${fotografia.url}"
                        alt="${escaparTextoReportX(fotografia.nombre)}"
                    >


                    <div class="photo-name">
                        ${escaparTextoReportX(fotografia.nombre)}
                    </div>

                `;


                card.addEventListener(
                    "click",
                    event => {

                        if (event.target.closest(".reportx-remove-pending")) {
                            eliminarImagenPendiente(fotografia.id);
                            return;
                        }
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

    function escaparTextoReportX(texto) {
        return String(texto ?? "").replace(/[&<>"']/g, x => ({
            "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
        })[x]);
    }

    function eliminarImagenPendiente(id) {
        const foto = fotografiasPendientes.find(f => f.id === id);
        if (!foto) return;
        fotografiasPendientes = fotografiasPendientes.filter(f => f.id !== id);
        fotografiasSeleccionadas = fotografiasSeleccionadas.filter(f => f.id !== id);
        if (foto.url) URL.revokeObjectURL(foto.url);
        renderizarFotografiasPendientes();
        programarAutoguardado();
    }

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
        const chainSelect = document.getElementById("assignmentChain");
        const branchSelect = document.getElementById("assignmentBranch");
        const search = document.getElementById("assignmentBranchSearch");
        if (!chainSelect || !branchSelect) return;
        const cadena = obtenerCadena(chainSelect.value);
        const previous = branchSelect.value;
        branchSelect.replaceChildren(new Option(cadena ? "Selecciona una sucursal" : "Primero selecciona una cadena", ""));
        branchSelect.disabled = !cadena;
        if (search) search.disabled = !cadena;
        if (!cadena) return;
        const filtro = normalizarBusquedaReportX(search?.value || "");
        const sucursales = [...cadena.sucursales].sort((a, b) => ordenarNombresReportX(a.nombre, b.nombre));
        sucursales.filter(s => normalizarBusquedaReportX(s.nombre).includes(filtro))
            .forEach(s => branchSelect.add(new Option(s.nombre, s.id)));
        if ([...branchSelect.options].some(option => option.value === previous)) branchSelect.value = previous;
    }

    function normalizarBusquedaReportX(texto) {
        return String(texto || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
    }

    function ordenarNombresReportX(a, b) {
        return a.localeCompare(b, "es", {sensitivity:"base", numeric:true});
    }

    function inicializarRecuperacionTiendas() {
        const chain = document.getElementById("restoreChain");
        const branch = document.getElementById("restoreBranch");
        const search = document.getElementById("restoreBranchSearch");
        const button = document.getElementById("restoreStore");
        if (!chain || !branch || !search || !button) return;
        [...cadenas].sort((a,b) => ordenarNombresReportX(a.nombre,b.nombre))
            .forEach(c => chain.add(new Option(c.nombre, c.id)));
        const total = cadenas.reduce((n,c) => n + c.sucursales.length, 0);
        document.getElementById("reportxCatalogCount").textContent =
            `Catálogo: ${total} tiendas registradas${total !== 223 ? " (pendiente identificar la tienda faltante para llegar a 223)" : ""}.`;
        const actualizar = () => {
            const catalogo = cadenas.find(c => c.id === chain.value);
            const previo = branch.value;
            branch.replaceChildren(new Option(catalogo ? "Selecciona una tienda" : "Primero selecciona una cadena", ""));
            branch.disabled = !catalogo;
            search.disabled = !catalogo;
            if (!catalogo) return;
            const filtro = normalizarBusquedaReportX(search.value);
            [...catalogo.sucursales].sort((a,b) => ordenarNombresReportX(a.nombre,b.nombre))
                .filter(s => normalizarBusquedaReportX(s.nombre).includes(filtro))
                .forEach(s => branch.add(new Option(s.nombre,s.id)));
            if ([...branch.options].some(o => o.value === previo)) branch.value = previo;
        };
        chain.addEventListener("change", () => {search.value = ""; actualizar();});
        search.addEventListener("input", actualizar);
        button.addEventListener("click", () => {
            const catalogo = cadenas.find(c => c.id === chain.value);
            const tienda = catalogo?.sucursales.find(s => s.id === branch.value);
            if (!tienda) {alert("Selecciona una cadena y una tienda."); return;}
            let cadenaReporte = obtenerCadena(catalogo.id);
            if (!cadenaReporte) cadenaReporte = agregarCadena(catalogo.id, catalogo.nombre);
            if (obtenerSucursal(catalogo.id, tienda.id)) {
                alert("Esta tienda ya está incluida en el reporte."); return;
            }
            agregarSucursal(catalogo.id, tienda.id, tienda.nombre);
            cadenaReporte.sucursales.sort((a,b) => ordenarNombresReportX(a.nombre,b.nombre));
            obtenerReporte().cadenas.sort((a,b) => ordenarNombresReportX(a.nombre,b.nombre));
            // Permite asignar imágenes a la sede recién recuperada.
            const assignmentChain = document.getElementById("assignmentChain");
            if (assignmentChain && ![...assignmentChain.options].some(o => o.value === catalogo.id)) {
                assignmentChain.add(new Option(catalogo.nombre,catalogo.id));
                const opciones = [...assignmentChain.options].filter(o => o.value)
                    .sort((a,b) => ordenarNombresReportX(a.textContent,b.textContent));
                assignmentChain.replaceChildren(new Option("Selecciona una cadena", ""), ...opciones);
            }
            if (assignmentChain?.value === catalogo.id) actualizarSucursalesAsignacion();
            renderizarFotografiasClasificadas();
            programarAutoguardado();
            alert(`Tienda «${tienda.nombre}» agregada al reporte.`);
        });
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
        const branchSearch = document.getElementById("assignmentBranchSearch");
        if (branchSearch) {branchSearch.value = ""; branchSearch.disabled = true;}

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
        programarAutoguardado();

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
            document.getElementById("classifiedPhotos");

        const counter =
            document.getElementById("classifiedCounter");

        if (!container) {
            return;
        }

        const reporte = obtenerReporte();
        container.innerHTML = "";

        let total = 0;
        let totalSedes = 0;

        const escaparHTML = valor =>
            String(valor ?? "").replace(/[&<>"']/g, caracter => ({
                "&": "&amp;",
                "<": "&lt;",
                ">": "&gt;",
                '"': "&quot;",
                "'": "&#39;"
            })[caracter]);

        const crearClaveFoto = (cadenaId, sucursalId, fotoId) =>
            `${cadenaId}::${sucursalId}::${fotoId}`;

        reporte.cadenas.forEach(cadena => {

            const cadenaBlock =
                document.createElement("div");

            cadenaBlock.className = "classified-chain";
            cadenaBlock.innerHTML = `
                <div class="branch-title">
                    <h4>${escaparHTML(cadena.nombre)}</h4>
                </div>
            `;

            cadena.sucursales.forEach(sucursal => {

                totalSedes++;
                total += sucursal.fotografias.length;

                const row =
                    document.createElement("div");

                row.className = "classified-row";

                const cantidadMarcada =
                    sucursal.fotografias.filter(foto =>
                        fotografiasClasificadasMarcadas.has(
                            crearClaveFoto(cadena.id, sucursal.id, foto.id)
                        )
                    ).length;

                row.innerHTML = `
                    <div class="classified-row-header">
                        <div class="classified-row-info">
                            <strong>${escaparHTML(sucursal.nombre)}</strong>
                            <span>${sucursal.fotografias.length} fotografía(s)</span>
                        </div>

                        <div class="classified-row-actions">
                            <button
                                type="button"
                                class="classified-delete-photos"
                                data-action="delete-photos"
                                data-chain-id="${escaparHTML(cadena.id)}"
                                data-branch-id="${escaparHTML(sucursal.id)}"
                                ${cantidadMarcada === 0 ? "disabled" : ""}
                            >
                                Borrar fotos${cantidadMarcada ? ` (${cantidadMarcada})` : ""}
                            </button>

                            <button
                                type="button"
                                class="classified-delete-store"
                                data-action="delete-store"
                                data-chain-id="${escaparHTML(cadena.id)}"
                                data-branch-id="${escaparHTML(sucursal.id)}"
                            >
                                Borrar tienda
                            </button>
                        </div>
                    </div>

                    <div class="classified-thumbnails">
                        ${sucursal.fotografias.length
                            ? sucursal.fotografias.map(foto => {
                                const clave = crearClaveFoto(cadena.id, sucursal.id, foto.id);
                                const marcada = fotografiasClasificadasMarcadas.has(clave);
                                return `
                                    <label class="classified-photo ${marcada ? "selected" : ""}">
                                        <img
                                            src="${escaparHTML(foto.url)}"
                                            alt="${escaparHTML(foto.nombre)}"
                                            title="${escaparHTML(foto.nombre)}"
                                        >
                                        <input
                                            type="checkbox"
                                            data-action="toggle-photo"
                                            data-chain-id="${escaparHTML(cadena.id)}"
                                            data-branch-id="${escaparHTML(sucursal.id)}"
                                            data-photo-id="${escaparHTML(foto.id)}"
                                            aria-label="Seleccionar ${escaparHTML(foto.nombre)} para borrar"
                                            ${marcada ? "checked" : ""}
                                        >
                                    </label>
                                `;
                            }).join("")
                            : `<span class="classified-empty">Esta tienda todavía no tiene fotografías.</span>`
                        }
                    </div>
                    ${sucursal.fotografias.length
                        ? `<small class="classified-help">Marca una o varias fotos y pulsa «Borrar fotos» para quitarlas de esta sede.</small>`
                        : ""
                    }
                `;

                cadenaBlock.appendChild(row);
            });

            container.appendChild(cadenaBlock);
        });

        // Una cadena sin sedes no debe quedar como bloque vacío.
        if (totalSedes === 0) {
            container.innerHTML = `
                <div class="classified-empty-state">
                    No hay tiendas agregadas al reporte.
                </div>
            `;
        }

        if (counter) {
            counter.textContent = `${total} fotografías · ${totalSedes} tiendas`;
        }

        // Delegación de eventos: se reemplazan los handlers al volver a renderizar.
        container.onchange = event => {
            const checkbox = event.target.closest('input[data-action="toggle-photo"]');
            if (!checkbox) return;

            const clave = crearClaveFoto(
                checkbox.dataset.chainId,
                checkbox.dataset.branchId,
                checkbox.dataset.photoId
            );

            if (checkbox.checked) {
                fotografiasClasificadasMarcadas.add(clave);
            } else {
                fotografiasClasificadasMarcadas.delete(clave);
            }

            const row = checkbox.closest(".classified-row");
            const button = row?.querySelector('[data-action="delete-photos"]');
            const cantidad = row
                ? row.querySelectorAll('input[data-action="toggle-photo"]:checked').length
                : 0;

            if (button) {
                button.disabled = cantidad === 0;
                button.textContent = cantidad
                    ? `Borrar fotos (${cantidad})`
                    : "Borrar fotos";
            }

            checkbox.closest(".classified-photo")?.classList.toggle("selected", checkbox.checked);
        };

        container.onclick = event => {
            const button = event.target.closest("button[data-action]");
            if (!button) return;

            const accion = button.dataset.action;
            const cadenaId = button.dataset.chainId;
            const sucursalId = button.dataset.branchId;
            const claveBase = `${cadenaId}::${sucursalId}::`;

            if (accion === "delete-store") {
                const cadena = obtenerCadena(cadenaId);
                const sucursal = obtenerSucursal(cadenaId, sucursalId);
                if (!cadena || !sucursal) return;

                const cantidad = sucursal.fotografias.length;
                const detalleFotos = cantidad
                    ? ` También se eliminarán ${cantidad} fotografía(s) asociadas.`
                    : "";

                if (!confirm(`¿Borrar la tienda «${sucursal.nombre}» del reporte?${detalleFotos}\n\nEsta acción no se puede deshacer.`)) {
                    return;
                }

                const eliminado = eliminarSucursal(cadenaId, sucursalId);
                if (!eliminado) {
                    alert("No se pudo eliminar la tienda. Actualiza el reporte e inténtalo nuevamente.");
                    return;
                }

                // Limpiar selección pendiente de borrado para la sede eliminada.
                [...fotografiasClasificadasMarcadas].forEach(clave => {
                    if (clave.startsWith(claveBase)) {
                        fotografiasClasificadasMarcadas.delete(clave);
                    }
                });

                const cadenaActualizada = obtenerCadena(cadenaId);
                if (cadenaActualizada && cadenaActualizada.sucursales.length === 0) {
                    eliminarCadena(cadenaId);
                }

                renderizarFotografiasClasificadas();
                renderizarFotografiasPendientes();
                programarAutoguardado();
                return;
            }

            if (accion === "delete-photos") {
                const sucursal = obtenerSucursal(cadenaId, sucursalId);
                if (!sucursal) return;

                const idsSeleccionados = sucursal.fotografias
                    .filter(foto => fotografiasClasificadasMarcadas.has(
                        crearClaveFoto(cadenaId, sucursalId, foto.id)
                    ))
                    .map(foto => foto.id);

                if (idsSeleccionados.length === 0) {
                    alert("Primero marca una o varias fotografías de esta tienda.");
                    return;
                }

                if (!confirm(`¿Borrar ${idsSeleccionados.length} fotografía(s) seleccionada(s) de «${sucursal.nombre}»?\n\nLa tienda se mantendrá en el reporte.`)) {
                    return;
                }

                let eliminadas = 0;
                idsSeleccionados.forEach(fotoId => {
                    if (eliminarFotografia(cadenaId, sucursalId, fotoId)) {
                        eliminadas++;
                    }
                    fotografiasClasificadasMarcadas.delete(
                        crearClaveFoto(cadenaId, sucursalId, fotoId)
                    );
                });

                renderizarFotografiasClasificadas();
                renderizarFotografiasPendientes();
                programarAutoguardado();

                if (eliminadas > 0) {
                    console.info(`${eliminadas} fotografía(s) eliminada(s) de ${sucursal.nombre}.`);
                }
            }
        };

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