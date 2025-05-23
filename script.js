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

// Modifica la función generateInputs para quitar 'required'
// Further modified to handle specific input scales for introalgebra-2025
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
    if (materiaKey === 'introalgebra-2025') {
        // Specific message for Algebra with its unique alternating scales
        infoMessage.textContent = 'Para Introducción al Álgebra: Parciales tipo "Individual" (1°, 3°, ...) son nota 0-10. Parciales tipo "Grupal" (2°, 4°, ...) son nota 0-80.';
    } else {
        infoMessage.textContent = 'Ingresa las notas en porcentajes (0-100)';
    }
    dynamicInputsDiv.appendChild(infoMessage);

    // Input for Asistencia if required (Remove 'required')
    if (materia.asistencia) {
    const asistenciaGroup = document.createElement('div');
    asistenciaGroup.className = 'form-group';
    asistenciaGroup.innerHTML = `
    <label for="asistencia">Porcentaje de Asistencia:</label>
    <input type="number" id="asistencia" name="asistencia" min="0" max="100" step="1"> 
    `; // Removed 'required'
    dynamicInputsDiv.appendChild(asistenciaGroup);
    }

    // Input for individual TP scores if any (Remove 'required')
    if (materia.tps > 0) {
    // If we have named TPs, show individual inputs for each TP
    if (materia.nombresTps) {
    for (let i = 1; i <= materia.tps; i++) {
    const tpGroup = document.createElement('div');
    tpGroup.className = 'form-group';

    // Use custom names if available
    const tpName = materia.nombresTps[i - 1] || `TP ${i}`;

    tpGroup.innerHTML = `
    <label for="tp${i}">Nota ${tpName}:</label>
    <input type="number" id="tp${i}" name="tp${i}" min="0" max="100" step="1">
    `; // Removed 'required'
    dynamicInputsDiv.appendChild(tpGroup);
    }
    } else {
    // Original code for approved TPs count (Remove 'required')
    const tpsAprobadosGroup = document.createElement('div');
    tpsAprobadosGroup.className = 'form-group';
    tpsAprobadosGroup.innerHTML = `
    <label for="tpsAprobados">TPs Aprobados (de ${materia.tps}):</label>
    <input type="number" id="tpsAprobados" name="tpsAprobados" min="0" max="${materia.tps}">
    `; // Removed 'required'
    dynamicInputsDiv.appendChild(tpsAprobadosGroup);
    }
    }

    // Inputs for Parciales - check if we have custom names (Remove 'required')
    // Modified to set specific max values for introalgebra-2025 based on odd/even index
    for (let i = 1; i <= materia.parciales; i++) {
        const parcialGroup = document.createElement('div');
        parcialGroup.className = 'form-group';

        // Use custom names if available
        const parcialName = materia.nombresParciales && materia.nombresParciales[i - 1]
        ? materia.nombresParciales[i - 1]
        : `Nota Parcial ${i}`;

        let inputMax = 100; // Default max value for partial inputs
        let inputMin = 0;   // Default min value
        
        // Specific handling for introalgebra-2025 partials based on odd/even index
        if (materiaKey === 'introalgebra-2025') {
            if (i % 2 !== 0) { // Odd partials (1st, 3rd, etc.) are "Individual" type
                inputMax = 10;
            } else { // Even partials (2nd, 4th, etc.) are "Grupal" type
                inputMax = 80;
            }
        }

        parcialGroup.innerHTML = `
        <label for="parcial${i}">${parcialName}:</label>
        <input type="number" id="parcial${i}" name="parcial${i}" min="${inputMin}" max="${inputMax}" step="1">
        `; // Removed 'required', added dynamic max
        dynamicInputsDiv.appendChild(parcialGroup);
    }

    // Reset results text and enable button when changing subject
    condicionFinalP.textContent = 'Completa los datos para calcular.';
    submitButton.disabled = false; // Enable button
    submitButton.textContent = 'Calcular Condición';
}

