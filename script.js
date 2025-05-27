// Verificación de autenticación
if (localStorage.getItem('isAuthenticated') !== 'true') {
    Swal.fire({
        icon: 'warning',
        title: 'Acceso denegado',
        text: 'Debes iniciar sesión para acceder a esta página',
        showConfirmButton: true
    }).then(() => {
        window.location.href = 'login.html';
    });
}

// Mostrar información del usuario
const userInfo = document.getElementById('userInfo');
const username = localStorage.getItem('username');
userInfo.textContent = `Bienvenido, ${username}`;

// Manejar cierre de sesión
document.getElementById('logoutBtn').addEventListener('click', () => {
    Swal.fire({
        title: '¿Cerrar sesión?',
        text: '¿Estás seguro que deseas cerrar sesión?',
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Sí, cerrar sesión',
        cancelButtonText: 'Cancelar'
    }).then((result) => {
        if (result.isConfirmed) {
            localStorage.removeItem('isAuthenticated');
            localStorage.removeItem('username');
            window.location.href = 'login.html';
        }
    });
});

// Clase para manejar los gastos
class Gasto {
    constructor(monto, categoria, descripcion, fecha) {
        this.monto = parseFloat(monto);
        this.categoria = categoria;
        this.descripcion = descripcion;
        this.fecha = fecha;
        this.id = Date.now(); // Identificador único
    }
}

// Clase para manejar la aplicación
class GestorGastos {
    constructor() {
        this.gastos = JSON.parse(localStorage.getItem('gastos')) || [];
        this.form = document.getElementById('gastoForm');
        this.listaGastos = document.getElementById('listaGastos');
        this.totalGeneral = document.getElementById('totalGeneral');
        this.totalesPorCategoria = document.getElementById('totalesPorCategoria');
        this.btnLimpiar = document.getElementById('limpiarGastos');
        this.filtroCategoria = document.getElementById('filtroCategoria');
        this.filtroFechaInicio = document.getElementById('filtroFechaInicio');
        this.filtroFechaFin = document.getElementById('filtroFechaFin');
        this.btnExportarCSV = document.getElementById('exportarCSV');
        this.btnExportarPDF = document.getElementById('exportarPDF');
        this.btnToggleTheme = document.getElementById('toggleTheme');

        // Inicializar gráficos
        this.graficoPie = null;
        this.graficoBarras = null;
        this.inicializarGraficos();

        // Inicializar tema
        this.inicializarTema();

        this.inicializarEventListeners();
        this.actualizarUI();
    }

    inicializarTema() {
        const temaGuardado = localStorage.getItem('tema') || 'light';
        document.documentElement.setAttribute('data-theme', temaGuardado);
        this.actualizarIconoTema(temaGuardado);
    }

    actualizarIconoTema(tema) {
        const icono = this.btnToggleTheme.querySelector('.theme-icon');
        icono.textContent = tema === 'light' ? '🌙' : '☀️';
    }

    toggleTema() {
        const temaActual = document.documentElement.getAttribute('data-theme');
        const nuevoTema = temaActual === 'light' ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', nuevoTema);
        localStorage.setItem('tema', nuevoTema);
        this.actualizarIconoTema(nuevoTema);
    }

    inicializarGraficos() {
        // Configuración del gráfico de torta
        const ctxPie = document.getElementById('graficoPie').getContext('2d');
        this.graficoPie = new Chart(ctxPie, {
            type: 'pie',
            data: {
                labels: [],
                datasets: [{
                    data: [],
                    backgroundColor: [
                        '#4CAF50', // Comida
                        '#2196F3', // Transporte
                        '#9C27B0', // Vivienda
                        '#FF9800', // Entretenimiento
                        '#F44336', // Servicios
                        '#607D8B'  // Otros
                    ]
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'bottom'
                    },
                    tooltip: {
                        callbacks: {
                            label: (context) => {
                                const label = context.label || '';
                                const value = context.raw || 0;
                                return `${label}: ${this.formatearGuaranies(value)}`;
                            }
                        }
                    }
                }
            }
        });

        // Configuración del gráfico de barras
        const ctxBarras = document.getElementById('graficoBarras').getContext('2d');
        this.graficoBarras = new Chart(ctxBarras, {
            type: 'bar',
            data: {
                labels: [],
                datasets: [{
                    label: 'Gastos por Mes',
                    data: [],
                    backgroundColor: '#4CAF50'
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: (context) => {
                                const value = context.raw || 0;
                                return this.formatearGuaranies(value);
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: (value) => this.formatearGuaranies(value)
                        }
                    }
                }
            }
        });
    }

