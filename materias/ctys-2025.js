class CtyS2025 extends BaseMateria {
    // Método para generar inputs específicos de CTyS
    static generateInputs(dynamicInputsDiv) {
        // Limpiar contenedor
        dynamicInputsDiv.innerHTML = '';

        // 1. Asistencia
        const asistenciaGroup = document.createElement('div');
        asistenciaGroup.className = 'form-group';
        
        const asistenciaLabel = document.createElement('label');
        asistenciaLabel.setAttribute('for', 'asistencia');
        asistenciaLabel.textContent = 'Asistencia (%):';
        
        const asistenciaInput = document.createElement('input');
        asistenciaInput.type = 'number';
        asistenciaInput.id = 'asistencia';
        asistenciaInput.name = 'asistencia';
        asistenciaInput.min = '0';
        asistenciaInput.max = '100';
        asistenciaInput.step = '0.1';
        asistenciaInput.placeholder = '0-100';
        
        asistenciaGroup.appendChild(asistenciaLabel);
        asistenciaGroup.appendChild(asistenciaInput);
        dynamicInputsDiv.appendChild(asistenciaGroup);

        // 2. TP1
        const tp1Group = document.createElement('div');
        tp1Group.className = 'form-group';
        
        const tp1Label = document.createElement('label');
        tp1Label.setAttribute('for', 'tp1');
        tp1Label.textContent = 'TP1 (%):';
        
        const tp1Input = document.createElement('input');
        tp1Input.type = 'number';
        tp1Input.id = 'tp1';
        tp1Input.name = 'tp1';
        tp1Input.min = '0';
        tp1Input.max = '100';
        tp1Input.step = '0.1';
        tp1Input.placeholder = '0-100';
        
        tp1Group.appendChild(tp1Label);
        tp1Group.appendChild(tp1Input);
        dynamicInputsDiv.appendChild(tp1Group);

        // 3. TP2
        const tp2Group = document.createElement('div');
        tp2Group.className = 'form-group';
        
        const tp2Label = document.createElement('label');
        tp2Label.setAttribute('for', 'tp2');
        tp2Label.textContent = 'TP2 (%):';
        
        const tp2Input = document.createElement('input');
        tp2Input.type = 'number';
        tp2Input.id = 'tp2';
        tp2Input.name = 'tp2';
        tp2Input.min = '0';
        tp2Input.max = '100';
        tp2Input.step = '0.1';
        tp2Input.placeholder = '0-100';
        
        tp2Group.appendChild(tp2Label);
        tp2Group.appendChild(tp2Input);
        dynamicInputsDiv.appendChild(tp2Group);

        // 4. TIF
        const tifGroup = document.createElement('div');
        tifGroup.className = 'form-group';
        
        const tifLabel = document.createElement('label');
        tifLabel.setAttribute('for', 'parcial1');
        tifLabel.textContent = 'Trabajo Integrador Final (TIF) (%):';
        
        const tifInput = document.createElement('input');
        tifInput.type = 'number';
        tifInput.id = 'parcial1';
        tifInput.name = 'parcial1';
        tifInput.min = '0';
        tifInput.max = '100';
        tifInput.step = '0.1';
        tifInput.placeholder = '0-100';
        
        tifGroup.appendChild(tifLabel);
        tifGroup.appendChild(tifInput);
        dynamicInputsDiv.appendChild(tifGroup);
    }

    calcular() {
        // 1. Obtener Asistencia
        const asistencia = this.getNota('asistencia');
        const asistenciaIngresada = this.formData.get('asistencia') !== null && this.formData.get('asistencia').trim() !== '';
        const asistenciaOk = !isNaN(asistencia) && asistencia >= 75;

        // 2. Obtener notas de TPs
        const notaTP1 = this.getNota('tp1');
        const notaTP2 = this.getNota('tp2');
        const tp1Ingresado = this.formData.get('tp1') !== null && this.formData.get('tp1').trim() !== '';
        const tp2Ingresado = this.formData.get('tp2') !== null && this.formData.get('tp2').trim() !== '';
        
        const tp1Valido = !isNaN(notaTP1);
        const tp2Valido = !isNaN(notaTP2);

        // 3. Obtener nota TIF
        const notaTIF = this.getNota('parcial1');
        const tifIngresado = this.formData.get('parcial1') !== null && this.formData.get('parcial1').trim() !== '';
        const tifValido = !isNaN(notaTIF);

        // 4. Verificar errores de validación
        if ((asistenciaIngresada && !tp1Valido && asistencia !== asistencia) || 
            (tp1Ingresado && !tp1Valido) || 
            (tp2Ingresado && !tp2Valido) || 
            (tifIngresado && !tifValido)) {
            
            let errorMsg = "Error: ";
            if (asistenciaIngresada && isNaN(asistencia)) errorMsg += "Asistencia inválida (0-100). ";
            if (tp1Ingresado && !tp1Valido) errorMsg += "TP1 inválido (0-100). ";
            if (tp2Ingresado && !tp2Valido) errorMsg += "TP2 inválido (0-100). ";
            if (tifIngresado && !tifValido) errorMsg += "TIF inválido (0-100). ";
            
            this.displayResult("Error", errorMsg.trim(), "error", "⚠️");
            return;
        }

        // 5. Evaluar condición
        this.evaluarCondicion(asistencia, asistenciaIngresada, asistenciaOk,
                             notaTP1, notaTP2, tp1Ingresado, tp2Ingresado, tp1Valido, tp2Valido,
                             notaTIF, tifIngresado, tifValido);
    }

    evaluarCondicion(asistencia, asistenciaIngresada, asistenciaOk,
                    notaTP1, notaTP2, tp1Ingresado, tp2Ingresado, tp1Valido, tp2Valido,
                    notaTIF, tifIngresado, tifValido) {

        let descripcion = "";
        let status = "Estado: Pendiente";
        let css = "pendiente";
        let icon = "⏳";
        let faltanItems = [];

        // Evaluar cada componente
        // Asistencia
        if (asistenciaIngresada && tp1Valido) {
            descripcion += `Asistencia: ${asistencia}% (${asistenciaOk ? 'OK' : 'Insuficiente'}). `;
            if (!asistenciaOk) {
                this.displayResult("Condición Final: LIBRE", 
                    descripcion + "Asistencia insuficiente (<75%). No puedes regularizar.", 
                    "libre", "❌");
                return;
            }
        } else if (!asistenciaIngresada) {
            faltanItems.push("asistencia");
        }

        // TPs
        const ambosTPsIngresados = tp1Ingresado && tp2Ingresado && tp1Valido && tp2Valido;
        const algunTPIngresado = (tp1Ingresado && tp1Valido) || (tp2Ingresado && tp2Valido);

        if (ambosTPsIngresados) {
            const tp1Regular = notaTP1 >= 60;
            const tp2Regular = notaTP2 >= 60;
            const tp1Promo = notaTP1 >= 70;
            const tp2Promo = notaTP2 >= 70;

            descripcion += `TP1: ${notaTP1}% (${tp1Regular ? (tp1Promo ? 'Promo' : 'Regular') : 'Insuf'}). `;
            descripcion += `TP2: ${notaTP2}% (${tp2Regular ? (tp2Promo ? 'Promo' : 'Regular') : 'Insuf'}). `;

            // Si algún TP no llega a regular, es libre
            if (!tp1Regular || !tp2Regular) {
                status = "Condición Final: LIBRE";
                descripcion += "No cumples los requisitos mínimos en los TPs (ambos deben ser ≥60%).";
                css = "libre";
                icon = "❌";
                this.displayResult(status, descripcion, css, icon);
                return;
            }

            // TPs OK para regular, evaluar si puede promocionar con TIF
            const puedePromocionarConTIF = asistenciaOk && tp1Promo && tp2Promo;

            if (tifIngresado && tifValido) {
                descripcion += `TIF: ${notaTIF}%. `;
                
                if (puedePromocionarConTIF && notaTIF >= 60) {
                    status = "Condición Final: PROMOCIONADO";
                    descripcion += "¡Felicitaciones! Cumples todos los requisitos para promocionar.";
                    css = "promocionado";
                    icon = "🎉";
                } else {
                    status = "Condición Final: REGULAR";
                    if (puedePromocionarConTIF && notaTIF < 60) {
                        descripcion += "TIF insuficiente para promocionar. Condición: Regular.";
                    } else if (!puedePromocionarConTIF) {
                        descripcion += "TPs insuficientes para promocionar. Condición: Regular.";
                    }
                    css = "regular";
                    icon = "🏆";
                }
            } else {
                // Sin TIF
                status = "Condición Final: REGULAR";
                if (puedePromocionarConTIF) {
                    descripcion += "Cumples requisitos para regular. Puedes cargar TIF para intentar promocionar.";
                } else {
                    descripcion += "Cumples requisitos para regularizar.";
                }
                css = "regular";
                icon = "🏆";
            }

        } else if (algunTPIngresado) {
            // Parcial - solo algunos TPs
            if (tp1Ingresado && tp1Valido) {
                descripcion += `TP1: ${notaTP1}% (${notaTP1 >= 60 ? (notaTP1 >= 70 ? 'Promo' : 'Regular') : 'Insuf'}). `;
                if (notaTP1 < 60) {
                    descripcion += "TP1 insuficiente. ";
                }
            }
            if (tp2Ingresado && tp2Valido) {
                descripcion += `TP2: ${notaTP2}% (${notaTP2 >= 60 ? (notaTP2 >= 70 ? 'Promo' : 'Regular') : 'Insuf'}). `;
                if (notaTP2 < 60) {
                    descripcion += "TP2 insuficiente. ";
                }
            }
            faltanItems.push("notas de TPs restantes");
        } else {
            faltanItems.push("TP1 y TP2");
        }

        // TIF parcial
        if (tifIngresado && tifValido && !ambosTPsIngresados) {
            descripcion += `TIF: ${notaTIF}%. `;
        }

        // Estado pendiente
        if (status === "Estado: Pendiente") {
            faltanItems = [...new Set(faltanItems)];
            
            if (faltanItems.length > 0) {
                descripcion += `(Faltan datos: ${faltanItems.join(', ')}).`;
            } else if (!asistenciaIngresada && !algunTPIngresado && !tifIngresado) {
                descripcion = "Ingresa asistencia, TP1, TP2 y opcionalmente TIF para calcular.";
                icon = "📝";
            }

            // Iconos optimistas para estados pendientes
            if (asistenciaOk && ambosTPsIngresados && notaTP1 >= 70 && notaTP2 >= 70 && 
                (!tifIngresado || (tifValido && notaTIF >= 60))) {
                icon = "🎉"; // Promoción posible
            } else if (asistenciaOk && ambosTPsIngresados && notaTP1 >= 60 && notaTP2 >= 60) {
                icon = "🏆"; // Regular seguro
            } else if ((asistenciaIngresada && !asistenciaOk) || 
                      (ambosTPsIngresados && (notaTP1 < 60 || notaTP2 < 60))) {
                icon = "❌"; // Probablemente libre
            }
        }

        this.displayResult(status, descripcion, css, icon);
    }
}