// Modifica la función calcularCondicion para manejar cálculo parcial y nuevo régimen de Calculo I
// Further modified to handle specific scaling for introalgebra-2025
function calcularCondicion(event) {
    event.preventDefault(); // Prevent form submission

    const selectedMateriaKey = materiaSelect.value;
    if (!selectedMateriaKey) return; // Exit if no subject is selected

    const materia = materiasData[selectedMateriaKey];
    const formData = new FormData(form);

    // Helper function to get and parse grade, returns NaN if invalid/empty
    // Modified to accept minVal and maxVal for validation range
    const getNota = (name, minVal = 0, maxVal = 100) => {
    const notaStr = formData.get(name);
    if (notaStr === null || notaStr.trim() === '') {
    return NaN; // Not entered
    }
    const nota = parseFloat(notaStr); // Use parseFloat for potential decimals
    // Allow 0 as a valid grade, check for NaN explicitly
    if (isNaN(nota) || nota < minVal || nota > maxVal) {
    // Display alert but return NaN to indicate invalid input for logic
    // Try to get a more descriptive name from the label
    const labelElement = document.querySelector(`label[for="${name}"]`);
    const displayName = labelElement ? labelElement.textContent.replace(':', '') : name;
    alert(`La nota para "${displayName}" debe ser un número entre ${minVal} y ${maxVal}.`);
    return NaN;
    }
    return nota;
    };

    // Helper function to display results (ensure this uses innerHTML for description)
    const displayResult = (condicion, descripcion, cssClass, icon) => {
    condicionFinalP.textContent = condicion;
    descripcionCondicionP.innerHTML = descripcion; // Use innerHTML
    condicionFinalP.className = cssClass; // Apply specific class
    iconPlaceholder.textContent = icon;
    iconPlaceholder.classList.add('updated');
    setTimeout(() => {
    iconPlaceholder.classList.remove('updated');
    }, 300);
    };

    // --- Common variables for default/algebra logic ---
    let notasParciales = []; // Will store scaled (0-100 equivalent) notes
    let pesosUsados = [];
    let sumaPonderada = 0;
    let sumaPesos = 0;
    let minNotaParcial = Infinity; // Will be calculated on scaled notes
    let notasParcialesValidas = true; // Tracks if any input was invalid
    let allParcialesEntered = true; // Tracks if ALL partial fields have a value
    let anyParcialEntered = false; // Tracks if AT LEAST ONE partial field has a value

    // Process partial exam scores (common logic)
    // Modified to handle specific scaling for introalgebra-2025 based on odd/even index
    for (let i = 1; i <= materia.parciales; i++) {
        const inputName = `parcial${i}`;
        let rawNota; // The raw value from the input field
        let scaledNota; // The value after scaling (if applicable), used for calculations

        if (selectedMateriaKey === 'introalgebra-2025') {
            if (i % 2 !== 0) { // Odd partials (1st, 3rd, etc.) are "Individual" type
                rawNota = getNota(inputName, 0, 10); // Validate raw score 0-10
                if (!isNaN(rawNota)) {
                    scaledNota = rawNota * 10; // Scale to 0-100 range for weighting
                }
            } else { // Even partials (2nd, 4th, etc.) are "Grupal" type
                rawNota = getNota(inputName, 0, 80); // Validate raw score 0-80
                if (!isNaN(rawNota)) {
                    scaledNota = rawNota * 1.25; // Scale to 0-100 range for weighting
                }
            }
        } else { // For all other subjects, assume standard 0-100 scale
            rawNota = getNota(inputName); // Default 0-100 validation
            if (!isNaN(rawNota)) {
                scaledNota = rawNota; // No scaling needed
            }
        }

        // Use custom weights if defined, otherwise equal weight
        const peso = materia.pesos && materia.pesos[i-1] ? materia.pesos[i-1] : (materia.parciales > 0 ? 1/materia.parciales : 0);

        if (isNaN(rawNota)) { // Check rawNota for emptiness/invalidity (getNota handles alerts)
            allParcialesEntered = false;
            const notaStr = formData.get(inputName); // Check if it was an invalid entry vs. empty
            if (notaStr !== null && notaStr.trim() !== '') {
                 // If getNota returned NaN for a non-empty string, it means it was invalid (e.g. out of range, not a number)
                notasParcialesValidas = false; 
            }
        }
        
        if (!isNaN(scaledNota)) {
            anyParcialEntered = true;
            notasParciales.push(scaledNota); // Store the scaled nota
            pesosUsados.push(peso);
            sumaPonderada += scaledNota * peso; // Use scaledNota for weighted sum
            sumaPesos += peso;
            minNotaParcial = Math.min(minNotaParcial, scaledNota); // Min on scaledNota
        } else if (isNaN(rawNota) && formData.get(inputName) !== null && formData.get(inputName).trim() !== '') {
            // This case means an invalid value was entered (e.g. text, or out of range number)
            // notasParcialesValidas is already set to false by getNota's alert side-effect handling in the loop start
        }
    }


    // Process approved TPs (common logic for count-based TPs)
    let porcentajeTpsAprobados = 1; // Default to 100% if no TPs required
    let tpsDataValid = true; // Tracks if TP input is valid
    let tpsEntered = false; // Tracks if TP input was provided (if required)
    let tpsAprobadosNum = NaN; // Store the number entered

    if (materia.tps > 0 && !materia.nombresTps) { // Only if TPs are counted, not named
    const tpsAprobadosStr = formData.get('tpsAprobados');
    if (tpsAprobadosStr === null || tpsAprobadosStr.trim() === '') {
    tpsEntered = false;
    } else {
    tpsEntered = true;
    tpsAprobadosNum = parseInt(tpsAprobadosStr, 10);
    if (isNaN(tpsAprobadosNum) || tpsAprobadosNum < 0 || tpsAprobadosNum > materia.tps) {
    alert(`El número de TPs aprobados debe estar entre 0 y ${materia.tps}.`);
    tpsDataValid = false; // Invalid value
    porcentajeTpsAprobados = NaN; // Mark as invalid
    } else {
    porcentajeTpsAprobados = (materia.tps === 0) ? 1 : (tpsAprobadosNum / materia.tps); // Avoid division by zero
    }
    }
    } else {
    tpsEntered = true; 
    }


    // --- Specific Logic for Calculo I ---
    if (selectedMateriaKey === 'calculo1-2025') {
    // ... (Existing Calculo I logic remains unchanged) ...
    // It already handles partial calculations correctly.
    // Make sure the code from the previous step is here.
    const notaTPE1_2 = getNota('parcial1'); // TPE Individual U1-2
    const notaTG1_2 = getNota('parcial2');  // Trabajo Grupal U1-2
    const notaTPE3 = getNota('parcial3');   // TPE Individual U3
    const notaTG3 = getNota('parcial4');    // Trabajo Grupal U3
    const notaTPE4 = getNota('parcial5');   // TPE Individual U4
    const notaTGFinal = getNota('parcial6'); // Trabajo Grupal Final

    let paso1Superado = false;
    let paso1Pendiente = false; // Flag if passed with 40-49.99
    let paso1Completo = false;
    let avgPaso1 = NaN;

    let paso2Superado = false;
    let paso2Pendiente = false;
    let paso2Completo = false;
    let avgPaso2 = NaN;

    let paso3Superado = false;
    let paso3Pendiente = false;
    let paso3Completo = false;
    let avgPaso3 = NaN;

    // Helper to calculate provisional final average
    const calcularPromedioFinalProvisorio = () => {
    const notasFinales = [notaTPE1_2, notaTPE3, notaTPE4, notaTGFinal].filter(n => !isNaN(n));
    if (notasFinales.length === 0) return NaN;
    const sum = notasFinales.reduce((a, b) => a + b, 0);
    return sum / notasFinales.length;
    };

    // --- Evaluar Paso 1 ---
    if (!isNaN(notaTPE1_2) && !isNaN(notaTG1_2)) { // Both grades entered
    paso1Completo = true;
    avgPaso1 = (notaTPE1_2 + notaTG1_2) / 2;
    if (avgPaso1 < 40) {
    displayResult("LIBRE", `El promedio del Paso 1 (${avgPaso1.toFixed(1)}) es menor a 40.`, "libre", "❌");
    return; // Stop calculation
    } else if (avgPaso1 < 50) {
    paso1Superado = true; // Can proceed
    paso1Pendiente = true; // But needs recovery
    } else { // >= 50
    paso1Superado = true;
    paso1Pendiente = false;
    }
    } else if (!isNaN(notaTPE1_2)) { // Only TPE 1-2 entered
    const necesario40 = (40 * 2) - notaTPE1_2;
    const necesario50 = (50 * 2) - notaTPE1_2;
    let msg = `Necesitas al menos ${Math.max(0, necesario40).toFixed(1)}% en el Trabajo Grupal (U1-2) para pasar pendiente (promedio 40), o ${Math.max(0, necesario50).toFixed(1)}% para aprobar (promedio 50).`;
    if (necesario40 > 100) msg = `Necesitas más de 100 en el TG (U1-2), lo cual es imposible. Condición actual: LIBRE.`;
    else if (necesario50 <= 0) msg = `Ya superaste el mínimo de aprobación (50) del Paso 1 con ${notaTPE1_2.toFixed(1)} en el TPE (U1-2). Ingresa la nota del TG (U1-2) para confirmar.`;
    displayResult("Estado: Pendiente", msg, "pendiente", "⏳");
    return;
    } else if (!isNaN(notaTG1_2)) { // Only TG 1-2 entered
    const necesario40 = (40 * 2) - notaTG1_2;
    const necesario50 = (50 * 2) - notaTG1_2;
    let msg = `Necesitas al menos ${Math.max(0, necesario40).toFixed(1)}% en el TPE Individual (U1-2) para pasar pendiente (promedio 40), o ${Math.max(0, necesario50).toFixed(1)}% para aprobar (promedio 50).`;
    if (necesario40 > 100) msg = `Necesitas más de 100 en el TPE (U1-2), lo cual es imposible. Condición actual: LIBRE.`;
    else if (necesario50 <= 0) msg = `Ya superaste el mínimo de aprobación (50) del Paso 1 con ${notaTG1_2.toFixed(1)} en el TG (U1-2). Ingresa la nota del TPE (U1-2) para confirmar.`;
    displayResult("Estado: Pendiente", msg, "pendiente", "⏳");
    return;
    }
    // If neither grade for Paso 1 is entered, paso1Completo remains false

    // --- Evaluar Paso 2 (solo si Paso 1 fue superado) ---
    if (paso1Superado) {
    if (!isNaN(notaTPE3) && !isNaN(notaTG3)) { // Both grades entered
    paso2Completo = true;
    avgPaso2 = (notaTPE3 + notaTG3) / 2;
    if (avgPaso2 < 40) {
    displayResult("LIBRE", `Paso 1 ${paso1Pendiente ? 'pendiente' : 'aprobado'} (${avgPaso1.toFixed(1)}). El promedio del Paso 2 (${avgPaso2.toFixed(1)}) es menor a 40.`, "libre", "❌");
    return; // Stop calculation
    } else if (avgPaso2 < 50) {
    paso2Superado = true; // Can proceed
    paso2Pendiente = true; // But needs recovery
    } else { // >= 50
    paso2Superado = true;
    paso2Pendiente = false;
    }
    } else if (!isNaN(notaTPE3)) { // Only TPE 3 entered
    const necesario40 = (40 * 2) - notaTPE3;
    const necesario50 = (50 * 2) - notaTPE3;
    let msg = `Paso 1 ${paso1Pendiente ? 'pendiente' : 'aprobado'} (${avgPaso1.toFixed(1)}). Necesitas al menos ${Math.max(0, necesario40).toFixed(1)}% en el TG (U3) para pasar pendiente (promedio 40), o ${Math.max(0, necesario50).toFixed(1)}% para aprobar (promedio 50).`;
    if (necesario40 > 100) msg = `Paso 1 ${paso1Pendiente ? 'pendiente' : 'aprobado'} (${avgPaso1.toFixed(1)}). Necesitas más de 100 en el TG (U3), lo cual es imposible. Condición actual: LIBRE.`;
    else if (necesario50 <= 0) msg = `Paso 1 ${paso1Pendiente ? 'pendiente' : 'aprobado'} (${avgPaso1.toFixed(1)}). Ya superaste el mínimo de aprobación (50) del Paso 2 con ${notaTPE3.toFixed(1)} en el TPE (U3). Ingresa la nota del TG (U3) para confirmar.`;
    const provAvg = calcularPromedioFinalProvisorio();
    if (!isNaN(provAvg)) msg += ` <strong>Promedio final provisional: ${provAvg.toFixed(1)}.</strong>`;
    displayResult("Estado: Pendiente", msg, "pendiente", "⏳");
    return;
    } else if (!isNaN(notaTG3)) { // Only TG 3 entered
    const necesario40 = (40 * 2) - notaTG3;
    const necesario50 = (50 * 2) - notaTG3;
    let msg = `Paso 1 ${paso1Pendiente ? 'pendiente' : 'aprobado'} (${avgPaso1.toFixed(1)}). Necesitas al menos ${Math.max(0, necesario40).toFixed(1)}% en el TPE (U3) para pasar pendiente (promedio 40), o ${Math.max(0, necesario50).toFixed(1)}% para aprobar (promedio 50).`;
    if (necesario40 > 100) msg = `Paso 1 ${paso1Pendiente ? 'pendiente' : 'aprobado'} (${avgPaso1.toFixed(1)}). Necesitas más de 100 en el TPE (U3), lo cual es imposible. Condición actual: LIBRE.`;
    else if (necesario50 <= 0) msg = `Paso 1 ${paso1Pendiente ? 'pendiente' : 'aprobado'} (${avgPaso1.toFixed(1)}). Ya superaste el mínimo de aprobación (50) del Paso 2 con ${notaTG3.toFixed(1)} en el TG (U3). Ingresa la nota del TPE (U3) para confirmar.`;
    const provAvg = calcularPromedioFinalProvisorio();
    if (!isNaN(provAvg)) msg += ` <strong>Promedio final provisional: ${provAvg.toFixed(1)}.</strong>`;
    displayResult("Estado: Pendiente", msg, "pendiente", "⏳");
    return;
    }
    // If neither grade for Paso 2 is entered, paso2Completo remains false
    } else if (paso1Completo && !paso1Superado) {
    displayResult("LIBRE", `No superaste el Paso 1 (promedio ${avgPaso1.toFixed(1)} < 40).`, "libre", "❌");
    return;
    } else if (!paso1Completo && ( !isNaN(notaTPE3) || !isNaN(notaTG3) )) {
    displayResult("Estado: Pendiente", "Completa y supera el Paso 1 antes de evaluar el Paso 2.", "pendiente", "⏳");
    return;
    }

    // --- Evaluar Paso 3 (solo si Paso 1 y 2 fueron superados) ---
    if (paso1Superado && paso2Superado) {
    if (!isNaN(notaTPE4) && !isNaN(notaTGFinal)) { // Both grades entered
    paso3Completo = true;
    avgPaso3 = (notaTPE4 + notaTGFinal) / 2;
    if (avgPaso3 < 40) {
    displayResult("LIBRE", `Pasos 1 (${avgPaso1.toFixed(1)})${paso1Pendiente ? ' (P)' : ''} y 2 (${avgPaso2.toFixed(1)})${paso2Pendiente ? ' (P)' : ''} superados. El promedio del Paso 3 (${avgPaso3.toFixed(1)}) es menor a 40.`, "libre", "❌");
    return; // Stop calculation
    } else if (avgPaso3 < 50) {
    paso3Superado = true; // Can proceed
    paso3Pendiente = true; // But needs recovery
    } else { // >= 50
    paso3Superado = true;
    paso3Pendiente = false;
    }
    } else if (!isNaN(notaTPE4)) { // Only TPE 4 entered
    const necesario40 = (40 * 2) - notaTPE4;
    const necesario50 = (50 * 2) - notaTPE4;
    let msg = `Pasos 1 (${avgPaso1.toFixed(1)})${paso1Pendiente ? ' (P)' : ''} y 2 (${avgPaso2.toFixed(1)})${paso2Pendiente ? ' (P)' : ''} superados. Necesitas al menos ${Math.max(0, necesario40).toFixed(1)}% en el TG Final para pasar pendiente (promedio 40), o ${Math.max(0, necesario50).toFixed(1)}% para aprobar (promedio 50).`;
    if (necesario40 > 100) msg = `Pasos 1 y 2 superados. Necesitas más de 100 en el TG Final, lo cual es imposible. Condición actual: LIBRE.`;
    else if (necesario50 <= 0) msg = `Pasos 1 y 2 superados. Ya superaste el mínimo de aprobación (50) del Paso 3 con ${notaTPE4.toFixed(1)} en el TPE (U4). Ingresa la nota del TG Final para confirmar.`;
    const provAvg = calcularPromedioFinalProvisorio();
    if (!isNaN(provAvg)) msg += ` <strong>Promedio final provisional: ${provAvg.toFixed(1)}.</strong>`;
    displayResult("Estado: Pendiente", msg, "pendiente", "⏳");
    return;
    } else if (!isNaN(notaTGFinal)) { // Only TG Final entered
    let msg = `Pasos 1 (${avgPaso1.toFixed(1)})${paso1Pendiente ? ' (P)' : ''} y 2 (${avgPaso2.toFixed(1)})${paso2Pendiente ? ' (P)' : ''} superados. Ingresa la nota del TPE Individual (U4) para calcular el promedio del Paso 3.`;
    const provAvg = calcularPromedioFinalProvisorio();
    if (!isNaN(provAvg)) msg += ` <strong>Promedio final provisorio: ${provAvg.toFixed(1)}.</strong>`; // Corrected typo: provisional
    displayResult("Estado: Pendiente", msg, "pendiente", "⏳");
    return;
    }
    // If neither grade for Paso 3 is entered, paso3Completo remains false
    } else if (paso1Superado && paso2Completo && !paso2Superado) {
    displayResult("LIBRE", `Paso 1 ${paso1Pendiente ? 'pendiente' : 'aprobado'} (${avgPaso1.toFixed(1)}). No superaste el Paso 2 (promedio ${avgPaso2.toFixed(1)} < 40).`, "libre", "❌");
    return;
    } else if (!paso1Superado || !paso2Superado) {
    if (!isNaN(notaTPE4) || !isNaN(notaTGFinal)) {
    let msg = "Completa y supera los Pasos 1 y 2 antes de evaluar el Paso 3.";
    if (paso1Completo) msg += ` Paso 1: ${avgPaso1.toFixed(1)}${paso1Pendiente ? ' (P)' : ''}.`;
    if (paso2Completo) msg += ` Paso 2: ${avgPaso2.toFixed(1)}${paso2Pendiente ? ' (P)' : ''}.`;
    const provAvg = calcularPromedioFinalProvisorio();
    if (!isNaN(provAvg)) msg += ` <strong>Promedio final provisional: ${provAvg.toFixed(1)}.</strong>`;
    displayResult("Estado: Pendiente", msg, "pendiente", "⏳");
    return;
    }
    }

    // --- Final Condition Calculation (Only if all steps passed, potentially pending) ---
    if (paso1Superado && paso2Superado && paso3Superado) {
    if (isNaN(notaTPE1_2) || isNaN(notaTPE3) || isNaN(notaTPE4) || isNaN(notaTGFinal)) {
    displayResult("Error", "Faltan notas TPE/TG Final necesarias para el cálculo final, aunque los pasos fueron superados. Revisa los datos.", "error", "⚠️");
    return;
    }
    const promedioFinal = calcularPromedioFinalProvisorio();
    const necesitaRecuperatorio = paso1Pendiente || paso2Pendiente || paso3Pendiente;
    let pasosPendientesStr = [];
    if (paso1Pendiente) pasosPendientesStr.push(`Paso 1 (${avgPaso1.toFixed(1)})`);
    if (paso2Pendiente) pasosPendientesStr.push(`Paso 2 (${avgPaso2.toFixed(1)})`);
    if (paso3Pendiente) pasosPendientesStr.push(`Paso 3 (${avgPaso3.toFixed(1)})`);

    if (necesitaRecuperatorio) {
    displayResult(
    "PENDIENTE RECUPERATORIO",
    `Pasos superados, pero ${pasosPendientesStr.join(', ')} requiere(n) aprobar instancia extra de TPE (promedio < 50). <strong>Promedio final actual: ${promedioFinal.toFixed(1)}.</strong> Nota: Solo se puede usar la instancia extra para UN TPE.`,
    "pendiente",
    "🤔"
    );
    } else {
    if (promedioFinal >= 75) {
    displayResult("PROMOCIONADO", `¡Felicitaciones! Superaste todos los pasos (>=50) y tu <strong>promedio final (${promedioFinal.toFixed(1)})</strong> es suficiente para promocionar.`, "promocionado", "🎉");
    } else if (promedioFinal >= 50) {
    displayResult("REGULAR", `Superaste todos los pasos (>=50). Tu <strong>promedio final es ${promedioFinal.toFixed(1)}</strong>. Debes rendir examen final.`, "regular", "🏆");
    } else {
    displayResult("LIBRE", `Superaste todos los pasos (>=50), pero tu <strong>promedio final (${promedioFinal.toFixed(1)})</strong> es menor a 50.`, "libre", "❌");
    }
    }
    return; // Calculation finished for Calculo I
    } else {
    // --- Improved Pending Messages ---
    let msg = "Estado: Pendiente. ";
    let provAvg = calcularPromedioFinalProvisorio();
    let provAvgStr = !isNaN(provAvg) ? ` <strong>Promedio final provisional: ${provAvg.toFixed(1)}.</strong>` : '';

    if (!paso1Completo && !paso2Completo && !paso3Completo && isNaN(notaTPE1_2) && isNaN(notaTG1_2) && isNaN(notaTPE3) && isNaN(notaTG3) && isNaN(notaTPE4) && isNaN(notaTGFinal)) {
    msg = "Ingresa las notas de los pasos para calcular tu estado.";
    } else if (!paso1Superado && !paso1Completo) {
    msg += "Completa las notas del Paso 1 (promedio >= 40 para seguir, >= 50 para aprobar).";
    } else if (paso1Superado && !paso2Superado && !paso2Completo) {
    msg += `Paso 1: ${avgPaso1.toFixed(1)}${paso1Pendiente ? ' (Pendiente Recuperatorio)' : ' (Aprobado)'}. Completa las notas del Paso 2 (promedio >= 40 para seguir, >= 50 para aprobar).${provAvgStr}`;
    } else if (paso1Superado && paso2Superado && !paso3Superado && !paso3Completo) {
    msg += `Paso 1: ${avgPaso1.toFixed(1)}${paso1Pendiente ? ' (P)' : ''}, Paso 2: ${avgPaso2.toFixed(1)}${paso2Pendiente ? ' (P)' : ''}. Completa las notas del Paso 3 (promedio >= 40 para seguir, >= 50 para aprobar).${provAvgStr}`;
    } else {
    msg = "Verifica las notas ingresadas y los requisitos de cada paso.";
    if (paso1Completo) msg += ` P1: ${avgPaso1.toFixed(1)}${paso1Pendiente ? '(P)' : ''}.`;
    if (paso2Completo) msg += ` P2: ${avgPaso2.toFixed(1)}${paso2Pendiente ? '(P)' : ''}.`;
    if (paso3Completo) msg += ` P3: ${avgPaso3.toFixed(1)}${paso3Pendiente ? '(P)' : ''}.`;
    msg += provAvgStr;
    }
    displayResult("Estado: Pendiente", msg, "pendiente", "⏳");
    return; // Stop processing for Calculo I
    }
    } // --- End Specific Logic for Calculo I ---


    // --- Specific logic for algebra (MODIFIED FOR PARTIAL CALCULATION AND PROMOTION) ---
    if (selectedMateriaKey === 'introalgebra-2025') {
        // Check for invalid inputs (parciales only for Algebra)
        if (!notasParcialesValidas) {
            displayResult("Error", "Verifica las notas de los parciales (deben ser números válidos según la escala indicada).", "error", "⚠️");
            return;
        }

        // Check if at least one partial was entered
        if (!anyParcialEntered) {
            displayResult("Estado: Pendiente", "Ingresa al menos una nota de parcial para calcular.", "pendiente", "📝");
            return;
        }

        // Calculate provisional weighted average (from common loop, using scaled notes and weights)
        const promedioProvisional = sumaPesos > 0 ? sumaPonderada / sumaPesos : NaN;
        const esFinal = allParcialesEntered && notasParcialesValidas;

        // Determine condition (Promotion, Regular, Libre)
        let condicionFinal = "LIBRE"; // Default
        let iconFinal = '❌';
        let cssClassFinal = "libre";
        let descripcionFinal = "";

        const promoCond = materia.condiciones.promocion;
        const regularCond = materia.condiciones.regular;

        if (!isNaN(promedioProvisional)) {
            // Base description with the calculated average
            descripcionFinal = `Promedio (ponderado, escala 0-100): ${promedioProvisional.toFixed(2)}. `;

            // Check for Promotion first
            if (promoCond && promedioProvisional >= promoCond.minPromedioGeneral) {
                let promoMinNotaOk = true;
                // minNotaParcial is calculated on the SCALED (0-100) component scores
                if (promoCond.hasOwnProperty('minNotaParcial') && minNotaParcial < promoCond.minNotaParcial) {
                    promoMinNotaOk = false;
                }

                if (promoMinNotaOk) {
                    condicionFinal = "PROMOCIONADO";
                    iconFinal = '🎉';
                    cssClassFinal = "promocionado";
                    descripcionFinal += "¡Felicitaciones! Cumples los requisitos para promocionar.";
                } else {
                    // Meets average for promo, but not minNotaParcial. Check Regular.
                    descripcionFinal += `No promociona por nota mínima de parcial (requiere ${promoCond.minNotaParcial} en todos los componentes). `;
                    // Fall through to check Regular status
                }
            }
            
            // Check for Regular if not Promocionado (or if promotion failed due to minNotaParcial)
            if (condicionFinal !== "PROMOCIONADO" && regularCond && promedioProvisional >= regularCond.minPromedioGeneral) {
                let regularMinNotaOk = true;
                if (regularCond.hasOwnProperty('minNotaParcial') && minNotaParcial < regularCond.minNotaParcial) {
                    regularMinNotaOk = false;
                }

                if (regularMinNotaOk) {
                    condicionFinal = "REGULAR";
                    iconFinal = '🏆';
                    cssClassFinal = "regular";
                    descripcionFinal += "Condición: Regular. Debes rendir final.";
                } else {
                    // Meets average for regular, but not minNotaParcial for regular. So, Libre.
                    condicionFinal = "LIBRE";
                    iconFinal = '❌';
                    cssClassFinal = "libre";
                    descripcionFinal += `No regulariza por nota mínima de parcial (requiere ${regularCond.minNotaParcial} en todos los componentes). Condición: Libre.`;
                }
            } else if (condicionFinal !== "PROMOCIONADO") { 
                // If not promo and not meeting regular average, it's Libre
                condicionFinal = "LIBRE";
                iconFinal = '❌';
                cssClassFinal = "libre";
                const regularUmbralText = regularCond ? regularCond.minPromedioGeneral : (promoCond ? promoCond.minPromedioGeneral : 'N/A');
                descripcionFinal += `No cumples los requisitos de promedio (requiere ${regularUmbralText}). Condición: Libre.`;
            }
        } else {
            // This case should be caught by !anyParcialEntered or !notasParcialesValidas earlier
            // If it somehow reaches here with NaN, it's an error or no data state.
            // The partial display logic below will handle it.
        }

        // Display result based on whether it's final or partial
        if (!esFinal) {
            let pendingDesc = "";
            if (!isNaN(promedioProvisional)) {
                pendingDesc = `Promedio parcial (ponderado, escala 0-100): ${promedioProvisional.toFixed(2)}. `;
            } else if (anyParcialEntered && !notasParcialesValidas) {
                pendingDesc = `Promedio parcial: No calculable debido a entradas inválidas. `;
            } else { // No valid partials entered yet, or only one that doesn't form a full average
                pendingDesc = `Promedio parcial: Calculando... `;
            }
            pendingDesc += " (Faltan datos o hay correcciones pendientes).";

            let tentativeStatusText = "Estado: Pendiente";
            let tentativeIcon = "⏳"; // Default pending icon
            
            // Provide optimistic icon if possible based on current partial data
            if (!isNaN(promedioProvisional)) {
                if (promoCond && promedioProvisional >= promoCond.minPromedioGeneral && 
                    (!promoCond.hasOwnProperty('minNotaParcial') || minNotaParcial >= promoCond.minNotaParcial)) {
                    tentativeIcon = '🎉'; // Optimistic promo
                } else if (regularCond && promedioProvisional >= regularCond.minPromedioGeneral &&
                           (!regularCond.hasOwnProperty('minNotaParcial') || minNotaParcial >= regularCond.minNotaParcial)) {
                    tentativeIcon = '🏆'; // Optimistic regular
                } else if (anyParcialEntered) { 
                    // If some data entered but doesn't meet regular/promo yet, could be libre
                    tentativeIcon = '❌'; 
                }
            }
            displayResult(tentativeStatusText, pendingDesc, "pendiente", tentativeIcon);
        } else {
            // Final calculation result
            // Prepend "Condición Final: " to the status text for clarity
            displayResult(`Condición Final: ${condicionFinal}`, descripcionFinal, cssClassFinal, iconFinal);
        }
        return; // Stop processing for Algebra
    }

    // --- Specific logic for CTyS ---
// ... rest of code remains same
    if (selectedMateriaKey === 'ctys-2025') {
    // 1. Check Attendance (Prerequisite)
    const asistenciaStr = formData.get('asistencia');
    let asistencia = NaN;
    let asistenciaValida = false; // True if a number is entered (valid or not for passing)
    let asistenciaIngresada = false; // True if field is not empty
    let asistenciaOk = false; // True if >= 75

    if (asistenciaStr !== null && asistenciaStr.trim() !== '') {
        asistenciaIngresada = true;
        asistencia = parseInt(asistenciaStr, 10);
        if (!isNaN(asistencia) && asistencia >= 0 && asistencia <= 100) {
            asistenciaValida = true; // Valid number entered
            if (asistencia < 75) {
                // displayResult("LIBRE", `Asistencia (${asistencia}%) insuficiente (requiere 75%).`, "libre", "❌");
                // return; // Fail fast - defer this to allow partial calculation display
            } else {
                asistenciaOk = true; // Attendance requirement met
            }
        } else {
            // Invalid input, getNota would have alerted if used, manual alert here
            alert('El porcentaje de asistencia debe estar entre 0 y 100.');
            // asistenciaValida remains false
            // displayResult("Error", "Asistencia inválida.", "error", "⚠️");
            // return; // Defer to show partial state
        }
    }

    // 2. Check TP scores (individual TPs)
    let todasNotasTps = [];
    let tpsAprobadosPromo = 0; // Count >= 70
    let tpsAprobadosRegular = 0; // Count >= 60
    let allTpsEntered = true; // Assume all entered until a blank one is found
    let anyTpsEntered = false;
    let tpsValidosGlobal = true; // Assume all TP inputs are valid numbers until proven otherwise

    for (let i = 1; i <= materia.tps; i++) {
        const tpInputName = `tp${i}`;
        const notaTp = getNota(tpInputName); // Uses default 0-100 validation

        if (formData.get(tpInputName) === null || formData.get(tpInputName).trim() === '') {
            allTpsEntered = false; // A TP input is empty
        } else if (isNaN(notaTp)) {
            allTpsEntered = false; // Also counts as not fully entered if invalid
            tpsValidosGlobal = false; // An invalid TP score was entered
        } else {
            anyTpsEntered = true;
            todasNotasTps.push(notaTp);
            if (notaTp >= 70) tpsAprobadosPromo++;
            if (notaTp >= 60) tpsAprobadosRegular++;
        }
    }
    if (!anyTpsEntered && materia.tps > 0) allTpsEntered = false; // If no TPs entered at all

    // 3. Check TIF note (parcial1 for CTyS)
    let notaTif = NaN;
    let tifEntered = false; // If field is not empty
    let tifValido = false; // If field contains a valid number (0-100)
    const tifInputName = 'parcial1'; // Assuming TIF is the first "parcial" for CTyS
    const tifStr = formData.get(tifInputName);

    if (tifStr !== null && tifStr.trim() !== '') {
        tifEntered = true;
        notaTif = getNota(tifInputName); // Uses default 0-100 validation
        if (!isNaN(notaTif)) {
            tifValido = true;
        }
    }
    
    // 4. Decision Logic (Handling Partial States)

    // Critical input errors (invalid numbers entered, not just missing)
    // Asistencia: !asistenciaValida && asistenciaIngresada (entered but not a valid number 0-100)
    // TPs: !tpsValidosGlobal (implies some TP was entered but invalid)
    // TIF: !tifValido && tifEntered (entered but not a valid number 0-100)
    if ((!asistenciaValida && asistenciaIngresada) || !tpsValidosGlobal || (!tifValido && tifEntered)) {
        let errorMsg = "Error: ";
        if (!asistenciaValida && asistenciaIngresada) errorMsg += "Asistencia inválida. ";
        if (!tpsValidosGlobal) errorMsg += "Verifica las notas de los TPs (0-100). ";
        if (!tifValido && tifEntered) errorMsg += "Verifica la nota del TIF (0-100). ";
        displayResult("Error", errorMsg.trim(), "error", "⚠️");
        return;
    }
    
    // Determine if the calculation can be considered "final"
    // For CTyS: asistenciaOk, all TPs entered and valid, TIF entered and valid
    const esFinal = asistenciaOk && allTpsEntered && tpsValidosGlobal && tifValido;

    // --- Build Description and Determine Provisional Status ---
    let descripcion = "";
    let condicionProv = "LIBRE"; // Start assuming Libre
    let iconProv = "❌";
    let faltan = [];

    // Asistencia
    if (asistenciaIngresada) {
        if (asistenciaValida) {
            descripcion += `Asistencia: ${asistencia}% (${asistenciaOk ? 'OK' : 'Insuficiente'}). `;
            if (!asistenciaOk) condicionProv = "LIBRE"; // If entered and insufficient, it's Libre
        } else {
            // Already handled by critical error check
        }
    } else {
        faltan.push("asistencia (>=75%)");
        condicionProv = "LIBRE"; // Cannot be regular/promo without knowing asistencia
    }

    // TPs
    if (materia.tps > 0) {
        descripcion += `TPs ingresados: ${todasNotasTps.length}/${materia.tps}. `;
        if (anyTpsEntered && tpsValidosGlobal) {
            descripcion += `(Regulares [>=60]: ${tpsAprobadosRegular}, Promoción [>=70]: ${tpsAprobadosPromo}). `;
            // Check if any entered TP makes regularity impossible
            if (todasNotasTps.some(n => n < 60)) {
                condicionProv = "LIBRE"; // If any TP < 60, it's Libre
            }
        }
        if (!allTpsEntered || !tpsValidosGlobal) {
            faltan.push(`notas de TPs restantes ${!tpsValidosGlobal ? "o inválidas" : ""}`);
             if (condicionProv !== "LIBRE") condicionProv = "PENDIENTE"; // If not already Libre, mark as pending
        }
         // If all TPs are entered and valid, but not enough for regular
        if (allTpsEntered && tpsValidosGlobal && tpsAprobadosRegular < materia.tps) {
            condicionProv = "LIBRE";
        }
    }


    // TIF
    if (tifEntered) {
        if (tifValido) {
            descripcion += `Nota TIF: ${notaTif}. `;
        } else {
            // Already handled by critical error check
        }
    } else {
        faltan.push("nota TIF");
        if (condicionProv !== "LIBRE") condicionProv = "PENDIENTE";
    }

    // Determine provisional status if not already set to LIBRE or PENDIENTE
    if (condicionProv !== "LIBRE" && condicionProv !== "PENDIENTE") {
        if (asistenciaOk && allTpsEntered && tpsValidosGlobal && tpsAprobadosRegular === materia.tps) {
            // Potential Regular or Promocionado
            if (tifValido) { // TIF is also entered and valid
                if (tpsAprobadosPromo === materia.tps && notaTif >= 60) {
                    condicionProv = "PROMOCIONADO";
                    iconProv = "🎉";
                } else {
                    condicionProv = "REGULAR";
                    iconProv = "🏆";
                }
            } else {
                // TIF not entered or invalid, but other conditions for regular met
                // If TIF is required for promotion, this path leads to regular or pending
                if (tpsAprobadosPromo === materia.tps) { // Potential promo if TIF is good
                     condicionProv = "PENDIENTE"; // Pending TIF for promotion
                     iconProv = "🎉"; // Optimistic icon
                } else {
                     condicionProv = "PENDIENTE"; // Pending TIF for regular
                     iconProv = "🏆"; // Optimistic icon
                }
            }
        } else {
            // Conditions for regular/promo not met even if all data were present
            condicionProv = "LIBRE";
            iconProv = "❌";
        }
    }


    // --- Display Result ---
    if (!esFinal) {
        if (faltan.length > 0) {
            descripcion += ` (Faltan datos: ${faltan.join(', ')}).`;
        }
        
        // If no data entered at all for CTyS specific fields
        if (!asistenciaIngresada && !anyTpsEntered && !tifEntered && materia.tps > 0) {
            displayResult("Estado: Pendiente", "Ingresa asistencia, notas de TP y nota TIF.", "pendiente", "📝");
        } else if (!asistenciaIngresada && !tifEntered && materia.tps === 0) { // Case for CTyS without TPs
             displayResult("Estado: Pendiente", "Ingresa asistencia y nota TIF.", "pendiente", "📝");
        }
        else {
            // Use a generic pending status, icon depends on provisional assessment
            let currentStatusText = "Estado: Pendiente";
            let currentIcon = "⏳";
            let currentClass = "pendiente";

            if (condicionProv === "PROMOCIONADO") { // Optimistically show promo if it's the current path
                currentIcon = "🎉";
            } else if (condicionProv === "REGULAR") { // Optimistically show regular
                currentIcon = "🏆";
            } else if (condicionProv === "LIBRE") { // If current path leads to Libre
                currentIcon = "❌";
            }
            // If it's just "PENDIENTE" from logic, keep icon as ⏳

            displayResult(currentStatusText, descripcion, currentClass, currentIcon);
        }
    } else {
        // Final Calculation (esFinal is true)
        if (tpsAprobadosPromo === materia.tps && tifValido && notaTif >= 60 && asistenciaOk) {
            displayResult("Condición Final: PROMOCIONADO", `¡Felicitaciones! ${descripcion}`, "promocionado", "🎉");
        } else if (tpsAprobadosRegular === materia.tps && asistenciaOk && tifValido) { // tifValido implies TIF >=0, specific threshold for regular might not apply to TIF itself
            displayResult("Condición Final: REGULAR", `${descripcion} Debes rendir final.`, "regular", "🏆");
        }
        else { // Default to Libre if not Promocionado or Regular
            displayResult("Condición Final: LIBRE", `${descripcion}`, "libre", "❌");
        }
    }
    return; // Calculation finished for CTyS
    }


    // --- Final Default Calculation (IF NO SPECIFIC LOGIC MATCHED ABOVE) ---
    // This logic now uses notasParcialesValidas, anyParcialEntered, allParcialesEntered,
    // promedioParcialesDefault (calculated from scaled notes if applicable), minNotaParcial (from scaled notes)
    // which are all correctly populated by the modified common loop.

    // Check for invalid inputs first
    if (!notasParcialesValidas || !tpsDataValid) {
        let errorMsg = "Error: ";
        if (!notasParcialesValidas) errorMsg += "Verifica las notas de los parciales (deben ser números válidos según la escala indicada). ";
        if (!tpsDataValid && materia.tps > 0 && !materia.nombresTps) errorMsg += `Verifica el número de TPs aprobados (debe ser entre 0 y ${materia.tps}).`;
        displayResult("Error", errorMsg.trim(), "error", "⚠️");
        return;
    }

    // Check if at least some data was entered
    const noParcialData = !anyParcialEntered;
    const noTpData = !(tpsEntered && tpsDataValid && materia.tps > 0 && !materia.nombresTps); 

    if (noParcialData && (materia.tps === 0 || (materia.tps > 0 && materia.nombresTps) || noTpData) ) { 
        displayResult("Estado: Pendiente", "Ingresa al menos una nota para calcular un estado parcial.", "pendiente", "📝");
        return;
    }


    const promedioParcialesDefault = sumaPesos !== 0 ? sumaPonderada / sumaPesos : NaN;

    const condPromocion = materia.condiciones.promocion;
    const condRegular = materia.condiciones.regular;

    let condicion = "LIBRE";
    let descripcionDefault = "";
    let cssClass = "libre";
    let icon = '❌';
    
    let esParcialDefault = !allParcialesEntered || (!tpsDataValid && materia.tps > 0 && !materia.nombresTps && !tpsEntered);
    if (materia.tps > 0 && !materia.nombresTps && !tpsEntered) esParcialDefault = true;


    const tpsPorcentajeDefault = (tpsEntered && tpsDataValid && materia.tps > 0 && !materia.nombresTps) ? porcentajeTpsAprobados : NaN;

    let promoPosibleDefault = true; // Assume possible until a condition fails
    if (condPromocion) {
        if (!isNaN(minNotaParcial) && minNotaParcial < condPromocion.minNotaParcial) promoPosibleDefault = false;
        if (!isNaN(promedioParcialesDefault) && promedioParcialesDefault < condPromocion.minPromedioGeneral) promoPosibleDefault = false;
        if (materia.tps > 0 && !materia.nombresTps) {
            if (!isNaN(tpsPorcentajeDefault) && tpsPorcentajeDefault < condPromocion.minTpsAprobados) promoPosibleDefault = false;
            // If all partials are entered but TPs are missing/invalid, promo is not possible if TPs are required for promo
            else if (isNaN(tpsPorcentajeDefault) && allParcialesEntered && condPromocion.minTpsAprobados > 0) promoPosibleDefault = false;
        }

        if (promoPosibleDefault) {
            // If all required fields are present and conditions met for final decision
            if (allParcialesEntered && 
                (materia.tps === 0 || materia.nombresTps || (tpsEntered && tpsDataValid && (isNaN(tpsPorcentajeDefault) || tpsPorcentajeDefault >= (condPromocion.minTpsAprobados || 0) ))) &&
                minNotaParcial >= (condPromocion.minNotaParcial || 0) &&
                promedioParcialesDefault >= (condPromocion.minPromedioGeneral || 0)
            ) {
                 condicion = "PROMOCIONADO";
                 cssClass = "promocionado";
                 icon = '🎉';
            } else if (esParcialDefault) { // Still possible if partial, keep optimistic
                 condicion = "PROMOCIONADO"; 
                 cssClass = "promocionado"; 
                 icon = '🎉';
            } else { // All data entered, but conditions not met
                promoPosibleDefault = false; 
            }
        }
    } else {
        promoPosibleDefault = false;
    }

    let regularPosibleDefault = true;
    if (!promoPosibleDefault && condRegular) { // Check regular only if not promo
        if (!isNaN(minNotaParcial) && minNotaParcial < condRegular.minNotaParcial) regularPosibleDefault = false;
        if (!isNaN(promedioParcialesDefault) && promedioParcialesDefault < condRegular.minPromedioGeneral) regularPosibleDefault = false;
        if (materia.tps > 0 && !materia.nombresTps) { 
             if (!isNaN(tpsPorcentajeDefault) && tpsPorcentajeDefault < condRegular.minTpsAprobados) regularPosibleDefault = false;
             else if (isNaN(tpsPorcentajeDefault) && allParcialesEntered && condRegular.minTpsAprobados > 0) regularPosibleDefault = false;
        }

        if (regularPosibleDefault) {
            if (allParcialesEntered &&
                (materia.tps === 0 || materia.nombresTps || (tpsEntered && tpsDataValid && (isNaN(tpsPorcentajeDefault) || tpsPorcentajeDefault >= (condRegular.minTpsAprobados || 0)))) &&
                minNotaParcial >= (condRegular.minNotaParcial || 0) &&
                promedioParcialesDefault >= (condRegular.minPromedioGeneral || 0)
            ) {
                condicion = "REGULAR";
                cssClass = "regular";
                icon = '🏆';
            } else if (esParcialDefault) { 
                condicion = "REGULAR"; 
                cssClass = "regular"; 
                icon = '🏆';
            } else {
                regularPosibleDefault = false;
            }
        }
    } else if (promoPosibleDefault) { 
        regularPosibleDefault = false;
    }


    if (!promoPosibleDefault && !regularPosibleDefault) {
        condicion = "LIBRE";
        cssClass = "libre";
        icon = '❌';
    }


    if (!isNaN(promedioParcialesDefault)) {
        descripcionDefault += `Promedio parcial (escalado 0-100): ${promedioParcialesDefault.toFixed(2)}. `;
    }
    if (minNotaParcial !== Infinity && minNotaParcial !== -Infinity) { // Check for actual min value
        descripcionDefault += `Nota mínima parcial (escalada 0-100): ${minNotaParcial}. `;
    }
    if (materia.tps > 0 && !materia.nombresTps && tpsEntered && tpsDataValid) {
        descripcionDefault += `TPs aprobados: ${tpsAprobadosNum}/${materia.tps}. `;
    } else if (materia.tps > 0 && !materia.nombresTps && tpsEntered && !tpsDataValid) {
        descripcionDefault += `TPs aprobados: Inválido. `;
    }


    if (esParcialDefault) {
        condicion = "Estado: Pendiente"; 
        let faltanDefault = [];
        if (!allParcialesEntered) faltanDefault.push("notas de parciales");
        if (materia.tps > 0 && !materia.nombresTps && (!tpsEntered || !tpsDataValid)) faltanDefault.push("cantidad de TPs aprobados (válida)");
        
        if (faltanDefault.length > 0) {
            descripcionDefault += ` (Faltan datos: ${faltanDefault.join(', ')}).`;
        } else if (!notasParcialesValidas) { 
             descripcionDefault += ` (Corregir entradas inválidas).`;
        }
        cssClass = "pendiente"; 
        // Icon remains based on optimistic provisional status (promo, regular, or libre if already determined by the logic above)
    } else {
        if (condicion === "PROMOCIONADO") descripcionDefault = `¡Felicitaciones! Condición Final: Promocionado. ${descripcionDefault} Cumples todos los requisitos.`;
        else if (condicion === "REGULAR") descripcionDefault = `Condición Final: Regularizado. ${descripcionDefault} Debes rendir final.`;
        else descripcionDefault = `Condición Final: Libre. ${descripcionDefault}`; 
    }

    displayResult(condicion, descripcionDefault, cssClass, icon);
}

// --- Initialization using async/await ---  
// ... rest of code remains same
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
