let materiasData = {};
let materiaHandlers = {};

// DOM Elements
const materiaSelect = document.getElementById('materiaSelect');
const dynamicInputsDiv = document.getElementById('dynamicInputs');
const form = document.getElementById('simuladorForm');
const resultadoDiv = document.getElementById('resultado');
const condicionFinalP = document.getElementById('condicionFinal');
const descripcionCondicionP = document.getElementById('descripcionCondicion');
const submitButton = form.querySelector('button[type="submit"]');
const iconPlaceholder = document.querySelector('.icon-placeholder');

// Cargar handlers de materias
async function cargarHandlers() {
    const scripts = [
        'materias/base-materia.js',
        'materias/elementosprog-2025.js',
        'materias/introdatos2025.js',
        'materias/calculo1-2025.js',
        'materias/introalgebra-2025.js',
        'materias/ctys-2025.js',
        'materias/algebramatricial-2025.js',
        'materias/default-materia.js'
    ];

    for (const script of scripts) {
        try {
            await loadScript(script);
        } catch (error) {
            console.error(`Error cargando ${script}:`, error);
        }
    }

    // Registrar handlers
    materiaHandlers = {
        'elementosprog-2025': ElementosProg2025,
        'calculo1-2025': Calculo12025,
        'introalgebra-2025': IntroAlgebra2025,
        'ctys-2025': CtyS2025,
        'algebramatricial-2025': AlgebraMatricial2025,
        'introdatos-2025': IntroDatos2025,
        'default': DefaultMateria
    };
}

// Helper para cargar scripts dinámicamente
function loadScript(src) {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = src;
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
    });
}

// Función para poblar el select de materias
function populateMateriaSelect() {
    materiaSelect.innerHTML = '<option value="">Selecciona una materia</option>';

    for (const [key, materia] of Object.entries(materiasData)) {
        const option = document.createElement('option');
        option.value = key;
        option.textContent = materia.nombre;
        materiaSelect.appendChild(option);
    }
}

// Función para generar inputs dinámicos
function generateInputs(selectedMateriaKey) {
    dynamicInputsDiv.innerHTML = '';

    if (!selectedMateriaKey || !materiasData[selectedMateriaKey]) {
        const infoDiv = document.createElement('div');
        infoDiv.className = 'info-message';
        infoDiv.textContent = 'Selecciona una materia para ver los campos disponibles.';
        dynamicInputsDiv.appendChild(infoDiv);
        return;
    }

    const materia = materiasData[selectedMateriaKey];

    // Casos especiales - materias que generan sus propios inputs
    if (selectedMateriaKey === 'ctys-2025') {
        CtyS2025.generateInputs(dynamicInputsDiv);
        return;
    }

    // Lógica general para otras materias
    // Generar inputs para asistencia si es necesario
    if (materia.asistencia) {
        const formGroup = document.createElement('div');
        formGroup.className = 'form-group';

        const label = document.createElement('label');
        label.setAttribute('for', 'asistencia');
        label.textContent = 'Asistencia (%):';

        const input = document.createElement('input');
        input.type = 'number';
        input.id = 'asistencia';
        input.name = 'asistencia';
        input.min = '0';
        input.max = '100';
        input.step = '0.1';
        input.placeholder = '0-100';

        formGroup.appendChild(label);
        formGroup.appendChild(input);
        dynamicInputsDiv.appendChild(formGroup);
    }

    // Generar inputs para parciales
    if (materia.parciales > 0) {
        for (let i = 1; i <= materia.parciales; i++) {
            const formGroup = document.createElement('div');
            formGroup.className = 'form-group';

            const label = document.createElement('label');
            label.setAttribute('for', `parcial${i}`);

            // Usar nombres personalizados si existen
            if (materia.nombresParciales && materia.nombresParciales[i - 1]) {
                label.textContent = `${materia.nombresParciales[i - 1]}:`;
            } else {
                label.textContent = `Parcial ${i}:`;
            }

            const input = document.createElement('input');
            input.type = 'number';
            input.id = `parcial${i}`;
            input.name = `parcial${i}`;

            // Configurar rangos específicos para algunas materias
            if (selectedMateriaKey === 'introalgebra-2025') {
                if (i % 2 !== 0) { // Impar - Individual
                    input.min = '0';
                    input.max = '10';
                    input.step = '0.1';
                    input.placeholder = '0-10';
                } else { // Par - Grupal
                    input.min = '0';
                    input.max = '80';
                    input.step = '0.1';
                    input.placeholder = '0-80';
                }
            } else {
                input.min = '0';
                input.max = '100';
                input.step = '0.1';
                input.placeholder = '0-100';
            }

            formGroup.appendChild(label);
            formGroup.appendChild(input);
            dynamicInputsDiv.appendChild(formGroup);
        }
    }

    // Generar inputs para TPs
    if (materia.tps > 0) {
        if (materia.nombresTps) {
            // TPs individuales con nombres específicos
            for (let i = 1; i <= materia.tps; i++) {
                const formGroup = document.createElement('div');
                formGroup.className = 'form-group';

                const label = document.createElement('label');
                label.setAttribute('for', `tp${i}`);
                label.textContent = `${materia.nombresTps[i - 1]}:`;

                const input = document.createElement('input');
                input.type = 'number';
                input.id = `tp${i}`;
                input.name = `tp${i}`;
                input.min = '0';
                input.max = '100';
                input.step = '0.1';
                input.placeholder = '0-100';

                formGroup.appendChild(label);
                formGroup.appendChild(input);
                dynamicInputsDiv.appendChild(formGroup);
            }
        } else {
            // Contador de TPs aprobados
            const formGroup = document.createElement('div');
            formGroup.className = 'form-group';

            const label = document.createElement('label');
            label.setAttribute('for', 'tpsAprobados');
            label.textContent = `TPs Aprobados (de ${materia.tps}):`;

            const input = document.createElement('input');
            input.type = 'number';
            input.id = 'tpsAprobados';
            input.name = 'tpsAprobados';
            input.min = '0';
            input.max = materia.tps.toString();
            input.step = '1';
            input.placeholder = `0-${materia.tps}`;

            formGroup.appendChild(label);
            formGroup.appendChild(input);
            dynamicInputsDiv.appendChild(formGroup);
        }
    }
}

