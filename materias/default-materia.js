class DefaultMateria extends BaseMateria {
    calcular() {
        // Variables para lógica común
        let notasParciales = [];
        let pesosUsados = [];
        let sumaPonderada = 0;
        let sumaPesos = 0;
        let minNotaParcial = Infinity;
        let notasParcialesValidas = true;
        let allParcialesEntered = true;
        let anyParcialEntered = false;

        // Procesar notas de parciales
        for (let i = 1; i <= this.data.parciales; i++) {
            const inputName = `parcial${i}`;
            const rawNota = this.getNota(inputName);
            const peso = this.data.pesos?.[i-1] || (1/this.data.parciales);

            if (isNaN(rawNota)) {
                allParcialesEntered = false;
                const notaStr = this.formData.get(inputName);
                if (notaStr !== null && notaStr.trim() !== '') {
                    notasParcialesValidas = false;
                }
            } else {
                anyParcialEntered = true;
                notasParciales.push(rawNota);
                pesosUsados.push(peso);
                sumaPonderada += rawNota * peso;
                sumaPesos += peso;
                minNotaParcial = Math.min(minNotaParcial, rawNota);
            }
        }

        // Procesar TPs aprobados (para materias con conteo de TPs)
        let porcentajeTpsAprobados = 1;
        let tpsDataValid = true;
        let tpsEntered = false;
        let tpsAprobadosNum = NaN;

        if (this.data.tps > 0 && !this.data.nombresTps) {
            const tpsAprobadosStr = this.formData.get('tpsAprobados');
            if (tpsAprobadosStr === null || tpsAprobadosStr.trim() === '') {
                tpsEntered = false;
            } else {
                tpsEntered = true;
                tpsAprobadosNum = parseInt(tpsAprobadosStr, 10);
                if (isNaN(tpsAprobadosNum) || tpsAprobadosNum < 0 || tpsAprobadosNum > this.data.tps) {
                    alert(`El número de TPs aprobados debe estar entre 0 y ${this.data.tps}.`);
                    tpsDataValid = false;
                    porcentajeTpsAprobados = NaN;
                } else {
                    porcentajeTpsAprobados = this.data.tps === 0 ? 1 : (tpsAprobadosNum / this.data.tps);
                }
            }
        } else {
            tpsEntered = true;
        }

        // Verificar errores de validación
        if (!notasParcialesValidas || !tpsDataValid) {
            let errorMsg = "Error: ";
            if (!notasParcialesValidas) errorMsg += "Verifica las notas de los parciales. ";
            if (!tpsDataValid && this.data.tps > 0) errorMsg += `Verifica el número de TPs aprobados (0-${this.data.tps}).`;
            this.displayResult("Error", errorMsg.trim(), "error", "⚠️");
            return;
        }

        // Verificar si hay datos suficientes para calcular
        const noParcialData = !anyParcialEntered;
        const noTpData = !(tpsEntered && tpsDataValid && this.data.tps > 0 && !this.data.nombresTps);

        if (noParcialData && (this.data.tps === 0 || (this.data.tps > 0 && this.data.nombresTps) || noTpData)) {
            this.displayResult("Estado: Pendiente", "Ingresa al menos una nota para calcular un estado parcial.", "pendiente", "📝");
            return;
        }

        const promedioParcialesDefault = sumaPesos !== 0 ? sumaPonderada / sumaPesos : NaN;
        this.evaluarCondicionFinal(promedioParcialesDefault, minNotaParcial, allParcialesEntered, 
                                 tpsEntered, tpsDataValid, porcentajeTpsAprobados, tpsAprobadosNum);
    }

    evaluarCondicionFinal(promedioParcialesDefault, minNotaParcial, allParcialesEntered, 
                         tpsEntered, tpsDataValid, porcentajeTpsAprobados, tpsAprobadosNum) {
        
        const condPromocion = this.data.condiciones.promocion;
        const condRegular = this.data.condiciones.regular;

        let condicion = "LIBRE";
        let descripcionDefault = "";
        let cssClass = "libre";
        let icon = '❌';
        
        let esParcialDefault = !allParcialesEntered || 
                              (!tpsDataValid && this.data.tps > 0 && !this.data.nombresTps && !tpsEntered);
        
        const tpsPorcentajeDefault = (tpsEntered && tpsDataValid && this.data.tps > 0 && !this.data.nombresTps) ? 
                                    porcentajeTpsAprobados : NaN;

        // Evaluar posibilidad de promoción
        let promoPosibleDefault = this.evaluarPromocion(promedioParcialesDefault, minNotaParcial, 
                                                       tpsPorcentajeDefault, condPromocion, 
                                                       allParcialesEntered, esParcialDefault);

        // Evaluar posibilidad de regularización
        let regularPosibleDefault = false;
        if (!promoPosibleDefault && condRegular) {
            regularPosibleDefault = this.evaluarRegular(promedioParcialesDefault, minNotaParcial, 
                                                       tpsPorcentajeDefault, condRegular, 
                                                       allParcialesEntered, esParcialDefault);
        }

        // Determinar condición final
        if (promoPosibleDefault) {
            condicion = esParcialDefault ? "PROMOCIONADO" : "PROMOCIONADO";
            cssClass = "promocionado";
            icon = '🎉';
        } else if (regularPosibleDefault) {
            condicion = esParcialDefault ? "REGULAR" : "REGULAR";
            cssClass = "regular";
            icon = '🏆';
        } else {
            condicion = "LIBRE";
            cssClass = "libre";
            icon = '❌';
        }

        // Construir descripción
        this.construirDescripcion(promedioParcialesDefault, minNotaParcial, tpsAprobadosNum, 
                                esParcialDefault, condicion, allParcialesEntered, tpsEntered, 
                                tpsDataValid);
    }

    evaluarPromocion(promedio, minNota, tpsporcentaje, condicion, allParciales, esParcial) {
        if (!condicion) return false;

        const cumplePromedio = !isNaN(promedio) && promedio >= (condicion.minPromedioGeneral || 0);
        const cumpleMinNota = minNota === Infinity || minNota >= (condicion.minNotaParcial || 0);
        const cumpleTps = isNaN(tpsporcentaje) || tpsporcentaje >= (condicion.minTpsAprobados || 0);

        if (allParciales && !esParcial) {
            return cumplePromedio && cumpleMinNota && cumpleTps;
        } else if (esParcial) {
            // Mantener optimismo en cálculo parcial
            return cumplePromedio && cumpleMinNota && cumpleTps;
        }

        return false;
    }

    evaluarRegular(promedio, minNota, tpsporcentaje, condicion, allParciales, esParcial) {
        if (!condicion) return false;

        const cumplePromedio = !isNaN(promedio) && promedio >= (condicion.minPromedioGeneral || 0);
        const cumpleMinNota = minNota === Infinity || minNota >= (condicion.minNotaParcial || 0);
        const cumpleTps = isNaN(tpsporcentaje) || tpsporcentaje >= (condicion.minTpsAprobados || 0);

        if (allParciales && !esParcial) {
            return cumplePromedio && cumpleMinNota && cumpleTps;
        } else if (esParcial) {
            return cumplePromedio && cumpleMinNota && cumpleTps;
        }

        return false;
    }

    construirDescripcion(promedio, minNota, tpsNum, esParcial, condicion, allParciales, tpsEntered, tpsValidos) {
        let descripcion = "";

        if (!isNaN(promedio)) {
            descripcion += `Promedio: ${promedio.toFixed(2)}. `;
        }
        
        if (minNota !== Infinity && minNota !== -Infinity) {
            descripcion += `Nota mínima: ${minNota}. `;
        }
        
        if (this.data.tps > 0 && !this.data.nombresTps && tpsEntered && tpsValidos) {
            descripcion += `TPs aprobados: ${tpsNum}/${this.data.tps}. `;
        }

        if (esParcial) {
            condicion = "Estado: Pendiente";
            let faltan = [];
            if (!allParciales) faltan.push("notas de parciales");
            if (this.data.tps > 0 && !this.data.nombresTps && (!tpsEntered || !tpsValidos)) {
                faltan.push("cantidad de TPs aprobados");
            }
            
            if (faltan.length > 0) {
                descripcion += ` (Faltan datos: ${faltan.join(', ')}).`;
            }
            
            this.displayResult(condicion, descripcion, "pendiente", "⏳");
        } else {
            let statusText = "";
            if (condicion === "PROMOCIONADO") {
                statusText = "¡Felicitaciones! Condición Final: Promocionado. ";
                descripcion += "Cumples todos los requisitos.";
            } else if (condicion === "REGULAR") {
                statusText = "Condición Final: Regularizado. ";
                descripcion += "Debes rendir final.";
            } else {
                statusText = "Condición Final: Libre. ";
            }
            
            this.displayResult(`${statusText}`, descripcion, 
                             condicion === "PROMOCIONADO" ? "promocionado" : 
                             condicion === "REGULAR" ? "regular" : "libre",
                             condicion === "PROMOCIONADO" ? "🎉" : 
                             condicion === "REGULAR" ? "🏆" : "❌");
        }
    }
}