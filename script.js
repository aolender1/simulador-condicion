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
    for (let i = 1; i <= materia.parciales; i++) {
        const parcialGroup = document.createElement('div');
        parcialGroup.className = 'form-group';

        // Use custom names if available
        const parcialName = materia.nombresParciales && materia.nombresParciales[i - 1]
            ? materia.nombresParciales[i - 1]
            : `Nota Parcial ${i}`;

        parcialGroup.innerHTML = `
        <label for="parcial${i}">${parcialName}:</label>
        <input type="number" id="parcial${i}" name="parcial${i}" min="0" max="100" step="1">
        `; // Removed 'required'
        dynamicInputsDiv.appendChild(parcialGroup);
    }

    // Reset results text and enable button when changing subject
    condicionFinalP.textContent = 'Completa los datos para calcular.';
    submitButton.disabled = false; // Enable button
    submitButton.textContent = 'Calcular Condición';
}

// Modifica la función calcularCondicion para manejar cálculo parcial y nuevo régimen de Calculo I
function calcularCondicion(event) {
    event.preventDefault(); // Prevent form submission

    const selectedMateriaKey = materiaSelect.value;
    if (!selectedMateriaKey) return; // Exit if no subject is selected

    const materia = materiasData[selectedMateriaKey];
    const formData = new FormData(form);

    // Helper function to get and parse grade, returns NaN if invalid/empty
    const getNota = (name) => {
        const notaStr = formData.get(name);
        if (notaStr === null || notaStr.trim() === '') {
            return NaN; // Not entered
        }
        const nota = parseFloat(notaStr); // Use parseFloat for potential decimals
        // Allow 0 as a valid grade, check for NaN explicitly
        if (isNaN(nota) || nota < 0 || nota > 100) {
            // Display alert but return NaN to indicate invalid input for logic
            alert(`La nota para "${name}" debe ser un número entre 0 y 100.`);
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
    let notasParciales = [];
    let pesosUsados = [];
    let sumaPonderada = 0;
    let sumaPesos = 0;
    let minNotaParcial = Infinity;
    let notasParcialesValidas = true; // Tracks if any input was invalid
    let allParcialesEntered = true; // Tracks if ALL partial fields have a value
    let anyParcialEntered = false; // Tracks if AT LEAST ONE partial field has a value

    // Process partial exam scores (common logic)
    for (let i = 1; i <= materia.parciales; i++) {
        const nota = getNota(`parcial${i}`);
        // Use custom weights if defined, otherwise equal weight
        const peso = materia.pesos && materia.pesos[i-1] ? materia.pesos[i-1] : (materia.parciales > 0 ? 1/materia.parciales : 0);

        if (isNaN(nota)) {
            allParcialesEntered = false;
            const notaStr = formData.get(`parcial${i}`);
            if (notaStr !== null && notaStr.trim() !== '') {
                notasParcialesValidas = false; // Invalid input detected
            }
            continue; // Skip this grade
        } else {
            anyParcialEntered = true;
            notasParciales.push(nota);
            pesosUsados.push(peso);
            sumaPonderada += nota * peso;
            sumaPesos += peso;
            minNotaParcial = Math.min(minNotaParcial, nota);
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
            tpsDataValid = false; // Cannot calculate final if required but missing
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
                tpsDataValid = true; // Valid TP data
            }
        }
    } else {
        // If no TPs or named TPs, consider TP part 'entered' and 'valid' for general logic purposes
        tpsEntered = true;
        tpsDataValid = true;
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


    // --- Specific logic for algebra (MODIFIED FOR PARTIAL CALCULATION) ---
    if (selectedMateriaKey === 'introalgebra-2025') {
        // Check for invalid inputs (parciales only for Algebra)
        // Use the common 'notasParcialesValidas' flag calculated earlier
        if (!notasParcialesValidas) {
            displayResult("Error", "Verifica las notas de los parciales (deben ser números entre 0 y 100).", "error", "⚠️");
            return;
        }

        // Check if at least one partial was entered
        // Use the common 'anyParcialEntered' flag calculated earlier
        if (!anyParcialEntered) {
            displayResult("Estado: Pendiente", "Ingresa al menos una nota de parcial para calcular.", "pendiente", "📝");
            return;
        }

        // Calculate provisional weighted average
        // Use common variables 'sumaPonderada' and 'sumaPesos' calculated earlier
        const promedioProvisional = sumaPesos > 0 ? sumaPonderada / sumaPesos : NaN;

        // Determine if the calculation is final or partial (only based on parciales for Algebra)
        // Use common 'allParcialesEntered' flag
        const esFinal = allParcialesEntered && notasParcialesValidas;

        // Determine provisional condition (Regular or Libre for Algebra - based ONLY on average)
        let condicionProv = "LIBRE"; // Default to Libre
        let iconProv = '❌';
        // Check if Regularity is met or still possible
        if (isNaN(promedioProvisional) || promedioProvisional >= 60) {
             // If average is not yet calculable (NaN) OR it's already >= 60
             condicionProv = "REGULAR"; // Tentative Regular
             iconProv = '🏆';
        }
        // If we *have* calculated value and it's *below* threshold, it's definitely Libre
        if (!isNaN(promedioProvisional) && promedioProvisional < 60) {
            condicionProv = "LIBRE";
            iconProv = '❌';
        }

        // Build description message (ONLY average for Algebra)
        let descripcion = "";
        if (!isNaN(promedioProvisional)) {
            // Display the calculated provisional average
            descripcion += `Promedio parcial (ponderado): ${promedioProvisional.toFixed(2)}. `;
        } else {
             // This case should ideally not happen if anyParcialEntered is true and valid
             descripcion += `Promedio parcial: Calculando... `;
        }

        // Display result based on whether it's final or partial
        if (!esFinal) {
            // Add message indicating missing data
            descripcion += " (Faltan datos: notas de parciales restantes).";
            // *** Use "Estado: Pendiente" as the main status text ***
            // The description already implies the provisional condition (e.g., average >= 60 suggests Regular is possible)
            displayResult("Estado: Pendiente", descripcion, "pendiente", "⏳");
        } else {
            // Final calculation result
            if (condicionProv === "REGULAR") {
                 // Final Regular status
                 displayResult("REGULAR", `Condición Final: Regular. ${descripcion} Debes rendir final.`, "regular", "🏆");
            } else {
                 // Final Libre status
                 displayResult("LIBRE", `Condición Final: Libre. ${descripcion} No cumples los requisitos (promedio < 60).`, "libre", "❌");
            }
        }
        return; // Stop processing for Algebra
    }

    // --- Specific logic for CTyS ---
    // ... (CTyS logic remains the same as the previous correct version) ...
    if (selectedMateriaKey === 'ctys-2025') {
        // 1. Check Attendance (Prerequisite)
        const asistenciaStr = formData.get('asistencia');
        let asistencia = NaN;
        let asistenciaValida = false;
        let asistenciaOk = false;
        if (asistenciaStr !== null && asistenciaStr.trim() !== '') {
            asistencia = parseInt(asistenciaStr, 10);
            if (!isNaN(asistencia) && asistencia >= 0 && asistencia <= 100) {
                asistenciaValida = true;
                if (asistencia < 75) {
                    displayResult("LIBRE", `Asistencia (${asistencia}%) insuficiente (requiere 75%).`, "libre", "❌");
                    return; // Fail fast
                } else {
                    asistenciaOk = true; // Attendance requirement met
                }
            } else {
                alert('El porcentaje de asistencia debe estar entre 0 y 100.');
                displayResult("Error", "Asistencia inválida.", "error", "⚠️");
                return; // Stop if invalid input
            }
        } else {
            // Asistencia not entered yet - Show pending but allow proceeding if other data exists
            asistenciaValida = false; // Not valid for final calc yet
        }

        // 2. Check TP scores (individual TPs)
        let todasNotasTps = [];
        let tpsAprobadosPromo = 0; // Count >= 70
        let tpsAprobadosRegular = 0; // Count >= 60
        let allTpsEntered = true;
        let anyTpsEntered = false;
        let tpsValidos = true; // Assume valid until proven otherwise

        for (let i = 1; i <= materia.tps; i++) {
            const notaTp = getNota(`tp${i}`); // Use helper function
            if (isNaN(notaTp)) {
                allTpsEntered = false;
                const notaTpStr = formData.get(`tp${i}`);
                if (notaTpStr !== null && notaTpStr.trim() !== '') {
                    tpsValidos = false; // Invalid input detected
                }
                // Continue checking other TPs
            } else {
                anyTpsEntered = true;
                todasNotasTps.push(notaTp);
                if (notaTp >= 70) tpsAprobadosPromo++;
                if (notaTp >= 60) tpsAprobadosRegular++;
                // Check if any entered TP makes regularity impossible
                if (notaTp < 60) {
                    // If even one TP is below 60, Regular/Promo is impossible
                    // We can potentially show Libre earlier, but let's wait for all inputs or explicit check
                }
            }
        }

        // 3. Check TIF note (parcial1 for CTyS)
        const notaTif = getNota('parcial1'); // Use helper function
        let tifEntered = !isNaN(notaTif);
        let tifValido = tifEntered; // Assumes getNota handles range validation
        if (!tifEntered) {
            const notaTifStr = formData.get('parcial1');
            if (notaTifStr !== null && notaTifStr.trim() !== '') {
                tifValido = false; // Invalid input for TIF
            }
        }

        // 4. Decision Logic (Handling Partial States)

        // Handle critical errors first
        if (!tpsValidos || !tifValido || (!asistenciaValida && (anyTpsEntered || tifEntered))) {
            // Added check: if asistencia is invalid but other data was entered, it's an error state for calculation
            let errorMsg = "Error: ";
            if (!asistenciaValida && (anyTpsEntered || tifEntered)) errorMsg += "Asistencia inválida o no ingresada. ";
            if (!tpsValidos) errorMsg += "Verifica las notas de los TPs (0-100). ";
            if (!tifValido) errorMsg += "Verifica la nota del TIF (0-100). ";
            displayResult("Error", errorMsg.trim(), "error", "⚠️");
            return;
        }

        // Determine if the calculation is final or partial
        const esFinal = asistenciaOk && allTpsEntered && tifEntered && tpsValidos && tifValido;

        // --- Build Description and Determine Provisional Status ---
        let descripcion = "";
        let condicionProv = "LIBRE"; // Start assuming Libre
        let iconProv = "❌";
        let faltan = [];

        if (asistenciaOk) {
            descripcion += `Asistencia OK (${asistencia}%). `;
        } else if (asistenciaValida) {
            descripcion += `Asistencia OK (${asistencia}%). `; // Should have been caught earlier if < 75
        } else {
            faltan.push("asistencia (>=75%)");
        }

        descripcion += `TPs ingresados: ${todasNotasTps.length}/${materia.tps}. `;
        if (anyTpsEntered) {
            descripcion += `(Regulares [>=60]: ${tpsAprobadosRegular}, Promoción [>=70]: ${tpsAprobadosPromo}). `;
        }
        if (!allTpsEntered) {
            faltan.push("notas de TPs restantes");
        }

        if (tifEntered && tifValido) {
            descripcion += `Nota TIF: ${notaTif}. `;
        } else if (tifEntered && !tifValido) {
            // Error already handled above
        } else {
            faltan.push("nota TIF");
        }

        // Determine provisional status based on available valid data
        if (asistenciaOk) {
            // Check if Regularity is still possible or achieved provisionally
            // Need ALL TPs >= 60 eventually. Check if any entered TP makes it impossible.
            const algunTpInsuficiente = todasNotasTps.some(n => n < 60);

            if (!algunTpInsuficiente) { // If all entered TPs are >= 60
                condicionProv = "REGULAR"; // Provisionally Regular
                iconProv = "🏆";

                // Check if Promotion is still possible or achieved provisionally
                // Need ALL TPs >= 70 eventually AND TIF >= 60
                const todosTpsPromoHastaAhora = todasNotasTps.length > 0 && tpsAprobadosPromo === todasNotasTps.length; // All *entered* TPs are >= 70

                if (todosTpsPromoHastaAhora && tifEntered && notaTif >= 60) {
                    condicionProv = "PROMOCIONADO"; // Provisionally Promocionado
                    iconProv = "🎉";
                } else if (todosTpsPromoHastaAhora && !tifEntered) {
                    // Still potentially promocionado if TIF is entered >= 60
                    condicionProv = "PROMOCIONADO"; // Tentative
                    iconProv = "🎉";
                } else if (tifEntered && notaTif < 60) {
                    // If TIF is entered < 60, promotion is impossible
                    condicionProv = "REGULAR"; // Back to regular
                    iconProv = "🏆";
                } else if (!todosTpsPromoHastaAhora && todasNotasTps.length > 0) {
                    // If any entered TP is < 70, promotion is impossible
                    condicionProv = "REGULAR"; // Back to regular
                    iconProv = "🏆";
                }
            } else {
                // If any entered TP is < 60, final status must be Libre
                condicionProv = "LIBRE";
                iconProv = "❌";
            }
        } else {
            // If attendance is not OK (or not entered), provisional is Libre
            condicionProv = "LIBRE";
            iconProv = "❌";
        }


        // --- Display Result ---
        if (!esFinal) {
            // Add missing items to description
            if (faltan.length > 0) {
                descripcion += ` (Faltan datos: ${faltan.join(', ')}).`;
            } else if (!asistenciaOk && asistenciaValida) {
                // Should not happen if < 75 check works, but safety
                descripcion += " (Asistencia insuficiente).";
            }
            // If no data entered at all
            if (!asistenciaValida && !anyTpsEntered && !tifEntered) {
                displayResult("Estado: Pendiente", "Ingresa asistencia, notas de TP y nota TIF.", "pendiente", "📝");
            } else {
                // *** Use "Estado: Pendiente" instead of "Estado Parcial: ..." ***
                displayResult("Estado: Pendiente", descripcion, "pendiente", "⏳"); // Use pending style
            }
        } else {
            // Final Calculation (logic is implicitly covered by provisional checks when esFinal is true)
            if (tpsAprobadosRegular < materia.tps) { // Final check: Did *all* TPs meet the regular threshold?
                displayResult("LIBRE", `Condición Final: Libre. Asistencia OK, pero no aprobaste todos los TPs con 60% o más (Aprobados >= 60: ${tpsAprobadosRegular}/${materia.tps}). ${descripcion}`, "libre", "❌");
            } else if (tpsAprobadosPromo === materia.tps && notaTif >= 60) { // Final check: All TPs >= 70 and TIF >= 60?
                displayResult("PROMOCIONADO", `¡Felicitaciones! Condición Final: Promocionado. ${descripcion}`, "promocionado", "🎉");
            } else { // Otherwise, it must be Regular
                displayResult("REGULAR", `Condición Final: Regular. Asistencia OK, todos los TPs >= 60%. Debes rendir final. ${descripcion}`, "regular", "🏆");
            }
        }
        return; // Calculation finished for CTyS
    }


    // --- Final Default Calculation (IF NO SPECIFIC LOGIC MATCHED ABOVE) ---
    // ... (Default logic remains the same) ...
    // Check for invalid inputs first
    if (!notasParcialesValidas || !tpsDataValid) { // tpsDataValid check relevant for count-based TPs
        let errorMsg = "Error: ";
        if (!notasParcialesValidas) errorMsg += "Verifica las notas de los parciales (deben ser números entre 0 y 100). ";
        // Only add TP error if TPs are required and count-based
        if (!tpsDataValid && materia.tps > 0 && !materia.nombresTps) errorMsg += `Verifica el número de TPs aprobados (debe ser entre 0 y ${materia.tps}).`;
        displayResult("Error", errorMsg.trim(), "error", "⚠️");
        return;
    }

    // Check if at least some data was entered (relevant for count-based TPs)
    if (!anyParcialEntered && !(tpsEntered && materia.tps > 0 && !materia.nombresTps)) {
        displayResult("Estado: Pendiente", "Ingresa al menos una nota para calcular un estado parcial.", "pendiente", "📝");
        return;
    }

    // Calculate weighted average based on entered notes
    const promedioParcialesDefault = sumaPesos !== 0 ? sumaPonderada / sumaPesos : NaN; // Average of entered grades

    // Condition logic (default)
    const condPromocion = materia.condiciones.promocion;
    const condRegular = materia.condiciones.regular;

    let condicion = "LIBRE";
    let descripcionDefault = "";
    let cssClass = "libre";
    let icon = '❌';
    // Is the result partial? (Relevant for count-based TPs)
    let esParcialDefault = !allParcialesEntered || (!tpsEntered && materia.tps > 0 && !materia.nombresTps);

    // Determine provisional condition based on available data
    // Use NaN for percentage if TPs not entered/valid yet (for count-based TPs)
    const tpsPorcentajeDefault = (tpsEntered && tpsDataValid && materia.tps > 0 && !materia.nombresTps) ? porcentajeTpsAprobados : NaN;

    // Check for Promotion (default) - Allow check even if partial
    if (condPromocion &&
        (minNotaParcial === Infinity || minNotaParcial >= condPromocion.minNotaParcial) && // Check min grade among entered ones (or if none entered yet)
        (isNaN(promedioParcialesDefault) || promedioParcialesDefault >= condPromocion.minPromedioGeneral) && // Check average of entered ones (or if none entered yet)
        (isNaN(tpsPorcentajeDefault) || tpsPorcentajeDefault >= condPromocion.minTpsAprobados)) { // Check TPs if entered/applicable

        // If any calculated value is *below* the threshold, it cannot be promotion
        if (!isNaN(minNotaParcial) && minNotaParcial < condPromocion.minNotaParcial) {
            condicion = "LIBRE"; // Will be caught by Regular check or default to Libre
        } else if (!isNaN(promedioParcialesDefault) && promedioParcialesDefault < condPromocion.minPromedioGeneral) {
            condicion = "LIBRE";
        } else if (!isNaN(tpsPorcentajeDefault) && tpsPorcentajeDefault < condPromocion.minTpsAprobados) {
            condicion = "LIBRE";
        } else {
            condicion = "PROMOCIONADO"; // Tentative Promotion
            cssClass = "promocionado";
            icon = '🎉';
        }
    }

    // Check for Regular status (default) - Allow check even if partial (if not already tentatively promoted)
    if (condicion !== "PROMOCIONADO" && condRegular &&
        (minNotaParcial === Infinity || minNotaParcial >= condRegular.minNotaParcial) && // Check min grade among entered ones
        (isNaN(promedioParcialesDefault) || promedioParcialesDefault >= condRegular.minPromedioGeneral) && // Check average of entered ones
        (isNaN(tpsPorcentajeDefault) || tpsPorcentajeDefault >= condRegular.minTpsAprobados)) { // Check TPs if entered/applicable

        // If any calculated value is *below* the threshold, it cannot be regular
        if (!isNaN(minNotaParcial) && minNotaParcial < condRegular.minNotaParcial) {
            condicion = "LIBRE";
        } else if (!isNaN(promedioParcialesDefault) && promedioParcialesDefault < condRegular.minPromedioGeneral) {
            condicion = "LIBRE";
        } else if (!isNaN(tpsPorcentajeDefault) && tpsPorcentajeDefault < condRegular.minTpsAprobados) {
            condicion = "LIBRE";
        } else {
            condicion = "REGULAR"; // Tentative Regular
            cssClass = "regular";
            icon = '🏆';
        }
    }

    // If neither Promo nor Regular criteria are met (tentatively), it's Libre
    if (condicion !== "PROMOCIONADO" && condicion !== "REGULAR") {
        condicion = "LIBRE";
        cssClass = "libre";
        icon = '❌';
    }

    // Build description (default)
    if (!isNaN(promedioParcialesDefault)) {
        descripcionDefault += `Promedio parcial: ${promedioParcialesDefault.toFixed(2)}. `;
    }
    if (minNotaParcial !== Infinity) {
        descripcionDefault += `Nota mínima parcial: ${minNotaParcial}. `;
    }
    // Add TP info only if applicable and entered (count-based)
    if (materia.tps > 0 && !materia.nombresTps && tpsEntered && tpsDataValid) {
        descripcionDefault += `TPs aprobados: ${tpsAprobadosNum}/${materia.tps}. `;
    }

    // Add partial indicator if needed
    if (esParcialDefault) {
        // *** Use "Estado: Pendiente" as the main status text ***
        condicion = "Estado: Pendiente"; // Changed from "Estado Parcial: ..."
        let faltanDefault = [];
        if (!allParcialesEntered) faltanDefault.push("notas de parciales");
        if (!tpsEntered && materia.tps > 0 && !materia.nombresTps) faltanDefault.push("cantidad de TPs aprobados");
        if (faltanDefault.length > 0) {
            descripcionDefault += ` (Faltan datos: ${faltanDefault.join(', ')}).`;
        }
        cssClass = "pendiente"; // Use 'pendiente' style for partial results
        // Keep original icon (Promo/Reg/Libre) but use pending style
    } else {
        // If not partial, add a final confirmation message
        if (condicion === "PROMOCIONADO") descripcionDefault = `¡Felicitaciones! Condición Final: Promocionado. ${descripcionDefault} Cumples todos los requisitos.`;
        else if (condicion === "REGULAR") descripcionDefault = `Condición Final: Regularizado. ${descripcionDefault} Debes rendir final.`;
        else descripcionDefault = `Condición Final: Libre. ${descripcionDefault}`;
    }

    // Display the result (default logic)
    displayResult(condicion, descripcionDefault, cssClass, icon);
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