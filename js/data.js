<!DOCTYPE html>
<html lang="es">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">

    <title>ReportX | Gestión de reportes</title>

    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">

    <link rel="stylesheet" href="css/styles.css">
</head>

<body>

    <div class="app">

        <!-- SIDEBAR -->
        <aside class="sidebar">

            <div class="brand">
                <div class="brand-icon">
                    R
                </div>

                <div class="brand-text">
                    <span>Report</span><strong>X</strong>
                </div>
            </div>

            <nav class="navigation">

                <p class="nav-title">PRINCIPAL</p>

                <a href="#" class="nav-item active">
                    <span class="nav-icon">⌂</span>
                    <span>Dashboard</span>
                </a>

                <a href="#" class="nav-item">
                    <span class="nav-icon">＋</span>
                    <span>Nuevo reporte</span>
                </a>

                <a href="#" class="nav-item">
                    <span class="nav-icon">▣</span>
                    <span>Mis reportes</span>
                </a>

                <p class="nav-title">GESTIÓN</p>

                <a href="#" class="nav-item">
                    <span class="nav-icon">▤</span>
                    <span>Sucursales</span>
                </a>

                <a href="#" class="nav-item">
                    <span class="nav-icon">⚙</span>
                    <span>Configuración</span>
                </a>

            </nav>

            <div class="sidebar-bottom">

                <div class="help-card">
                    <div class="help-icon">?</div>

                    <div>
                        <strong>¿Necesitas ayuda?</strong>
                        <span>Consulta la guía</span>
                    </div>
                </div>

                <div class="user-profile">
                    <div class="avatar">
                        N
                    </div>

                    <div class="user-info">
                        <strong>Usuario</strong>
                        <span>Marketing</span>
                    </div>

                    <button class="more-btn">•••</button>
                </div>

            </div>

        </aside>


        <!-- MAIN -->
        <main class="main">

            <!-- HEADER -->
            <header class="topbar">

                <div>
                    <p class="breadcrumb">Inicio / Dashboard</p>
                    <h1>Hola, bienvenido 👋</h1>
                </div>

                <div class="topbar-actions">

                    <button class="notification">
                        🔔
                        <span></span>
                    </button>

                    <button class="new-report-btn" id="newReportBtn">
                        <span>＋</span>
                        Nuevo reporte
                    </button>

                </div>

            </header>


            <!-- CONTENT -->
            <section class="content" id="mainContent">

                <!-- STATS -->
                <div class="stats-grid">

                    <div class="stat-card">

                        <div class="stat-header">
                            <span>Reportes generados</span>

                            <div class="stat-icon purple">
                                ▣
                            </div>
                        </div>

                        <div class="stat-value">
                            24
                        </div>

                        <div class="stat-footer positive">
                            ↑ 12.5%
                            <span>vs. mes anterior</span>
                        </div>

                    </div>


                    <div class="stat-card">

                        <div class="stat-header">
                            <span>Sucursales</span>

                            <div class="stat-icon blue">
                                ◉
                            </div>
                        </div>

                        <div class="stat-value">
                            18
                        </div>

                        <div class="stat-footer">
                            <span>Registradas actualmente</span>
                        </div>

                    </div>


                    <div class="stat-card">

                        <div class="stat-header">
                            <span>Fotografías procesadas</span>

                            <div class="stat-icon lime">
                                ◫
                            </div>
                        </div>

                        <div class="stat-value">
                            486
                        </div>

                        <div class="stat-footer positive">
                            ↑ 28.4%
                            <span>este mes</span>
                        </div>

                    </div>


                    <div class="stat-card highlight">

                        <div class="stat-header">
                            <span>Tiempo ahorrado</span>

                            <div class="stat-icon dark">
                                ◷
                            </div>
                        </div>

                        <div class="stat-value">
                            16.5 h
                        </div>

                        <div class="stat-footer">
                            <span>estimadas mediante automatización</span>
                        </div>

                    </div>

                </div>


                <!-- MAIN GRID -->
                <div class="dashboard-grid">


                    <!-- NEW REPORT -->
                    <div class="panel report-panel">

                        <div class="panel-header">

                            <div>
                                <p class="section-label">AUTOMATIZACIÓN</p>
                                <h2>Crear nuevo reporte</h2>
                                <p>
                                    Organiza las fotografías de tus sucursales
                                    y genera el reporte automáticamente.
                                </p>
                            </div>

                            <div class="panel-decoration">
                                ✦
                            </div>

                        </div>


                        <div class="upload-area" id="uploadArea">

                            <div class="upload-icon">
                                ↑
                            </div>

                            <h3>Comienza cargando tus fotografías</h3>

                            <p>
                                Arrastra tus archivos aquí o selecciona
                                las fotografías desde tu computadora.
                            </p>

                            <button class="upload-btn">
                                Seleccionar fotografías
                            </button>

                            <small>
                                JPG, PNG · Máximo 10 MB por archivo
                            </small>

                        </div>


                        <div class="report-options">

                            <div class="option">

                                <span class="option-icon">
                                    🏪
                                </span>

                                <div>
                                    <strong>Sucursales</strong>
                                    <span>18 registradas</span>
                                </div>

                            </div>


                            <div class="option">

                                <span class="option-icon">
                                    📅
                                </span>

                                <div>
                                    <strong>Periodo</strong>
                                    <span>Octubre 2026</span>
                                </div>

                            </div>


                            <button class="continue-btn">
                                Continuar →
                            </button>

                        </div>

                    </div>


                    <!-- RECENT REPORTS -->
                    <div class="panel recent-panel">

                        <div class="panel-heading">

                            <div>
                                <p class="section-label">ACTIVIDAD</p>
                                <h2>Reportes recientes</h2>
                            </div>

                            <a href="#">
                                Ver todos
                            </a>

                        </div>


                        <div class="report-list">

                            <div class="report-item">

                                <div class="report-file purple-bg">
                                    PPT
                                </div>

                                <div class="report-info">
                                    <strong>Reporte Octubre</strong>
                                    <span>Plaza Vea Puruchuco</span>
                                </div>

                                <div class="report-date">
                                    Hoy
                                </div>

                            </div>


                            <div class="report-item">

                                <div class="report-file blue-bg">
                                    PPT
                                </div>

                                <div class="report-info">
                                    <strong>Reporte Octubre</strong>
                                    <span>Plaza Vea San Miguel</span>
                                </div>

                                <div class="report-date">
                                    Ayer
                                </div>

                            </div>


                            <div class="report-item">

                                <div class="report-file lime-bg">
                                    PPT
                                </div>

                                <div class="report-info">
                                    <strong>Reporte Septiembre</strong>
                                    <span>Plaza Vea La Molina</span>
                                </div>

                                <div class="report-date">
                                    29 Sep
                                </div>

                            </div>


                            <div class="report-item">

                                <div class="report-file purple-bg">
                                    PPT
                                </div>

                                <div class="report-info">
                                    <strong>Reporte Septiembre</strong>
                                    <span>Plaza Vea Salaverry</span>
                                </div>

                                <div class="report-date">
                                    27 Sep
                                </div>

                            </div>

                        </div>

                    </div>

                </div>


                <!-- BRANCHES -->
                <div class="panel branches-panel">

                    <div class="panel-heading">

                        <div>
                            <p class="section-label">RED COMERCIAL</p>
                            <h2>Sucursales</h2>
                        </div>

                        <button class="view-all">
                            Gestionar sucursales →
                        </button>

                    </div>


                    <div class="branch-grid">

                        <div class="branch-card">
                            <div class="branch-avatar purple-gradient">
                                PV
                            </div>

                            <div>
                                <strong>Plaza Vea Puruchuco</strong>
                                <span>Último reporte: Hoy</span>
                            </div>

                            <span class="status active-status">
                                Activo
                            </span>
                        </div>


                        <div class="branch-card">
                            <div class="branch-avatar blue-gradient">
                                PV
                            </div>

                            <div>
                                <strong>Plaza Vea San Miguel</strong>
                                <span>Último reporte: Ayer</span>
                            </div>

                            <span class="status active-status">
                                Activo
                            </span>
                        </div>


                        <div class="branch-card">
                            <div class="branch-avatar lime-gradient">
                                PV
                            </div>

                            <div>
                                <strong>Plaza Vea La Molina</strong>
                                <span>Último reporte: 29 Sep</span>
                            </div>

                            <span class="status active-status">
                                Activo
                            </span>
                        </div>

                    </div>

                </div>

            </section>

        </main>

    </div>


    <script src="js/data.js"></script>
<script src="js/reporte.js"></script>
<script src="js/app.js"></script>
<script src="js/generadorPPT.js"></script>

</body>

</html>
