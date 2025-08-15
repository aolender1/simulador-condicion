class IntroAlgebra2025 extends BaseMateria {
    calcular() {
        let notasParciales = [];
        let pesosUsados = [];
        let minNotaParcial = Infinity;
        let notasValidas = true;
        let allParcialesEntered = true;
        let anyParcialEntered = false;

        // Procesar parciales con escalas específicas
        for (let i = 1; i <= this.data.parciales; i++) {
            const inputName = `parcial${i}`;
            let rawNota, scaledNota;

            // Escala específica: Individual (impar) 0-10, Grupal (par) 0-80
            if (i % 2 !== 0) { // Impar - Individual
                rawNota = this.getNota(inputName, 0, 10);
                if (!isNaN(rawNota)) {
                    scaledNota = rawNota * 10; // Escalar a 0-100
                }
            } else { // Par - Grupal
                rawNota = this.getNota(inputName, 0, 80);
                if (!isNaN(rawNota)) {
                    scaledNota = rawNota * 1.25; // Escalar a 0-100
                }
            }

            const peso = this.data.pesos?.[i-1] || (1/this.data.parciales);

            if (isNaN(rawNota)) {
                allParcialesEntered = false;
                if (this.formData.get(inputName)?.trim()) {
                    notasValidas = false;
                }
            } else {
                anyParcialEntered = true;
                notasParciales.push(scaledNota);
                pesosUsados.push(peso);
                minNotaParcial = Math.min(minNotaParcial, scaledNota);
            }
        }

        if (!notasValidas) {
            this.displayResult("Error", "Verifica las notas de los parciales según la escala indicada.", "error", "⚠️");
            return;
        }

        if (!anyParcialEntered) {
            this.displayResult("Estado: Pendiente", "Ingresa al menos una nota de parcial para calcular.", "pendiente", "📝");
            return;
        }

        const promedio = this.calcularPromedioPonderado(notasParciales, pesosUsados);
        const esFinal = allParcialesEntered && notasValidas;

        this.determinarCondicion(promedio, minNotaParcial, esFinal);
    }

    determinarCondicion(promedio, minNotaParcial, esFinal) {
        const promoCond = this.data.condiciones.promocion;
        const regularCond = this.data.condiciones.regular;

        let condicion = "LIBRE";
        let icon = '❌';
        let cssClass = "libre";
        let descripcion = `Promedio (ponderado, escala 0-100): ${promedio.toFixed(2)}. `;

        // Verificar promoción
        if (promoCond && promedio >= promoCond.minPromedioGeneral) {
            if (!promoCond.hasOwnProperty('minNotaParcial') || minNotaParcial >= promoCond.minNotaParcial) {
                condicion = "PROMOCIONADO";
                icon = '🎉';
                cssClass = "promocionado";
                descripcion += "¡Felicitaciones! Cumples los requisitos para promocionar.";
            } else {
                descripcion += `No promociona por nota mínima de parcial (requiere ${promoCond.minNotaParcial}). `;
            }
        }

        // Verificar regular si no promocionó
        if (condicion !== "PROMOCIONADO" && regularCond && promedio >= regularCond.minPromedioGeneral) {
            if (!regularCond.hasOwnProperty('minNotaParcial') || minNotaParcial >= regularCond.minNotaParcial) {
                condicion = "REGULAR";
                icon = '🏆';
                cssClass = "regular";
                descripcion += "Condición: Regular. Debes rendir final.";
            } else {
                descripcion += `No regulariza por nota mínima de parcial (requiere ${regularCond.minNotaParcial}). Condición: Libre.`;
            }
        } else if (condicion !== "PROMOCIONADO") {
            const umbral = regularCond?.minPromedioGeneral || promoCond?.minPromedioGeneral || 'N/A';
            descripcion += `No cumples los requisitos de promedio (requiere ${umbral}). Condición: Libre.`;
        }

        if (!esFinal) {
            this.displayResult("Estado: Pendiente", `Promedio parcial: ${promedio.toFixed(2)} (Faltan datos).`, "pendiente", icon);
        } else {
            this.displayResult(`Condición Final: ${condicion}`, descripcion, cssClass, icon);
        }
    }
}