// Función para calcular condición (refactorizada)
function calcularCondicion(event) {
    event.preventDefault();

    const selectedMateriaKey = materiaSelect.value;
    if (!selectedMateriaKey) return;

    const materia = materiasData[selectedMateriaKey];
    const formData = new FormData(form);

    // Helper function para obtener nota
    const getNota = (name, minVal = 0, maxVal = 100) => {
        const notaStr = formData.get(name);
        if (notaStr === null || notaStr.trim() === '') return NaN;

        const nota = parseFloat(notaStr);
        if (isNaN(nota) || nota < minVal || nota > maxVal) {
            const labelElement = document.querySelector(`label[for="${name}"]`);
            const displayName = labelElement ? labelElement.textContent.replace(':', '') : name;
            alert(`La nota para "${displayName}" debe ser un número entre ${minVal} y ${maxVal}.`);
            return NaN;
        }
        return nota;
    };

    // Helper function para mostrar resultados
    const displayResult = (condicion, descripcion, cssClass, icon) => {
        condicionFinalP.textContent = condicion;
        descripcionCondicionP.innerHTML = descripcion;
        condicionFinalP.className = cssClass;
        iconPlaceholder.textContent = icon;
        iconPlaceholder.classList.add('updated');
        setTimeout(() => iconPlaceholder.classList.remove('updated'), 300);
    };

    // Obtener el handler apropiado
    const HandlerClass = materiaHandlers[selectedMateriaKey] || materiaHandlers['default'];
    const handler = new HandlerClass(selectedMateriaKey, materia, formData, displayResult, getNota);

    // Ejecutar cálculo
    try {
        handler.calcular();
    } catch (error) {
        console.error('Error en cálculo:', error);
        displayResult("Error", "Error en el cálculo. Verifica los datos ingresados.", "error", "⚠️");
    }
}

// Función para configurar el toggle de tema
function setupThemeToggle() {
    const themeToggle = document.getElementById('themeToggle');
    const body = document.body;

    // Verificar preferencia guardada
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
        body.classList.toggle('dark-theme', savedTheme === 'dark');
        themeToggle.textContent = savedTheme === 'dark' ? '☀️' : '🌙';
    }

    // Event listener para toggle
    themeToggle.addEventListener('click', () => {
        body.classList.toggle('dark-theme');
        const isDark = body.classList.contains('dark-theme');

        themeToggle.textContent = isDark ? '☀️' : '🌙';
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
    });
}