    actualizarGraficos() {
        // Actualizar gráfico de torta
        const totalesPorCategoria = this.calcularTotalesPorCategoria();
        this.graficoPie.data.labels = Object.keys(totalesPorCategoria);
        this.graficoPie.data.datasets[0].data = Object.values(totalesPorCategoria);
        this.graficoPie.update();

        // Actualizar gráfico de barras
        const gastosPorMes = this.calcularGastosPorMes();
        this.graficoBarras.data.labels = gastosPorMes.map(item => item.mes);
        this.graficoBarras.data.datasets[0].data = gastosPorMes.map(item => item.total);
        this.graficoBarras.update();
    }

    calcularGastosPorMes() {
        const gastosPorMes = {};
        const meses = [
            'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
            'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
        ];

        this.gastos.forEach(gasto => {
            const fecha = new Date(gasto.fecha);
            const mes = meses[fecha.getMonth()];
            if (!gastosPorMes[mes]) {
                gastosPorMes[mes] = 0;
            }
            gastosPorMes[mes] += gasto.monto;
        });

        return meses.map(mes => ({
            mes,
            total: gastosPorMes[mes] || 0
        }));
    }

    // Función para formatear números a guaraníes
    formatearGuaranies(monto) {
        return new Intl.NumberFormat('es-PY', {
            style: 'currency',
            currency: 'PYG',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(monto);
    }

    inicializarEventListeners() {
        // Evento para agregar gasto
        this.form.addEventListener('submit', (e) => {
            e.preventDefault();
            if (this.validarFormulario()) {
                this.agregarGasto();
            }
        });

        // Evento para limpiar gastos
        this.btnLimpiar.addEventListener('click', () => {
            this.limpiarGastos();
        });

        // Evento para filtrar
        this.filtroCategoria.addEventListener('change', () => this.actualizarUI());
        this.filtroFechaInicio.addEventListener('change', () => this.actualizarUI());
        this.filtroFechaFin.addEventListener('change', () => this.actualizarUI());

        // Evento para exportar
        this.btnExportarCSV.addEventListener('click', () => this.exportarCSV());
        this.btnExportarPDF.addEventListener('click', () => this.exportarPDF());

        // Evento para cambiar tema
        this.btnToggleTheme.addEventListener('click', () => this.toggleTema());
    }

    validarFormulario() {
        const monto = document.getElementById('monto').value;
        const categoria = document.getElementById('categoria').value;
        const descripcion = document.getElementById('descripcion').value;
        const fecha = document.getElementById('fecha').value;

        // Validar monto
        if (monto <= 0) {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'El monto debe ser mayor a 0'
            });
            return false;
        }

        // Validar categoría
        if (!categoria) {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Por favor seleccione una categoría'
            });
            return false;
        }

        // Validar descripción
        if (descripcion.trim().length < 3) {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'La descripción debe tener al menos 3 caracteres'
            });
            return false;
        }

        // Validar fecha
        if (!fecha) {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Por favor seleccione una fecha'
            });
            return false;
        }

        // Validar que la fecha no sea futura
        const fechaSeleccionada = new Date(fecha);
        const hoy = new Date();
        if (fechaSeleccionada > hoy) {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'La fecha no puede ser futura'
            });
            return false;
        }

        return true;
    }

    agregarGasto() {
        const monto = document.getElementById('monto').value;
        const categoria = document.getElementById('categoria').value;
        const descripcion = document.getElementById('descripcion').value;
        const fecha = document.getElementById('fecha').value;

        const gasto = new Gasto(monto, categoria, descripcion, fecha);
        this.gastos.push(gasto);
        this.guardarGastos();
        this.actualizarUI();
        this.form.reset();

        Swal.fire({
            icon: 'success',
            title: '¡Éxito!',
            text: 'Gasto agregado correctamente',
            timer: 1500,
            showConfirmButton: false
        });
    }

    eliminarGasto(id) {
        Swal.fire({
            title: '¿Está seguro?',
            text: "Esta acción no se puede deshacer",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar'
        }).then((result) => {
            if (result.isConfirmed) {
                this.gastos = this.gastos.filter(gasto => gasto.id !== id);
                this.guardarGastos();
                this.actualizarUI();
                Swal.fire(
                    '¡Eliminado!',
                    'El gasto ha sido eliminado.',
                    'success'
                );
            }
        });
    }

    limpiarGastos() {
        Swal.fire({
            title: '¿Está seguro?',
            text: "Se eliminarán todos los gastos. Esta acción no se puede deshacer.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Sí, eliminar todo',
            cancelButtonText: 'Cancelar'
        }).then((result) => {
            if (result.isConfirmed) {
                this.gastos = [];
                this.guardarGastos();
                this.actualizarUI();
                Swal.fire(
                    '¡Eliminado!',
                    'Todos los gastos han sido eliminados.',
                    'success'
                );
            }
        });
    }

    guardarGastos() {
        localStorage.setItem('gastos', JSON.stringify(this.gastos));
    }

    calcularTotalGeneral() {
        return this.gastos.reduce((total, gasto) => total + gasto.monto, 0);
    }

    calcularTotalesPorCategoria() {
        const totales = {};
        this.gastos.forEach(gasto => {
            if (!totales[gasto.categoria]) {
                totales[gasto.categoria] = 0;
            }
            totales[gasto.categoria] += gasto.monto;
        });
        return totales;
    }

    obtenerGastosFiltrados() {
        let gastosFiltrados = this.gastos;

        // Filtrar por categoría
        if (this.filtroCategoria.value) {
            gastosFiltrados = gastosFiltrados.filter(gasto => 
                gasto.categoria === this.filtroCategoria.value
            );
        }

        // Filtrar por fecha
        if (this.filtroFechaInicio.value) {
            const fechaInicio = new Date(this.filtroFechaInicio.value);
            gastosFiltrados = gastosFiltrados.filter(gasto => 
                new Date(gasto.fecha) >= fechaInicio
            );
        }

        if (this.filtroFechaFin.value) {
            const fechaFin = new Date(this.filtroFechaFin.value);
            gastosFiltrados = gastosFiltrados.filter(gasto => 
                new Date(gasto.fecha) <= fechaFin
            );
        }

        return gastosFiltrados;
    }

    exportarCSV() {
        const gastosFiltrados = this.obtenerGastosFiltrados();
        if (gastosFiltrados.length === 0) {
            Swal.fire({
                icon: 'warning',
                title: 'Sin datos',
                text: 'No hay gastos para exportar'
            });
            return;
        }

        // Función para escapar valores CSV
        const escaparCSV = (valor) => {
            if (valor === null || valor === undefined) return '';
            const stringValor = String(valor);
            if (stringValor.includes(',') || stringValor.includes('"') || stringValor.includes('\n')) {
                return `"${stringValor.replace(/"/g, '""')}"`;
            }
            return stringValor;
        };

        const headers = ['Fecha', 'Categoría', 'Descripción', 'Monto'];
        const csvContent = [
            headers.map(escaparCSV).join(','),
            ...gastosFiltrados.map(gasto => [
                escaparCSV(new Date(gasto.fecha).toLocaleDateString()),
                escaparCSV(gasto.categoria),
                escaparCSV(gasto.descripcion),
                escaparCSV(gasto.monto)
            ].join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        saveAs(blob, `gastos_${new Date().toISOString().split('T')[0]}.csv`);
    }

    exportarPDF() {
        const gastosFiltrados = this.obtenerGastosFiltrados();
        if (gastosFiltrados.length === 0) {
            Swal.fire({
                icon: 'warning',
                title: 'Sin datos',
                text: 'No hay gastos para exportar'
            });
            return;
        }

        try {
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();

            // Título
            doc.setFontSize(20);
            doc.text('Reporte de Gastos', 105, 20, { align: 'center' });

            // Fecha de generación
            doc.setFontSize(12);
            doc.text(`Generado el: ${new Date().toLocaleDateString()}`, 105, 30, { align: 'center' });

            // Tabla de gastos
            const headers = [['Fecha', 'Categoría', 'Descripción', 'Monto']];
            const data = gastosFiltrados.map(gasto => [
                new Date(gasto.fecha).toLocaleDateString(),
                gasto.categoria,
                gasto.descripcion,
                this.formatearGuaranies(gasto.monto)
            ]);

            doc.autoTable({
                head: headers,
                body: data,
                startY: 40,
                theme: 'grid',
                styles: {
                    fontSize: 10,
                    cellPadding: 5,
                    overflow: 'linebreak'
                },
                headStyles: {
                    fillColor: [76, 175, 80],
                    textColor: [255, 255, 255],
                    fontStyle: 'bold'
                },
                columnStyles: {
                    0: { cellWidth: 30 },
                    1: { cellWidth: 30 },
                    2: { cellWidth: 80 },
                    3: { cellWidth: 30, halign: 'right' }
                }
            });

            // Total
            const total = gastosFiltrados.reduce((sum, gasto) => sum + gasto.monto, 0);
            doc.setFontSize(12);
            doc.text(`Total: ${this.formatearGuaranies(total)}`, 105, doc.lastAutoTable.finalY + 20, { align: 'center' });

            // Guardar el PDF
            doc.save(`gastos_${new Date().toISOString().split('T')[0]}.pdf`);
        } catch (error) {
            console.error('Error al generar PDF:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Hubo un error al generar el PDF. Por favor, intente nuevamente.'
            });
        }
    }

    actualizarUI() {
        const gastosFiltrados = this.obtenerGastosFiltrados();
        
        // Actualizar lista de gastos
        this.listaGastos.innerHTML = '';
        gastosFiltrados.forEach(gasto => {
            const li = document.createElement('li');
            li.className = `categoria-${gasto.categoria}`;
            li.innerHTML = `
                <div>
                    <strong>${gasto.descripcion}</strong>
                    <br>
                    <small>${gasto.categoria} - ${new Date(gasto.fecha).toLocaleDateString()}</small>
                </div>
                <div>
                    <span>${this.formatearGuaranies(gasto.monto)}</span>
                    <button onclick="gestorGastos.eliminarGasto(${gasto.id})" class="btn-eliminar">×</button>
                </div>
            `;
            this.listaGastos.appendChild(li);
        });

        // Actualizar total general
        const totalGeneral = this.calcularTotalGeneral();
        this.totalGeneral.textContent = this.formatearGuaranies(totalGeneral);

        // Actualizar totales por categoría
        const totalesPorCategoria = this.calcularTotalesPorCategoria();
        this.totalesPorCategoria.innerHTML = '';
        for (const [categoria, total] of Object.entries(totalesPorCategoria)) {
            const div = document.createElement('div');
            div.className = `categoria-${categoria}`;
            div.innerHTML = `<p>${categoria}: ${this.formatearGuaranies(total)}</p>`;
            this.totalesPorCategoria.appendChild(div);
        }

        // Actualizar mensaje si no hay gastos
        if (this.gastos.length === 0) {
            this.listaGastos.innerHTML = '<li class="no-gastos">No hay gastos registrados</li>';
        } else if (gastosFiltrados.length === 0) {
            this.listaGastos.innerHTML = '<li class="no-gastos">No hay gastos que coincidan con los filtros</li>';
        }

        // Actualizar gráficos
        this.actualizarGraficos();
    }
}

// Inicializar la aplicación
const gestorGastos = new GestorGastos(); 