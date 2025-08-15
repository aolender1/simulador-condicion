class Calculo12025 extends BaseMateria {
    calcular() {
        const notaTPE1_2 = this.getNota('parcial1');
        const notaTG1_2 = this.getNota('parcial2');
        const notaTPE3 = this.getNota('parcial3');
        const notaTG3 = this.getNota('parcial4');
        const notaTPE4 = this.getNota('parcial5');
        const notaTGFinal = this.getNota('parcial6');

        // Helper para calcular promedio final provisorio
        const calcularPromedioFinalProvisorio = () => {
            const notasFinales = [notaTPE1_2, notaTPE3, notaTPE4, notaTGFinal].filter(n => !isNaN(n));
            if (notasFinales.length === 0) return NaN;
            return notasFinales.reduce((a, b) => a + b, 0) / notasFinales.length;
        };

        // Evaluar Paso 1
        const resultadoPaso1 = this.evaluarPaso1(notaTPE1_2, notaTG1_2);
        if (resultadoPaso1.terminar) return;
        
        const paso1Superado = resultadoPaso1.paso1Superado || false;
        const paso1Pendiente = resultadoPaso1.paso1Pendiente || false;
        const paso1Completo = resultadoPaso1.paso1Completo || false;
        const avgPaso1 = resultadoPaso1.avgPaso1 || NaN;

        // Si el Paso 1 está completo, evaluar Paso 2
        if (paso1Completo) {
            const resultadoPaso2 = this.evaluarPaso2(notaTPE3, notaTG3, avgPaso1, paso1Pendiente);
            if (resultadoPaso2.terminar) return;
            
            const paso2Superado = resultadoPaso2.paso2Superado || false;
            const paso2Pendiente = resultadoPaso2.paso2Pendiente || false;
            const paso2Completo = resultadoPaso2.paso2Completo || false;
            const avgPaso2 = resultadoPaso2.avgPaso2 || NaN;

            // Si los Pasos 1 y 2 están completos, evaluar Paso 3
            if (paso2Completo) {
                const resultadoPaso3 = this.evaluarPaso3(notaTPE4, notaTGFinal, avgPaso1, paso1Pendiente, avgPaso2, paso2Pendiente);
                if (resultadoPaso3.terminar) return;
                
                const paso3Superado = resultadoPaso3.paso3Superado || false;
                const paso3Pendiente = resultadoPaso3.paso3Pendiente || false;
                const paso3Completo = resultadoPaso3.paso3Completo || false;
                const avgPaso3 = resultadoPaso3.avgPaso3 || NaN;

                // Si todos los pasos están completos, evaluar condición final
                if (paso3Completo) {
                    this.evaluarCondicionFinal(paso1Superado, paso2Superado, paso3Superado, 
                                             paso1Pendiente, paso2Pendiente, paso3Pendiente, 
                                             avgPaso1, avgPaso2, avgPaso3, calcularPromedioFinalProvisorio);
                }
            }
        }

        // Si no se ha mostrado ningún resultado específico, mostrar estado inicial
        if (!resultadoPaso1.terminar && !paso1Completo) {
            this.displayResult("Estado: Pendiente", "Ingresa las notas del TPE (U1-2) y TG (U1-2) para evaluar el Paso 1.", "pendiente", "📝");
        }
    }

    evaluarPaso1(notaTPE1_2, notaTG1_2) {
        // Ambas notas completas
        if (!isNaN(notaTPE1_2) && !isNaN(notaTG1_2)) {
            const avgPaso1 = (notaTPE1_2 + notaTG1_2) / 2;
            
            if (avgPaso1 < 40) {
                this.displayResult("Condición Final: LIBRE", `El promedio del Paso 1 (${avgPaso1.toFixed(1)}) es menor a 40. No puedes continuar.`, "libre", "❌");
                return { terminar: true };
            }
            
            const estado = avgPaso1 >= 50 ? "APROBADO" : "PENDIENTE";
            const descripcion = `Paso 1 ${estado} (promedio: ${avgPaso1.toFixed(1)}). ${estado === "APROBADO" ? "Puedes continuar al Paso 2." : "Paso pendiente, pero puedes continuar."}`;
            
            // Si no hay notas del paso 2, mostrar este resultado
            const tieneNotasPaso2 = !isNaN(this.getNota('parcial3')) || !isNaN(this.getNota('parcial4'));
            if (!tieneNotasPaso2) {
                this.displayResult(`Paso 1: ${estado}`, descripcion + " Ingresa las notas del TPE (U3) y TG (U3) para continuar.", estado === "APROBADO" ? "promocionado" : "regular", estado === "APROBADO" ? "✅" : "⚠️");
                return { terminar: true };
            }

            return {
                paso1Completo: true,
                paso1Superado: true,
                paso1Pendiente: avgPaso1 < 50,
                avgPaso1: avgPaso1,
                terminar: false
            };
        } 
        // Solo TPE1-2
        else if (!isNaN(notaTPE1_2)) {
            const necesario40 = Math.max(0, (40 * 2) - notaTPE1_2);
            const necesario50 = Math.max(0, (50 * 2) - notaTPE1_2);
            
            let msg, estado = "pendiente", icon = "⏳";
            
            if (necesario40 > 100) {
                msg = `Con TPE ${notaTPE1_2}, necesitas más de 100 en TG (U1-2), lo cual es imposible. Condición: LIBRE.`;
                estado = "libre";
                icon = "❌";
            } else if (necesario50 <= 0) {
                msg = `Con TPE ${notaTPE1_2}, ya aseguraste aprobar el Paso 1. Necesitas al menos ${necesario40.toFixed(1)} en TG (U1-2) para pasar pendiente.`;
                icon = "✅";
            } else {
                msg = `Con TPE ${notaTPE1_2}, necesitas al menos ${necesario40.toFixed(1)} en TG (U1-2) para pasar pendiente, o ${necesario50.toFixed(1)} para aprobar el Paso 1.`;
            }
            
            this.displayResult("Estado: Pendiente - Paso 1", msg, estado, icon);
            return { terminar: true };
        } 
        // Solo TG1-2
        else if (!isNaN(notaTG1_2)) {
            const necesario40 = Math.max(0, (40 * 2) - notaTG1_2);
            const necesario50 = Math.max(0, (50 * 2) - notaTG1_2);
            
            let msg, estado = "pendiente", icon = "⏳";
            
            if (necesario40 > 100) {
                msg = `Con TG ${notaTG1_2}, necesitas más de 100 en TPE (U1-2), lo cual es imposible. Condición: LIBRE.`;
                estado = "libre";
                icon = "❌";
            } else if (necesario50 <= 0) {
                msg = `Con TG ${notaTG1_2}, ya aseguraste aprobar el Paso 1. Necesitas al menos ${necesario40.toFixed(1)} en TPE (U1-2) para pasar pendiente.`;
                icon = "✅";
            } else {
                msg = `Con TG ${notaTG1_2}, necesitas al menos ${necesario40.toFixed(1)} en TPE (U1-2) para pasar pendiente, o ${necesario50.toFixed(1)} para aprobar el Paso 1.`;
            }
            
            this.displayResult("Estado: Pendiente - Paso 1", msg, estado, icon);
            return { terminar: true };
        }
        
        return { terminar: false };
    }

    evaluarPaso2(notaTPE3, notaTG3, avgPaso1, paso1Pendiente) {
        // Ambas notas completas
        if (!isNaN(notaTPE3) && !isNaN(notaTG3)) {
            const avgPaso2 = (notaTPE3 + notaTG3) / 2;
            
            if (avgPaso2 < 40) {
                const descripcion = `Paso 1: ${avgPaso1.toFixed(1)} (${paso1Pendiente ? 'Pendiente' : 'Aprobado'}). Paso 2: ${avgPaso2.toFixed(1)} (LIBRE - menor a 40).`;
                this.displayResult("Condición Final: LIBRE", descripcion, "libre", "❌");
                return { terminar: true };
            }
            
            const paso2Estado = avgPaso2 >= 50 ? "APROBADO" : "PENDIENTE";
            const descripcion = `Paso 1: ${avgPaso1.toFixed(1)} (${paso1Pendiente ? 'Pendiente' : 'Aprobado'}). Paso 2: ${avgPaso2.toFixed(1)} (${paso2Estado}).`;
            
            // Si no hay notas del paso 3, mostrar este resultado
            const tieneNotasPaso3 = !isNaN(this.getNota('parcial5')) || !isNaN(this.getNota('parcial6'));
            if (!tieneNotasPaso3) {
                this.displayResult(`Pasos 1-2 Completados`, descripcion + " Ingresa las notas del TPE (U4) y TG (Final) para continuar.", "regular", "⚠️");
                return { terminar: true };
            }

            return {
                paso2Completo: true,
                paso2Superado: true,
                paso2Pendiente: avgPaso2 < 50,
                avgPaso2: avgPaso2,
                terminar: false
            };
        } 
        // Solo TPE3
        else if (!isNaN(notaTPE3)) {
            const necesario40 = Math.max(0, (40 * 2) - notaTPE3);
            const necesario50 = Math.max(0, (50 * 2) - notaTPE3);
            
            let msg = `Paso 1: ${avgPaso1.toFixed(1)} (${paso1Pendiente ? 'Pendiente' : 'Aprobado'}). `;
            
            if (necesario40 > 100) {
                msg += `Con TPE(U3) ${notaTPE3}, necesitas más de 100 en TG(U3). Condición: LIBRE.`;
                this.displayResult("Condición Final: LIBRE", msg, "libre", "❌");
            } else {
                msg += `Con TPE(U3) ${notaTPE3}, necesitas al menos ${necesario40.toFixed(1)} en TG(U3) para pasar pendiente, o ${necesario50.toFixed(1)} para aprobar el Paso 2.`;
                this.displayResult("Estado: Pendiente - Paso 2", msg, "pendiente", "⏳");
            }
            return { terminar: true };
        } 
        // Solo TG3
        else if (!isNaN(notaTG3)) {
            const necesario40 = Math.max(0, (40 * 2) - notaTG3);
            const necesario50 = Math.max(0, (50 * 2) - notaTG3);
            
            let msg = `Paso 1: ${avgPaso1.toFixed(1)} (${paso1Pendiente ? 'Pendiente' : 'Aprobado'}). `;
            
            if (necesario40 > 100) {
                msg += `Con TG(U3) ${notaTG3}, necesitas más de 100 en TPE(U3). Condición: LIBRE.`;
                this.displayResult("Condición Final: LIBRE", msg, "libre", "❌");
            } else {
                msg += `Con TG(U3) ${notaTG3}, necesitas al menos ${necesario40.toFixed(1)} en TPE(U3) para pasar pendiente, o ${necesario50.toFixed(1)} para aprobar el Paso 2.`;
                this.displayResult("Estado: Pendiente - Paso 2", msg, "pendiente", "⏳");
            }
            return { terminar: true };
        }

        return { terminar: false };
    }

    evaluarPaso3(notaTPE4, notaTGFinal, avgPaso1, paso1Pendiente, avgPaso2, paso2Pendiente) {
        // Ambas notas completas
        if (!isNaN(notaTPE4) && !isNaN(notaTGFinal)) {
            const avgPaso3 = (notaTPE4 + notaTGFinal) / 2;
            
            if (avgPaso3 < 40) {
                const descripcion = `Paso 1: ${avgPaso1.toFixed(1)} (${paso1Pendiente ? 'Pend' : 'Apr'}). Paso 2: ${avgPaso2.toFixed(1)} (${paso2Pendiente ? 'Pend' : 'Apr'}). Paso 3: ${avgPaso3.toFixed(1)} (LIBRE).`;
                this.displayResult("Condición Final: LIBRE", descripcion, "libre", "❌");
                return { terminar: true };
            }

            return {
                paso3Completo: true,
                paso3Superado: true,
                paso3Pendiente: avgPaso3 < 50,
                avgPaso3: avgPaso3,
                terminar: false
            };
        } 
        // Solo TPE4
        else if (!isNaN(notaTPE4)) {
            const necesario40 = Math.max(0, (40 * 2) - notaTPE4);
            const necesario50 = Math.max(0, (50 * 2) - notaTPE4);
            
            let msg = `Pasos: 1(${avgPaso1.toFixed(1)}) 2(${avgPaso2.toFixed(1)}). `;
            
            if (necesario40 > 100) {
                msg += `Con TPE(U4) ${notaTPE4}, necesitas más de 100 en TG(Final). Condición: LIBRE.`;
                this.displayResult("Condición Final: LIBRE", msg, "libre", "❌");
            } else {
                msg += `Con TPE(U4) ${notaTPE4}, necesitas al menos ${necesario40.toFixed(1)} en TG(Final) para pasar pendiente, o ${necesario50.toFixed(1)} para aprobar el Paso 3.`;
                this.displayResult("Estado: Pendiente - Paso 3", msg, "pendiente", "⏳");
            }
            return { terminar: true };
        } 
        // Solo TG Final
        else if (!isNaN(notaTGFinal)) {
            const necesario40 = Math.max(0, (40 * 2) - notaTGFinal);
            const necesario50 = Math.max(0, (50 * 2) - notaTGFinal);
            
            let msg = `Pasos: 1(${avgPaso1.toFixed(1)}) 2(${avgPaso2.toFixed(1)}). `;
            
            if (necesario40 > 100) {
                msg += `Con TG(Final) ${notaTGFinal}, necesitas más de 100 en TPE(U4). Condición: LIBRE.`;
                this.displayResult("Condición Final: LIBRE", msg, "libre", "❌");
            } else {
                msg += `Con TG(Final) ${notaTGFinal}, necesitas al menos ${necesario40.toFixed(1)} en TPE(U4) para pasar pendiente, o ${necesario50.toFixed(1)} para aprobar el Paso 3.`;
                this.displayResult("Estado: Pendiente - Paso 3", msg, "pendiente", "⏳");
            }
            return { terminar: true };
        }

        return { terminar: false };
    }

    evaluarCondicionFinal(paso1Superado, paso2Superado, paso3Superado, paso1Pendiente, paso2Pendiente, paso3Pendiente, avgPaso1, avgPaso2, avgPaso3, calcularPromedioFinalProvisorio) {
        if (paso1Superado && paso2Superado && paso3Superado) {
            const tienePendientes = paso1Pendiente || paso2Pendiente || paso3Pendiente;
            const promedioFinal = calcularPromedioFinalProvisorio();
            
            let descripcion = `Pasos: 1(${avgPaso1.toFixed(1)}) 2(${avgPaso2.toFixed(1)}) 3(${avgPaso3.toFixed(1)}). Promedio final: ${promedioFinal.toFixed(1)}. `;
            
            if (tienePendientes) {
                descripcion += "Tienes pasos pendientes, condición: REGULAR.";
                this.displayResult("Condición Final: REGULAR", descripcion, "regular", "🏆");
            } else if (promedioFinal >= 50) {
                descripcion += "¡Todos los pasos aprobados! Condición: PROMOCIONADO.";
                this.displayResult("Condición Final: PROMOCIONADO", descripcion, "promocionado", "🎉");
            } else {
                descripcion += "Promedio final insuficiente para promocionar. Condición: REGULAR.";
                this.displayResult("Condición Final: REGULAR", descripcion, "regular", "🏆");
            }
        }
    }
}