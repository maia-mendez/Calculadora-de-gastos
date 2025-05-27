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
        console.log("Inicializando GestorGastos"); // Debugging
        // Inicializar propiedades
        this.gastos = []; // Se cargará desde localStorage en cargarGastos
        this.form = document.getElementById('gastoForm');
        console.log("Formulario obtenido:", this.form); // Debugging
        this.listaGastos = document.getElementById('listaGastos');
        this.totalGeneralSpan = document.getElementById('totalGeneral');
        this.totalesPorCategoriaDiv = document.getElementById('totalesPorCategoria');
        this.btnLimpiar = document.getElementById('limpiarGastos');
        this.filtroCategoria = document.getElementById('filtroCategoria');
        this.filtroFechaInicio = document.getElementById('filtroFechaInicio');
        this.filtroFechaFin = document.getElementById('filtroFechaFin');
        this.btnExportarCSV = document.getElementById('exportarCSV');
        this.btnExportarPDF = document.getElementById('exportarPDF');
        this.btnToggleTheme = document.getElementById('toggleTheme');
        this.userInfoSpan = document.getElementById('userInfo');
        this.logoutBtn = document.getElementById('logoutBtn');
        this.sueldoInicialInput = document.getElementById('sueldoInicial'); // Nuevo: Input de sueldo inicial
        this.saldoDisponibleSpan = document.getElementById('saldoDisponible'); // Nuevo: Span de saldo disponible
        this.sueldoInicial = 0; // Nuevo: Variable para el sueldo inicial

        // Inicializar gráficos (se crearán instancias en inicializarGraficos)
        this.graficoPie = null;
        this.graficoBarras = null;
        this.inicializarGraficos();

        // Inicializar tema
        this.inicializarTema();

        // Cargar datos y actualizar UI al iniciar
        this.cargarGastos();
        this.cargarSueldoInicial(); // Nuevo: Cargar sueldo inicial
        this.actualizarUI(); // Llama a actualizarSaldoDisponible internamente

        // Mostrar nombre de usuario (asegurarse de que userInfoSpan esté definido)
        const loggedInUsername = localStorage.getItem('username');
        if (this.userInfoSpan && loggedInUsername) {
            this.userInfoSpan.textContent = `Hola, ${loggedInUsername}`;
        }

        this.inicializarEventListeners();
    }

    // Método para cargar gastos de localStorage
    cargarGastos() {
        const gastosGuardados = localStorage.getItem('gastos');
        if (gastosGuardados) {
            this.gastos = JSON.parse(gastosGuardados);
        } else {
            this.gastos = [];
        }
    }

    // Método para guardar gastos en localStorage
    guardarGastos() {
        localStorage.setItem('gastos', JSON.stringify(this.gastos));
    }

    // Método para calcular el total general de gastos
    calcularTotalGeneral() {
        return this.gastos.reduce((total, gasto) => total + gasto.monto, 0);
    }

    // Método para calcular totales por categoría
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

    // Método para calcular gastos por mes (para gráfico de barras)
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

    // Método para cargar sueldo inicial de localStorage
    cargarSueldoInicial() {
        const sueldoGuardado = localStorage.getItem('sueldoInicial');
        if (sueldoGuardado) {
            this.sueldoInicial = parseFloat(sueldoGuardado);
             // Solo actualizar el input si ya existe en el HTML
            if(this.sueldoInicialInput) {
                this.sueldoInicialInput.value = this.sueldoInicial;
            }
        }
    }

    // Método para guardar sueldo inicial en localStorage
    guardarSueldoInicial() {
        localStorage.setItem('sueldoInicial', this.sueldoInicial);
    }

    // Método para calcular el saldo disponible
    calcularSaldoDisponible() {
        const totalGeneral = this.calcularTotalGeneral();
        return this.sueldoInicial - totalGeneral;
    }

    // Método para actualizar el saldo disponible en la UI
    actualizarSaldoDisponible() {
        const saldo = this.calcularSaldoDisponible();
         // Solo actualizar el span si ya existe en el HTML
        if(this.saldoDisponibleSpan) {
             this.saldoDisponibleSpan.textContent = `₲ ${saldo.toFixed(0)}`;

             // Opcional: Cambiar color si el saldo es negativo
             if (saldo < 0) {
                 this.saldoDisponibleSpan.style.color = 'red';
             } else {
                 // Usar el color del tema - Asegúrate de que esta variable CSS esté definida
                 this.saldoDisponibleSpan.style.color = 'var(--text-color)';
             }
        }
    }

    // Método para formatear números a guaraníes
    formatearGuaranies(monto) {
        return new Intl.NumberFormat('es-PY', {
            style: 'currency',
            currency: 'PYG',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(monto);
    }

     // Método para obtener gastos filtrados
     obtenerGastosFiltrados() {
        let gastosFiltrados = this.gastos;

        // Filtrar por categoría
        if (this.filtroCategoria && this.filtroCategoria.value) {
            gastosFiltrados = gastosFiltrados.filter(gasto =>
                gasto.categoria === this.filtroCategoria.value
            );
        }

        // Filtrar por fecha
        if (this.filtroFechaInicio && this.filtroFechaInicio.value) {
            const fechaInicio = new Date(this.filtroFechaInicio.value);
            gastosFiltrados = gastosFiltrados.filter(gasto =>
                new Date(gasto.fecha) >= fechaInicio
            );
        }

        if (this.filtroFechaFin && this.filtroFechaFin.value) {
            const fechaFin = new Date(this.filtroFechaFin.value);
            gastosFiltrados = gastosFiltrados.filter(gasto =>
                new Date(gasto.fecha) <= fechaFin
            );
        }

        return gastosFiltrados;
    }

    // Método para actualizar la interfaz de usuario
    actualizarUI() {
        const gastosFiltrados = this.obtenerGastosFiltrados();

        // Actualizar lista de gastos
        if(this.listaGastos) {
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

            // Actualizar mensaje si no hay gastos
            if (this.gastos.length === 0) {
                this.listaGastos.innerHTML = '<li class="no-gastos">No hay gastos registrados</li>';
            } else if (gastosFiltrados.length === 0) {
                this.listaGastos.innerHTML = '<li class="no-gastos">No hay gastos que coincidan con los filtros</li>';
            }
        }

        // Actualizar total general
        const totalGeneral = this.calcularTotalGeneral();
        if(this.totalGeneralSpan) {
            this.totalGeneralSpan.textContent = this.formatearGuaranies(totalGeneral);
        }

        // Actualizar totales por categoría
        const totalesPorCategoria = this.calcularTotalesPorCategoria();
        if(this.totalesPorCategoriaDiv) {
            this.totalesPorCategoriaDiv.innerHTML = '';
            for (const [categoria, total] of Object.entries(totalesPorCategoria)) {
                const div = document.createElement('div');
                div.className = `categoria-${categoria}`;
                div.innerHTML = `<p>${categoria}: ${this.formatearGuaranies(total)}</p>`;
                this.totalesPorCategoriaDiv.appendChild(div);
            }
        }

        // Actualizar gráficos
        this.actualizarGraficos();

        // Actualizar saldo disponible
        this.actualizarSaldoDisponible(); // Nuevo: Llamar a actualizarSaldoDisponible aquí
    }

    // Método para inicializar event listeners
    inicializarEventListeners() {
        console.log("Inicializando Event Listeners"); // Debugging - Inicio listeners
        // Evento para agregar gasto
        if(this.form) {
             console.log("Formulario 'gastoForm' encontrado. Añadiendo listener.", this.form); // Debugging - Form encontrado
            this.form.addEventListener('submit', (e) => {
                console.log("Evento 'submit' del formulario disparado."); // Debugging - Submit disparado
                e.preventDefault();
                 console.log("e.preventDefault() ejecutado."); // Debugging - preventDefault
                // Antes de validar el formulario, validar que haya saldo suficiente
                const montoGasto = parseFloat(document.getElementById('monto').value);
                 const saldoActual = this.calcularSaldoDisponible();

                 if (montoGasto > saldoActual) {
                      Swal.fire({
                         icon: 'warning',
                         title: 'Saldo Insuficiente',
                         text: 'No tienes suficiente sueldo disponible para este gasto.'
                      });
                      return; // Detener el proceso de agregar gasto
                 }

                if (this.validarFormulario()) {
                    console.log("validarFormulario() retornó true. Llamando a agregarGasto()."); // Debugging - Validación OK
                    this.agregarGasto();
                } else {
                     console.log("validarFormulario() retornó false."); // Debugging - Validación Fallida
                }
            });
        }

        // Evento para limpiar gastos
        if(this.btnLimpiar) {
            this.btnLimpiar.addEventListener('click', () => {
                this.limpiarGastos();
            });
        }

        // Evento para filtrar
        if(this.filtroCategoria) this.filtroCategoria.addEventListener('change', () => this.actualizarUI());
        if(this.filtroFechaInicio) this.filtroFechaInicio.addEventListener('change', () => this.actualizarUI());
        if(this.filtroFechaFin) this.filtroFechaFin.addEventListener('change', () => this.actualizarUI());

        // Evento para exportar
        if(this.btnExportarCSV) this.btnExportarCSV.addEventListener('click', () => this.exportarCSV());
        if(this.btnExportarPDF) this.btnExportarPDF.addEventListener('click', () => this.exportarPDF());

        // Evento para cambiar tema
        if(this.btnToggleTheme) this.btnToggleTheme.addEventListener('click', () => this.toggleTema());

        // Escuchar cambios en el input de sueldo inicial para guardar y actualizar saldo inmediatamente
        if(this.sueldoInicialInput) {
            this.sueldoInicialInput.addEventListener('input', () => {
                this.sueldoInicial = parseFloat(this.sueldoInicialInput.value) || 0; // Actualizar la variable y manejar NaN
                this.guardarSueldoInicial(); // Guardar inmediatamente
                this.actualizarSaldoDisponible(); // Actualizar saldo disponible en UI
            });
        }

        // Listener para el botón de logout
        if(this.logoutBtn) {
             this.logoutBtn.addEventListener('click', () => {
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
                        // Opcional: Limpiar sueldo inicial al limpiar gastos
                        // this.sueldoInicial = 0;
                        // if(this.sueldoInicialInput) this.sueldoInicialInput.value = 0;
                        // this.guardarSueldoInicial();
                        window.location.href = 'login.html';
                    }
                });
            });
        }
    }

     // Método para validar formulario
     validarFormulario() {
        console.log("Dentro de validarFormulario()"); // Debugging - Inicio validación
        const monto = document.getElementById('monto').value;
        const categoria = document.getElementById('categoria').value;
        const descripcion = document.getElementById('descripcion').value;
        const fecha = document.getElementById('fecha').value;

        console.log(`Validando: Monto=${monto}, Categoria=${categoria}, Descripcion=${descripcion}, Fecha=${fecha}`); // Debugging - Valores

        // Validar monto
        if (monto <= 0) {
             console.log("Validación falló: Monto <= 0"); // Debugging
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

    // Método para agregar gasto
    agregarGasto() {
         console.log("Dentro de agregarGasto()"); // Debugging - Inicio de agregarGasto
        const monto = document.getElementById('monto').value;
        const categoria = document.getElementById('categoria').value;
        const descripcion = document.getElementById('descripcion').value;
        const fecha = document.getElementById('fecha').value;
        // La validación de saldo ahora se hace en el submit listener

        const gasto = new Gasto(monto, categoria, descripcion, fecha);
        console.log("Gasto creado:", gasto); // Debugging - Gasto creado
        this.gastos.push(gasto);
        console.log("Gasto añadido al array:", this.gastos); // Debugging - Array actualizado
        this.guardarGastos();
        console.log("Gastos guardados en localStorage"); // Debugging - Guardado
        this.actualizarUI(); // Esto llamará a actualizarSaldoDisponible
        console.log("Llamando a actualizarUI después de agregar gasto"); // Debugging - Llamada a UI
        this.form.reset();
        console.log("Formulario reseteado"); // Debugging - Formulario reseteado

        Swal.fire({
            icon: 'success',
            title: '¡Éxito!',
            text: 'Gasto registrado con éxito',
            timer: 1500,
            showConfirmButton: false
        });
        console.log("Swal.fire (éxito) debería haberse mostrado"); // Debugging - Swal llamado
    }

     // Método para eliminar gasto
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
                this.actualizarUI(); // Esto llamará a actualizarSaldoDisponible
                Swal.fire(
                    '¡Eliminado!',
                    'El gasto ha sido eliminado.',
                    'success'
                );
            }
        });
    }

     // Método para limpiar todos los gastos
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
                // Opcional: Limpiar sueldo inicial al limpiar gastos
                // this.sueldoInicial = 0;
                // if(this.sueldoInicialInput) this.sueldoInicialInput.value = 0;
                // this.guardarSueldoInicial();

                this.actualizarUI(); // Esto llamará a actualizarSaldoDisponible
                Swal.fire(
                    '¡Borrado!',
                    'Todos los gastos han sido eliminados.',
                    'success'
                );
            }
        });
    }

    // Método para inicializar gráficos
    inicializarGraficos() {
        // Configuración del gráfico de torta
        const ctxPie = document.getElementById('graficoPie');
        if(ctxPie) {
            const contextPie = ctxPie.getContext('2d');
            this.graficoPie = new Chart(contextPie, {
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
        }

        // Configuración del gráfico de barras
        const ctxBarras = document.getElementById('graficoBarras');
         if(ctxBarras) {
            const contextBarras = ctxBarras.getContext('2d');
            this.graficoBarras = new Chart(contextBarras, {
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
    }

     // Método para actualizar gráficos
    actualizarGraficos() {
        if(this.graficoPie) {
            const totalesPorCategoria = this.calcularTotalesPorCategoria();
            this.graficoPie.data.labels = Object.keys(totalesPorCategoria);
            this.graficoPie.data.datasets[0].data = Object.values(totalesPorCategoria);
            this.graficoPie.update();
        }

        if(this.graficoBarras) {
            const gastosPorMes = this.calcularGastosPorMes();
            this.graficoBarras.data.labels = gastosPorMes.map(item => item.mes);
            this.graficoBarras.data.datasets[0].data = gastosPorMes.map(item => item.total);
            this.graficoBarras.update();
        }
    }

     // Método para inicializar tema
    inicializarTema() {
        const temaGuardado = localStorage.getItem('tema') || 'light';
        document.documentElement.setAttribute('data-theme', temaGuardado);
        this.actualizarIconoTema(temaGuardado);
    }

    // Método para actualizar icono del tema
    actualizarIconoTema(tema) {
         // Asegurarse de que btnToggleTheme y su hijo con la clase theme-icon existan
        if (this.btnToggleTheme) {
            const icono = this.btnToggleTheme.querySelector('.theme-icon');
            if (icono) {
                 // Usar innerHTML para los íconos de Font Awesome
                icono.innerHTML = tema === 'light' ? '<i class="fas fa-moon"></i>' : '<i class="fas fa-sun"></i>';
            }
        }
    }

    // Método para cambiar tema
    toggleTema() {
        const temaActual = document.documentElement.getAttribute('data-theme');
        const nuevoTema = temaActual === 'light' ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', nuevoTema);
        localStorage.setItem('tema', nuevoTema);
        this.actualizarIconoTema(nuevoTema);
    }

    // Método para exportar gastos a CSV
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

        const headers = ['Fecha', 'Categoría', 'Descripción', 'Importe'];
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

    // Método para exportar gastos a PDF
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
            const headers = [['Fecha', 'Categoría', 'Descripción', 'Importe']];
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
}

// Inicializar la aplicación solo cuando el DOM esté completamente cargado
document.addEventListener('DOMContentLoaded', () => {
    // Verificación de autenticación - Esto debe estar fuera de la clase si quieres que redirija antes
    if (localStorage.getItem('isAuthenticated') !== 'true') {
        // Solo redirigir si no estamos ya en la página de login
        if (!window.location.href.includes('login.html') && !window.location.href.includes('register.html') && !window.location.href.includes('reset-password.html')) {
             Swal.fire({
                icon: 'warning',
                title: 'Acceso denegado',
                text: 'Debes iniciar sesión para acceder a esta página',
                showConfirmButton: true
            }).then(() => {
                window.location.href = 'login.html';
            });
        }
    } else {
        // Si el usuario está autenticado, inicializar la aplicación GestorGastos solo en index.html
        if (window.location.href.includes('index.html')) {
             const gestorGastos = new GestorGastos();
        }
         // Si está autenticado pero en login/register, redirigir a index.html
         if (window.location.href.includes('login.html') || window.location.href.includes('register.html') || window.location.href.includes('reset-password.html')) {
              window.location.href = 'index.html';
         }
    }

    // Si no está autenticado y está en login/register/reset-password, no hacer nada (dejar que se muestren esas páginas)
    // Si no está autenticado y NO está en login/register/reset-password (ej: index.html directamente), la primera verificación lo redirigirá.

    // La inicialización de GestorGastos ahora está condicionada a estar autenticado y en index.html
});

// Código relacionado con login.js y register.js (deberían estar en sus propios archivos)
// Asegúrate de que los scripts de login.js y register.js estén incluidos en sus respectivos HTML
// La lógica de autenticación (login.js) y registro (register.js) no debe estar aquí. 