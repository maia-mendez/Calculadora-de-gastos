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
    constructor(monto, categoria, fecha) {
        this.monto = parseFloat(monto);
        this.categoria = categoria;
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
        this.sueldoInicialInput = document.getElementById('sueldoInicial');
        this.saldoDisponibleSpan = document.getElementById('saldoDisponible');
        this.sueldoInicial = 0;

        // Inicializar el selector personalizado
        this.inicializarSelectorPersonalizado();

        // Inicializar gráficos
        this.graficoPie = null;
        this.graficoBarras = null;
        this.inicializarGraficos();

        // Inicializar tema
        this.inicializarTema();

        // Cargar datos y actualizar UI al iniciar
        this.cargarGastos();
        this.cargarSueldoInicial();
        this.actualizarUI();

        // Mostrar nombre de usuario
        const loggedInUsername = localStorage.getItem('username');
        if (this.userInfoSpan && loggedInUsername) {
            this.userInfoSpan.textContent = `Hola, ${loggedInUsername}`;
        }

        this.inicializarEventListeners();
    }

    // Método para inicializar el selector personalizado
    inicializarSelectorPersonalizado() {
        const selectSelected = document.getElementById('selectSelected');
        const selectItems = document.getElementById('selectItems');
        const categoriaInput = document.getElementById('categoria');
        let isOpen = false;

        // Función para cerrar el selector
        const cerrarSelector = () => {
            selectItems.classList.add('select-hide');
            isOpen = false;
        };

        // Función para abrir el selector
        const abrirSelector = () => {
            selectItems.classList.remove('select-hide');
            isOpen = true;
        };

        // Click en el selector
        selectSelected.addEventListener('click', (e) => {
            e.stopPropagation();
            if (isOpen) {
                cerrarSelector();
            } else {
                abrirSelector();
            }
        });

        // Click en las categorías
        document.querySelectorAll('.category-header').forEach(header => {
            header.addEventListener('click', (e) => {
                e.stopPropagation();
                const category = header.parentElement;
                const subcategories = category.querySelector('.subcategories');
                const icon = header.querySelector('i');

                // Cerrar otras categorías
                document.querySelectorAll('.subcategories').forEach(sub => {
                    if (sub !== subcategories) {
                        sub.classList.remove('show');
                        sub.parentElement.querySelector('.category-header').classList.remove('active');
                    }
                });

                // Toggle la categoría actual
                subcategories.classList.toggle('show');
                header.classList.toggle('active');
            });
        });

        // Click en los items
        document.querySelectorAll('.select-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.stopPropagation();
                const value = item.getAttribute('data-value');
                const text = item.textContent;
                
                // Actualizar el input oculto y el texto mostrado
                categoriaInput.value = value;
                selectSelected.textContent = text;
                
                // Cerrar el selector
                cerrarSelector();
            });
        });

        // Click fuera del selector
        document.addEventListener('click', (e) => {
            if (!selectItems.contains(e.target) && e.target !== selectSelected) {
                cerrarSelector();
            }
        });
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
            // Obtener la categoría principal (antes del guión)
            const categoriaPrincipal = gasto.categoria.split('-')[0];
            if (!totales[categoriaPrincipal]) {
                totales[categoriaPrincipal] = 0;
            }
            totales[categoriaPrincipal] += gasto.monto;
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
             // Formatear el saldo a guaraníes antes de mostrarlo
             this.saldoDisponibleSpan.textContent = this.formatearGuaranies(saldo);

             // Opcional: Cambiar color si el saldo es negativo
             if (saldo < 0) {
                 this.saldoDisponibleSpan.style.color = 'red';
             } else {
                 // Usar el color del tema - Asegúrate de que esta variable CSS esté definida
                 this.saldoDisponibleSpan.style.color = 'var(--text-color)';
             }
        }

        // Actualizar el Balance del Mes
        const totalGeneral = this.calcularTotalGeneral();
        const balance = this.sueldoInicial - totalGeneral;
        const balanceMesSpan = document.getElementById('balanceMes');
         if (balanceMesSpan) {
             balanceMesSpan.textContent = this.formatearGuaranies(balance);
             // Opcional: Cambiar color del balance del mes si es negativo
             if (balance < 0) {
                 balanceMesSpan.style.color = 'red';
             } else {
                  balanceMesSpan.style.color = 'var(--text-color)';
             }
         }

         // Actualizar barras de balance por categoría
         this.actualizarBalancePorCategoria();
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
                        <strong>${gasto.categoria}</strong>
                        <br>
                        <small>${new Date(gasto.fecha).toLocaleDateString()}</small>
                    </div>
                    <div>
                        <span>${this.formatearGuaranies(gasto.monto)}</span>
                        <button class="btn-eliminar" data-id="${gasto.id}">×</button>
                    </div>
                `;
                this.listaGastos.appendChild(li);
            });

            // Agregar event listeners a los botones de eliminar
            this.listaGastos.querySelectorAll('.btn-eliminar').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const id = parseInt(e.target.dataset.id);
                    this.eliminarGasto(id);
                });
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

                // Validar si el formulario es válido ANTES de crear el gasto
                if (!this.validarFormulario()) {
                     return; // Si la validación falla, detener
                }

                // Antes de agregar el gasto, validar si hay saldo suficiente (usando el valor numérico limpio del gasto)
                 const montoInput = document.getElementById('monto');
                 const montoValue = montoInput.value.replace(/\D/g, ''); // Limpiar antes de validar
                 const montoNumerico = parseFloat(montoValue) || 0; // Usar 0 si no es un número válido

                 const saldoActual = this.calcularSaldoDisponible();

                 if (montoNumerico > saldoActual) {
                      Swal.fire({
                         icon: 'warning',
                         title: 'Saldo Insuficiente',
                         text: 'No tienes suficiente sueldo disponible para este gasto.'
                      });
                      return; // Detener el proceso de agregar gasto
                 }

            this.agregarGasto(montoNumerico); // Pasar el valor numérico limpio

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
        // Restaurado a lógica simple sin formateo
        if(this.sueldoInicialInput) {
            this.sueldoInicialInput.addEventListener('input', () => {
                this.sueldoInicial = parseFloat(this.sueldoInicialInput.value) || 0; // Actualizar la variable y manejar NaN
                this.guardarSueldoInicial(); // Guardar inmediatamente
                this.actualizarSaldoDisponible(); // Actualizar saldo disponible en UI
            });

             // Formatear el valor inicial al cargar la página si ya tiene un valor
             // Ya no es necesario formatear al cargar, solo asegurar que el input muestre el número guardado
              if (localStorage.getItem('sueldoInicial')) {
                  const sueldoGuardado = parseFloat(localStorage.getItem('sueldoInicial'));
                  if (!isNaN(sueldoGuardado)) {
                      this.sueldoInicialInput.value = sueldoGuardado;
                  }
              }
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
                        window.location.href = 'login.html';
                    }
                });
            });
        }
    }

     // Método para validar formulario
    validarFormulario() {
        console.log("Dentro de validarFormulario()"); // Debugging - Inicio validación
        const montoInput = document.getElementById('monto');
        // Permitir dígitos y un punto decimal al limpiar el valor
        const montoValue = montoInput.value.replace(/[^0-9.]/g, '');
        const montoNumerico = parseFloat(montoValue) || 0;

        const categoria = document.getElementById('categoria').value;
        const fecha = document.getElementById('fecha').value;

        console.log(`Validando: Monto=${montoNumerico}, Categoria=${categoria}, Fecha=${fecha}`); // Debugging - Valores

        // Validar monto
        if (montoNumerico <= 0) { // Usar el valor numérico
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
        hoy.setHours(0, 0, 0, 0); // Comparar solo la fecha, ignorando la hora
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
    agregarGasto(montoNumerico) { // Recibe el valor numérico limpio
         console.log("Dentro de agregarGasto()"); // Debugging - Inicio de agregarGasto
        // const montoInput = document.getElementById('monto'); // Ya no necesario aquí
        const categoria = document.getElementById('categoria').value;
        const fecha = document.getElementById('fecha').value;

        // El valor numérico del monto ya viene limpio como argumento desde el listener del submit

        // Crear el objeto Gasto con el valor numérico correcto del monto
        const gasto = new Gasto(montoNumerico, categoria, fecha);
        console.log("Gasto creado:", gasto);
        this.gastos.push(gasto);
        console.log("Gasto añadido al array:", this.gastos);
        this.guardarGastos();
        console.log("Gastos guardados en localStorage");
        this.actualizarUI(); // Esto llamará a actualizarSaldoDisponible y gráficos
        console.log("Llamando a actualizarUI después de agregar gasto");
        this.form.reset();
         // Resetear el selector personalizado visible
         const selectSelected = document.getElementById('selectSelected');
         if (selectSelected) {
             selectSelected.textContent = 'Seleccione una categoría';
             const categoriaInput = document.getElementById('categoria');
              if (categoriaInput) {
                  categoriaInput.value = '';
              }
         }

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

                // Limpiar sueldo inicial y formulario
                this.sueldoInicial = 0;
                if(this.sueldoInicialInput) {
                    this.sueldoInicialInput.value = ''; // Limpiar el campo de texto visible
                }
                this.guardarSueldoInicial(); // Guardar sueldo inicial reseteado (0)

                if(this.form) {
                    this.form.reset(); // Resetear formulario
                     // Adicional: Resetear el selector personalizado visible
                     const selectSelected = document.getElementById('selectSelected');
                     if (selectSelected) {
                         selectSelected.textContent = 'Seleccione una categoría';
                         // Limpiar el valor del input oculto
                         const categoriaInput = document.getElementById('categoria');
                         if (categoriaInput) {
                             categoriaInput.value = '';
                         }
                     }
                }

                this.actualizarUI(); // Esto llamará a actualizarSaldoDisponible y gráficos
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
                            '#3B82F6', // Azul claro
                            '#2563EB', // Azul medio
                            '#1E40AF', // Azul oscuro
                            '#60A5FA', // Azul más claro (opcional, para más categorías)
                            '#17328C', // Azul más oscuro (opcional)
                            '#93C5FD'  // Otro tono de azul (opcional)
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
                        backgroundColor: '#3B82F6' // Usar azul claro para las barras
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

        const headers = ['Fecha', 'Categoría', 'Gasto'];
        const csvContent = [
            headers.map(escaparCSV).join(','),
            ...gastosFiltrados.map(gasto => [
                escaparCSV(new Date(gasto.fecha).toLocaleDateString()),
                escaparCSV(gasto.categoria),
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
            const headers = [['Fecha', 'Categoría', 'Gasto']];
            const data = gastosFiltrados.map(gasto => [
                new Date(gasto.fecha).toLocaleDateString(),
                gasto.categoria,
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
                    1: { cellWidth: 50 },
                    2: { cellWidth: 30, halign: 'right' }
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

    // Nuevo método para actualizar el balance por categoría con barras
    actualizarBalancePorCategoria() {
        const balancePorCategoriaDiv = document.getElementById('balancePorCategoria');
        if (!balancePorCategoriaDiv) return; // Salir si el contenedor no existe

        balancePorCategoriaDiv.innerHTML = ''; // Limpiar contenido anterior

        const totalesPorCategoria = this.calcularTotalesPorCategoria();
        const totalGeneral = this.calcularTotalGeneral();

        // Si no hay gastos, mostrar un mensaje
        if (totalGeneral === 0) {
             balancePorCategoriaDiv.innerHTML = '<p class="no-gastos">No hay gastos registrados para mostrar balance por categoría.</p>';
            return;
        }

        // Obtener la lista de categorías principales en orden deseado (opcional)
        const orderedCategories = ['vivienda', 'educacion', 'transporte', 'personal']; // Definir un orden si se desea
        const categories = Object.keys(totalesPorCategoria).sort((a, b) => {
             const indexA = orderedCategories.indexOf(a);
             const indexB = orderedCategories.indexOf(b);
             if (indexA === -1 && indexB === -1) return 0; // Si ambas no están en la lista, mantener orden natural
             if (indexA === -1) return 1; // Si A no está en la lista, B va primero
             if (indexB === -1) return -1; // Si B no está en la lista, A va primero
             return indexA - indexB; // Ordenar según la lista definida
         });

        categories.forEach(categoria => {
            const total = totalesPorCategoria[categoria];
            const porcentaje = (total / totalGeneral) * 100;

            const itemDiv = document.createElement('div');
            itemDiv.classList.add('balance-category-item');

            itemDiv.innerHTML = `
                <strong>${categoria.charAt(0).toUpperCase() + categoria.slice(1)}: ${this.formatearGuaranies(total)} (${porcentaje.toFixed(1)}%)</strong>
                <div class="balance-bar-container">
                    <div class="balance-bar" style="width: ${porcentaje}%;"></div>
                </div>
            `;
            balancePorCategoriaDiv.appendChild(itemDiv);
        });
    }
}

// Crear una instancia global de GestorGastos
let gestorGastos;

// Esperar a que el DOM esté cargado
document.addEventListener('DOMContentLoaded', () => {
    gestorGastos = new GestorGastos();

    // Inicializar funcionalidad de acordeón para las FAQs
    const faqQuestions = document.querySelectorAll('.faq-question');

    faqQuestions.forEach(question => {
        question.addEventListener('click', () => {
            const answer = question.nextElementSibling; // La respuesta es el siguiente hermano

            // Cerrar otras respuestas al abrir una nueva
            faqQuestions.forEach(otherQuestion => {
                if (otherQuestion !== question) {
                    otherQuestion.classList.remove('active');
                    const otherAnswer = otherQuestion.nextElementSibling;
                    if (otherAnswer) {
                       otherAnswer.classList.remove('show');
                    }
                }
            });

            // Toggle la respuesta actual
            question.classList.toggle('active');
            if (answer) {
                answer.classList.toggle('show');
            }
        });
    });
});

// Código relacionado con login.js y register.js (deberían estar en sus propios archivos)
// Asegúrate de que los scripts de login.js y register.js estén incluidos en sus respectivos HTML
// La lógica de autenticación (login.js) y registro (register.js) no debe estar aquí. 