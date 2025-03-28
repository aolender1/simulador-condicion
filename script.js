// Global variable within the module scope to hold subject data  
let materiasData = {};  
  
// DOM Elements  
const materiaSelect = document.getElementById('materiaSelect');  
const dynamicInputsDiv = document.getElementById('dynamicInputs');  
const form = document.getElementById('simuladorForm');  
const resultadoDiv = document.getElementById('resultado');  
const condicionFinalP = document.getElementById('condicionFinal');  
const descripcionCondicionP = document.getElementById('descripcionCondicion');  
const submitButton = form.querySelector('button[type="submit"]'); // Get the submit button  
const iconPlaceholder = document.querySelector('.icon-placeholder'); // Get reference to the icon  

// Populate the subject select dropdown  
function populateMateriaSelect() {  
    materiaSelect.innerHTML = '<option value="">Selecciona una materia...</option>'; // Placeholder  
    for (const key in materiasData) {  
        if (materiasData.hasOwnProperty(key)) {  
            const option = document.createElement('option');  
            option.value = key;  
            option.textContent = materiasData[key].nombre;  
            materiaSelect.appendChild(option);  
        }  
    }  
}  

// Modifica la función generateInputs para mostrar nombres personalizados
function generateInputs(materiaKey) {
    dynamicInputsDiv.innerHTML = ''; // Clear previous inputs
    submitButton.disabled = true; // Disable button by default
    submitButton.textContent = 'Selecciona una materia';

    // Reset results and icon when changing subject or deselecting
    condicionFinalP.textContent = 'Selecciona una materia y completa los datos.';
    descripcionCondicionP.textContent = '';
    condicionFinalP.className = ''; // Reset class
    iconPlaceholder.textContent = '🏆'; // Reset icon to default
    iconPlaceholder.classList.remove('updated'); // Remove animation class

    if (!materiaKey || !materiasData[materiaKey]) {
        return; // Exit if no valid subject selected
    }

    const materia = materiasData[materiaKey];
    
    // Añadir mensaje informativo sobre escala de porcentajes
    const infoMessage = document.createElement('div');
    infoMessage.className = 'info-message';
    infoMessage.textContent = 'Ingresa las notas en porcentajes (0-100)';
    dynamicInputsDiv.appendChild(infoMessage);

    // Input for Asistencia if required
    if (materia.asistencia) {
        const asistenciaGroup = document.createElement('div');
        asistenciaGroup.className = 'form-group';
        asistenciaGroup.innerHTML = `
        <label for="asistencia">Porcentaje de Asistencia:</label>
        <input type="number" id="asistencia" name="asistencia" min="0" max="100" step="1" required>
        `;
        dynamicInputsDiv.appendChild(asistenciaGroup);
    }

    // Input for individual TP scores if any
    if (materia.tps > 0) {
        // If we have named TPs, show individual inputs for each TP
        if (materia.nombresTps) {
            for (let i = 1; i <= materia.tps; i++) {
                const tpGroup = document.createElement('div');
                tpGroup.className = 'form-group';
                
                // Use custom names if available
                const tpName = materia.nombresTps[i-1] || `TP ${i}`;
                
                tpGroup.innerHTML = `
                <label for="tp${i}">Nota ${tpName}:</label>
                <input type="number" id="tp${i}" name="tp${i}" min="0" max="100" step="1" required>
                `;
                dynamicInputsDiv.appendChild(tpGroup);
            }
        } else {
            // Original code for approved TPs count
            const tpsAprobadosGroup = document.createElement('div');
            tpsAprobadosGroup.className = 'form-group';
            tpsAprobadosGroup.innerHTML = `
            <label for="tpsAprobados">TPs Aprobados (de ${materia.tps}):</label>
            <input type="number" id="tpsAprobados" name="tpsAprobados" min="0" max="${materia.tps}" required>
            `;
            dynamicInputsDiv.appendChild(tpsAprobadosGroup);
        }
    }

    // Inputs for Parciales - check if we have custom names
    for (let i = 1; i <= materia.parciales; i++) {
        const parcialGroup = document.createElement('div');
        parcialGroup.className = 'form-group';
        
        // Use custom names if available
        const parcialName = materia.nombresParciales && materia.nombresParciales[i-1] 
            ? materia.nombresParciales[i-1] 
            : `Nota Parcial ${i}`;
            
        parcialGroup.innerHTML = `
        <label for="parcial${i}">${parcialName}:</label>
        <input type="number" id="parcial${i}" name="parcial${i}" min="0" max="100" step="1" required>
        `;
        dynamicInputsDiv.appendChild(parcialGroup);
    }
    
    // Reset results text and enable button when changing subject
    condicionFinalP.textContent = 'Completa los datos para calcular.';
    submitButton.disabled = false; // Enable button
    submitButton.textContent = 'Calcular Condición';
}