// Inicialización
async function initializeSimulator() {
    try {
        // Cargar handlers primero
        await cargarHandlers();

        // Luego cargar datos de materias
        const response = await fetch('materias.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        materiasData = await response.json();

        populateMateriaSelect();
        generateInputs(null);

        materiaSelect.addEventListener('change', (e) => generateInputs(e.target.value));
        form.addEventListener('submit', calcularCondicion);
        setupThemeToggle();

        // Inicializar Calendario
        initializeCalendar();

    } catch (error) {
        console.error('Error initializing simulator:', error);
        materiaSelect.innerHTML = '<option value="">Error al cargar materias</option>';
        condicionFinalP.textContent = 'No se pudieron cargar los datos de las materias.';
        submitButton.disabled = true;
        submitButton.textContent = 'Error';
        iconPlaceholder.textContent = '⚠️';
    }
}

initializeSimulator();
// Función para inicializar el calendario
function initializeCalendar() {
    const calendarEl = document.getElementById('calendar');
    const calendarMessage = document.getElementById('calendar-message');

    if (!calendarEl) return;

    const calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth',
        locale: 'es',
        timeZone: 'America/Argentina/Buenos_Aires',
        headerToolbar: {
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,listMonth'
        },
        buttonText: {
            today: 'Hoy',
            month: 'Mes',
            list: 'Lista'
        },
        events: function (info, successCallback, failureCallback) {
            const GOOGLE_SHEET_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQHniUNfOA8JTrnlzovWRIoD_VFprq9UL10Yhbqx4eSuf_fwiO5RFORoL8kluvUPLwNJpZZWnsb_1ri/pub?gid=0&single=true&output=csv';

            Papa.parse(GOOGLE_SHEET_URL, {
                download: true,
                header: true,
                skipEmptyLines: true,
                complete: function (results) {
                    console.log('Datos cargados:', results.data);

                    const completedActivities = getCompletedActivities();

                    const events = results.data
                        .filter(row => row.title && row.start)
                        .map(row => {
                            const start = row.start ? row.start.trim() : null;
                            const end = row.end ? row.end.trim() : null;
                            const materia = row.Materia ? row.Materia.trim() : '';
                            const title = row.title.trim();

                            const eventId = `${materia}-${title}-${start}`;
                            const isCompleted = completedActivities[eventId] === true;

                            return {
                                id: eventId,
                                title: materia ? `${materia}: ${title}` : title,
                                start: start,
                                end: end || null,
                                color: row.color ? row.color.trim() : null,
                                allDay: !start.includes('T'),
                                classNames: isCompleted ? ['completed'] : [],
                                extendedProps: {
                                    materia: materia,
                                    originalTitle: title,
                                    completed: isCompleted
                                }
                            };
                        });

                    console.log('Eventos procesados:', events);

                    if (events.length === 0) {
                        calendarMessage.style.display = 'block';
                    } else {
                        calendarMessage.style.display = 'none';
                    }

                    successCallback(events);
                },
                error: function (error) {
                    console.error('Error cargando desde Google Sheets:', error);
                    failureCallback(error);
                    calendarMessage.textContent = 'Error al cargar las actividades.';
                    calendarMessage.style.display = 'block';
                    calendarMessage.style.color = 'var(--libre-color)';
                }
            });
        },
        eventDidMount: function (info) {
            const materia = info.event.extendedProps.materia || '';
            const title = info.event.extendedProps.originalTitle || info.event.title;
            info.el.title = materia ? `${materia}\n${title}` : title;
        },
        eventClick: function (info) {
            info.jsEvent.preventDefault();

            const materia = info.event.extendedProps.materia || 'Sin materia';
            const title = info.event.extendedProps.originalTitle || info.event.title;
            const start = info.event.start;
            const end = info.event.end;
            const eventId = info.event.id;
            const isCompleted = info.event.extendedProps.completed || false;

            const formatDate = (date) => {
                if (!date) return '';
                const options = {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                };
                return date.toLocaleDateString('es-AR', options);
            };

            const modal = document.getElementById('eventModal');
            document.getElementById('modalMateria').textContent = materia;
            document.getElementById('modalTitle').textContent = title;
            document.getElementById('modalStart').textContent = formatDate(start);

            const endContainer = document.getElementById('modalEndContainer');
            if (end) {
                document.getElementById('modalEnd').textContent = formatDate(end);
                endContainer.style.display = 'flex';
            } else {
                endContainer.style.display = 'none';
            }

            // Configurar checkbox  
            const checkbox = document.getElementById('completedCheckbox');
            checkbox.checked = isCompleted;

            // Remover listeners anteriores  
            const newCheckbox = checkbox.cloneNode(true);
            checkbox.parentNode.replaceChild(newCheckbox, checkbox);

            // Agregar nuevo listener  
            newCheckbox.addEventListener('change', function () {
                const checked = this.checked;
                saveCompletedActivity(eventId, checked);

                // Actualizar visualmente el evento  
                if (checked) {
                    info.el.classList.add('completed');
                } else {
                    info.el.classList.remove('completed');
                }

                // Actualizar el estado en el objeto del evento  
                info.event.setExtendedProp('completed', checked);
            });

            modal.style.display = 'block';
        }
    });

    calendar.render();
}

// Funci�n para cerrar el modal
function closeModal() {
    const modal = document.getElementById('eventModal');
    modal.style.display = 'none';
}

// Funciones para manejar actividades completadas
function getCompletedActivities() {
    const completed = localStorage.getItem('completedActivities');
    return completed ? JSON.parse(completed) : {};
}

function saveCompletedActivity(eventId, isCompleted) {
    const completed = getCompletedActivities();
    if (isCompleted) {
        completed[eventId] = true;
    } else {
        delete completed[eventId];
    }
    localStorage.setItem('completedActivities', JSON.stringify(completed));
}

function isActivityCompleted(eventId) {
    const completed = getCompletedActivities();
    return completed[eventId] === true;
}

// Generar ID único para cada evento
function generateEventId(event) {
    return `${event.extendedProps.materia}-${event.extendedProps.originalTitle}-${event.start}`;
}

// Event listeners para cerrar el modal
window.addEventListener('DOMContentLoaded', () => {
    const modal = document.getElementById('eventModal');
    const closeBtn = document.querySelector('.modal-close');

    if (closeBtn) {
        closeBtn.addEventListener('click', closeModal);
    }

    window.addEventListener('click', (event) => {
        if (event.target === modal) {
            closeModal();
        }
    });

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && modal.style.display === 'block') {
            closeModal();
        }
    });
});
