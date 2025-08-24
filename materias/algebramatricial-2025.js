class AlgebraMatricial2025 extends BaseMateria {
    calcular() {
        // Obtener las notas de cada componente
        const tpeUnidad1 = this.getNota('parcial1', 0, 100);
        const grupalUnidad2 = this.getNota('parcial2', 0, 100);
        const tpeUnidad3 = this.getNota('parcial3', 0, 100);
        const grupalUnidad4 = this.getNota('parcial4', 0, 100);
        const grupalFinal = this.getNota('parcial5', 0, 100);

        // Verificar si hay errores de validación
        const notasIngresadas = [tpeUnidad1, grupalUnidad2, tpeUnidad3, grupalUnidad4, grupalFinal];
        const hayErrores = notasIngresadas.some(nota => 
            nota !== nota && !isNaN(parseFloat(this.formData.get(`parcial${notasIngresadas.indexOf(nota) + 1}`)))
        );

        if (hayErrores) {
            this.displayResult("Error", "Verifica que todas las notas estén entre 0 y 100.", "error", "⚠️");
            return;
        }

        // Determinar qué datos están disponibles
        const tienePaso1Completo = !isNaN(tpeUnidad1) && !isNaN(grupalUnidad2);
        const tienePaso2Completo = !isNaN(tpeUnidad3) && !isNaN(grupalUnidad4);
        const tieneGrupalFinal = !isNaN(grupalFinal);

        // Si no hay ningún dato, mostrar mensaje inicial
        if (isNaN(tpeUnidad1) && isNaN(grupalUnidad2) && isNaN(tpeUnidad3) && 
            isNaN(grupalUnidad4) && isNaN(grupalFinal)) {
            this.displayResult("Estado: Pendiente", 
                "Ingresa las notas para evaluar tu progreso por pasos.", "pendiente", "📝");
            return;
        }

        // Evaluar pasos
        const resultadoPaso1 = this.evaluarPaso(tpeUnidad1, grupalUnidad2, 1);
        const resultadoPaso2 = this.evaluarPaso(tpeUnidad3, grupalUnidad4, 2);

        // Mostrar estado según datos disponibles
        this.mostrarEstado(resultadoPaso1, resultadoPaso2, tienePaso1Completo, 
                          tienePaso2Completo, tieneGrupalFinal, tpeUnidad1, 
                          tpeUnidad3, grupalFinal);
    }

    evaluarPaso(nota1, nota2, numeroPaso) {
        if (isNaN(nota1) || isNaN(nota2)) {
            return { completo: false, promedio: NaN, aprobado: false };
        }

        const promedio = (nota1 + nota2) / 2;
        const aprobado = promedio >= 70;

        return {
            completo: true,
            promedio: promedio,
            aprobado: aprobado,
            nota1: nota1,
            nota2: nota2
        };
    }

    mostrarEstado(paso1, paso2, tienePaso1, tienePaso2, tieneGrupalFinal, 
                  tpeUnidad1, tpeUnidad3, grupalFinal) {
        
        let descripcion = "";
        let condicion = "";
        let cssClass = "";
        let icon = "";

        // Construir descripción de pasos
        if (paso1.completo) {
            descripcion += `<strong>Paso 1:</strong> Promedio ${paso1.promedio.toFixed(1)} `;
            descripcion += paso1.aprobado ? "(✅ Aprobado)" : "(❌ No aprobado - Recuperatorio disponible)";
            descripcion += "<br>";
        }

        if (paso2.completo) {
            descripcion += `<strong>Paso 2:</strong> Promedio ${paso2.promedio.toFixed(1)} `;
            descripcion += paso2.aprobado ? "(✅ Aprobado)" : "(❌ No aprobado)";
            descripcion += "<br>";
        }

        // Determinar estado final
        const paso1Aprobado = paso1.completo && paso1.aprobado;
        const paso2Aprobado = paso2.completo && paso2.aprobado;

        // Si ambos pasos están reprobados, queda libre inmediatamente
        if (paso1.completo && paso2.completo && !paso1Aprobado && !paso2Aprobado) {
            condicion = "LIBRE";
            descripcion += "<strong>Estado:</strong> Ambos pasos reprobados. No hay recuperatorio disponible.";
            cssClass = "libre";
            icon = "❌";
        }
        // Si tiene el trabajo grupal final y al menos un paso aprobado
        else if (tieneGrupalFinal && (paso1Aprobado || paso2Aprobado)) {
            // Verificar que tenga las notas necesarias para el promedio final
            if (!isNaN(tpeUnidad1) && !isNaN(tpeUnidad3) && !isNaN(grupalFinal)) {
                const promedioFinal = (tpeUnidad1 + tpeUnidad3 + grupalFinal) / 3;
                descripcion += `<strong>Promedio Final:</strong> ${promedioFinal.toFixed(2)}<br>`;

                if (promedioFinal >= 75) {
                    condicion = "PROMOCIONADO";
                    descripcion += "<strong>¡Felicitaciones!</strong> Cumples todos los requisitos para la promoción.";
                    cssClass = "promocionado";
                    icon = "🎉";
                } else if (promedioFinal >= 50) {
                    condicion = "REGULAR";
                    descripcion += "<strong>Condición:</strong> Regular. Debes rendir examen final.";
                    cssClass = "regular";
                    icon = "🏆";
                } else {
                    condicion = "LIBRE";
                    descripcion += "<strong>Condición:</strong> Libre. Promedio final insuficiente.";
                    cssClass = "libre";
                    icon = "❌";
                }
            } else {
                condicion = "Estado: Pendiente";
                descripcion += "<strong>Faltan datos:</strong> Se necesitan ambos TPE individuales para calcular el promedio final.";
                cssClass = "pendiente";
                icon = "⏳";
            }
        }
        // Evaluación parcial
        else {
            condicion = "Estado: Pendiente";
            
            if (!tienePaso1 && !tienePaso2) {
                descripcion += "<strong>Faltan datos:</strong> Completa al menos un paso para evaluar tu progreso.";
            } else if (paso1Aprobado || paso2Aprobado) {
                descripcion += "<strong>Progreso:</strong> Al menos un paso aprobado. ";
                if (!tieneGrupalFinal) {
                    descripcion += "Falta el Trabajo Grupal Final.";
                }
            } else if (paso1.completo && !paso1Aprobado) {
                descripcion += "<strong>Atención:</strong> Paso 1 reprobado. Tienes una instancia de recuperatorio disponible.";
            } else if (paso2.completo && !paso2Aprobado) {
                descripcion += "<strong>Atención:</strong> Paso 2 reprobado. ";
                if (paso1Aprobado) {
                    descripcion += "Tienes una instancia de recuperatorio disponible.";
                } else {
                    descripcion += "Si también repruebas el Paso 1, quedarás libre.";
                }
            }
            
            cssClass = "pendiente";
            icon = "⏳";
        }

        this.displayResult(condicion, descripcion, cssClass, icon);
    }
}