// Modifica la función calcularCondicion para usar pesos y el cálculo correcto
function calcularCondicion(event) {
    event.preventDefault(); // Prevent form submission

    const selectedMateriaKey = materiaSelect.value;
    if (!selectedMateriaKey) return; // Exit if no subject is selected

    const materia = materiasData[selectedMateriaKey];
    const formData = new FormData(form);

    let sumaPonderada = 0;
    let sumaPesos = 0;
    let minNotaParcial = Infinity;
    let notasParcialesValidas = true;
    let notas = [];

    // Process partial exam scores
    for (let i = 1; i <= materia.parciales; i++) {
        const notaStr = formData.get(`parcial${i}`);
        // Validate input
        if (notaStr === null || notaStr.trim() === '' || isNaN(Number(notaStr))) {
            alert(`Por favor, ingresa una nota numérica para la evaluación ${i}.`);
            notasParcialesValidas = false;
            return;
        }
        
        const nota = parseInt(notaStr, 10);
        if (nota < 0 || nota > 100) {
            alert(`La nota debe estar entre 0 y 100.`);
            notasParcialesValidas = false;
            return;
        }
        
        notas.push(nota);
        
        // Apply weights if available
        const peso = materia.pesos && materia.pesos[i-1] ? materia.pesos[i-1] : 1/materia.parciales;
        sumaPonderada += nota * peso;
        sumaPesos += peso;
        minNotaParcial = Math.min(minNotaParcial, nota);
    }

    // Process approved TPs
    let porcentajeTpsAprobados = 1; // Default to 100% if no TPs required
    if (materia.tps > 0 && !materia.nombresTps) {
        // Solo validar tpsAprobados si no estamos usando notas individuales
        const tpsAprobadosStr = formData.get('tpsAprobados');
        if (tpsAprobadosStr === null || tpsAprobadosStr.trim() === '' || isNaN(Number(tpsAprobadosStr))) {
            alert(`Por favor, ingresa un número de TPs aprobados.`);
            return;
        }
        const tpsAprobados = parseInt(tpsAprobadosStr, 10);
        if (tpsAprobados < 0 || tpsAprobados > materia.tps) {
            alert(`El número de TPs aprobados debe estar entre 0 y ${materia.tps}.`);
            return;
        }
        porcentajeTpsAprobados = tpsAprobados / materia.tps;
    }

    // Specific logic for algebra - check individual assignments not zero
    if (selectedMateriaKey === 'introalgebra-2025') {
        if (notas[0] === 0 || notas[2] === 0) {
            alert("Los Trabajos Teórico-Prácticos Individuales no pueden tener 0 puntos.");
            return;
        }
        
        // Check paso 1 (assignments 1-2)
        const paso1 = notas[0] * 0.2 + notas[1] * 0.8;
        const paso2 = notas[2] * 0.2 + notas[3] * 0.8;
        
        if (paso1 < 60 && paso2 < 60) {
            const promedio = (paso1 + paso2) / 2;
            condicionFinalP.textContent = "LIBRE";
            descripcionCondicionP.textContent = `Tu promedio es ${promedio.toFixed(0)}, no alcanzaste los 60 puntos mínimos en ninguno de los dos pasos.`;
            condicionFinalP.className = "libre";
            iconPlaceholder.textContent = '❌';
            return;
        }
        
        // Para Algebra, usamos el promedio de los dos pasos
        sumaPonderada = (paso1 + paso2) / 2;
        sumaPesos = 1; // Ya está normalizado
    }

    // Specific logic for Calculo I
    if (selectedMateriaKey === 'calculo1-2025') {
        // Paso 1: Unidades 1-2
        const paso1 = (notas[0] + notas[1]) / 2;
        if (paso1 < 50) {
            const promedio = paso1;
            condicionFinalP.textContent = "LIBRE";
            descripcionCondicionP.textContent = `Tu promedio del Paso 1 es ${promedio.toFixed(0)}, no alcanzaste los 50 puntos mínimos para las Unidades 1-2.`;
            condicionFinalP.className = "libre";
            iconPlaceholder.textContent = '❌';
            return;
        }
        
        // Paso 2: Unidad 3
        const paso2 = (notas[2] + notas[3]) / 2;
        if (paso2 < 50) {
            const promedio = paso2;
            condicionFinalP.textContent = "LIBRE";
            descripcionCondicionP.textContent = `Tu promedio del Paso 2 es ${promedio.toFixed(0)}, no alcanzaste los 50 puntos mínimos para la Unidad 3.`;
            condicionFinalP.className = "libre";
            iconPlaceholder.textContent = '❌';
            return;
        }
        
        // Paso 3: Unidad 4
        const paso3 = (notas[4] + notas[5]) / 2;
        if (paso3 < 50) {
            const promedio = paso3;
            condicionFinalP.textContent = "LIBRE";
            descripcionCondicionP.textContent = `Tu promedio del Paso 3 es ${promedio.toFixed(0)}, no alcanzaste los 50 puntos mínimos para la Unidad 4.`;
            condicionFinalP.className = "libre";
            iconPlaceholder.textContent = '❌';
            return;
        }
        
        // Nota final: Promedio entre todos los TPE individuales y el Trabajo Grupal Final
        // TPE individuales: notas[0], notas[2], notas[4]
        // Trabajo Grupal Final: notas[5]
        sumaPonderada = (notas[0] + notas[2] + notas[4] + notas[5]) / 4;
        sumaPesos = 1; // Ya está normalizado
    }

    // Specific logic for CTyS
if (selectedMateriaKey === 'ctys-2025') {
    // Check attendance
    const asistenciaStr = formData.get('asistencia');
    if (asistenciaStr === null || asistenciaStr.trim() === '' || isNaN(Number(asistenciaStr))) {
        alert('Por favor, ingresa un porcentaje de asistencia válido.');
        return;
    }
    
    const asistencia = parseInt(asistenciaStr, 10);
    if (asistencia < 0 || asistencia > 100) {
        alert('El porcentaje de asistencia debe estar entre 0 y 100.');
        return;
    }
    
    // Check if attendance is below 75%
    if (asistencia < 75) {
        condicionFinalP.textContent = "LIBRE";
        descripcionCondicionP.textContent = "No alcanzaste el mínimo del 75% de asistencia requerida.";
        condicionFinalP.className = "libre";
        iconPlaceholder.textContent = '❌';
        return;
    }
    
    // Check TP scores (if we have individual TPs)
    let todasNotasTps = [];
    let tpsAprobadosPromo = 0;
    let tpsAprobadosRegular = 0;
    
    for (let i = 1; i <= materia.tps; i++) {
        const notaTpStr = formData.get(`tp${i}`);
        if (notaTpStr === null || notaTpStr.trim() === '' || isNaN(Number(notaTpStr))) {
            alert(`Por favor, ingresa una nota numérica para el TP ${i}.`);
            return;
        }
        
        const notaTp = parseFloat(notaTpStr);
        if (notaTp < 0 || notaTp > 100) {
            alert(`La nota del TP debe estar entre 0 y 100.`);
            return;
        }
        
        todasNotasTps.push(notaTp);
        
        // Count approved TPs (convertimos la escala de porcentajes a 0-10)
        if (notaTp >= 70) {  // 7 en escala 0-10 = 70 en escala 0-100
            tpsAprobadosPromo++;
        }
        if (notaTp >= 60) {  // 6 en escala 0-10 = 60 en escala 0-100
            tpsAprobadosRegular++;
        }
    }
    
    // Check TIF note (también en escala 0-100)
    const notaTif = notas[0]; // The first (and only) parcial is the TIF
    
    // For promotion: All TPs >= 70 and TIF >= 60
    if (tpsAprobadosRegular < materia.tps) {
        condicionFinalP.textContent = "LIBRE";
        descripcionCondicionP.textContent = "No aprobaste todos los trabajos prácticos con al menos 60%.";
        condicionFinalP.className = "libre";
        iconPlaceholder.textContent = '❌';
        return;
    }
    
    if (tpsAprobadosPromo === materia.tps && notaTif >= 60) {
        condicionFinalP.textContent = "PROMOCIONADO";
        descripcionCondicionP.textContent = "¡Felicitaciones! Cumples con todos los requisitos para promocionar la materia.";
        condicionFinalP.className = "promocionado";
        iconPlaceholder.textContent = '🎉';
        return;
    }
    
    condicionFinalP.textContent = "REGULAR";
    descripcionCondicionP.textContent = "Has regularizado la materia. Recuerda que deberás rendir examen final.";
    condicionFinalP.className = "regular";
    iconPlaceholder.textContent = '🏆';
    return;
}

    // Calculate weighted average by dividing by the sum of weights
    const promedioParciales = sumaPesos !== 0 ? sumaPonderada / sumaPesos : 0;

    // Condition logic
    const condPromocion = materia.condiciones.promocion;
    const condRegular = materia.condiciones.regular;

    let condicion = "LIBRE";
    let descripcion = "No cumples las condiciones mínimas para regularizar ni promocionar.";
    let cssClass = "libre";
    let icon = '❌'; // Default icon for Libre

    // Check for Promotion
    if (minNotaParcial >= condPromocion.minNotaParcial &&
        promedioParciales >= condPromocion.minPromedioGeneral &&
        porcentajeTpsAprobados >= condPromocion.minTpsAprobados) {
        condicion = "PROMOCIONADO";
        descripcion = `¡Felicitaciones! Alcanzaste la promoción directa con un promedio general de ${promedioParciales.toFixed(2)}.`;
        cssClass = "promocionado";
        icon = '🎉'; // Icon for Promocionado
    }
    // Check for Regular status
    else if (minNotaParcial >= condRegular.minNotaParcial &&
             promedioParciales >= condRegular.minPromedioGeneral &&
             porcentajeTpsAprobados >= condRegular.minTpsAprobados) {
        condicion = "REGULAR";
        descripcion = `Has regularizado la materia con un promedio de ${promedioParciales.toFixed(2)}.`;
        cssClass = "regular";
        icon = '🏆'; // Icon for Regular
    }

    // Display the result
    condicionFinalP.textContent = condicion;
    descripcionCondicionP.textContent = descripcion;
    condicionFinalP.className = cssClass;
    iconPlaceholder.textContent = icon;
    iconPlaceholder.classList.add('updated');
    setTimeout(() => {
        iconPlaceholder.classList.remove('updated');
    }, 300);
}

// --- Initialization using async/await ---  

// Función para cambiar el tema
function setupThemeToggle() {
    const themeToggle = document.getElementById('themeToggle');
    const body = document.body;
    
    // Cargar tema de localStorage si existe
    if (localStorage.getItem('darkTheme') === 'true') {
        body.classList.add('dark-theme');
        themeToggle.textContent = '☀️';
    }
    
    themeToggle.addEventListener('click', () => {
        // Toggle the dark theme class
        body.classList.toggle('dark-theme');
        
        // Update the button text
        if (body.classList.contains('dark-theme')) {
            themeToggle.textContent = '☀️';
            localStorage.setItem('darkTheme', 'true');
        } else {
            themeToggle.textContent = '🌙';
            localStorage.setItem('darkTheme', 'false');
        }
    });
}

// Modificar la función initializeSimulator para incluir setupThemeToggle
async function initializeSimulator() {
    try {
        // Fetch subject data from JSON file using await
        const response = await fetch('materias.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        // Parse JSON data using await
        materiasData = await response.json();

        // Now that data is loaded, populate the select and set up listeners
        populateMateriaSelect();
        generateInputs(null); // Initialize with no inputs shown

        // Event Listeners
        materiaSelect.addEventListener('change', (e) => generateInputs(e.target.value));
        form.addEventListener('submit', calcularCondicion);
        
        // Setup theme toggle functionality
        setupThemeToggle();

    } catch (error) {
        console.error('Error initializing simulator:', error);
        materiaSelect.innerHTML = '<option value="">Error al cargar materias</option>';
        condicionFinalP.textContent = 'No se pudieron cargar los datos de las materias.';
        // Optionally disable the form completely
        submitButton.disabled = true;
        submitButton.textContent = 'Error';
        iconPlaceholder.textContent = '⚠️'; // Indicate error state in icon
    }
}

// Call the async initialization function  
initializeSimulator();