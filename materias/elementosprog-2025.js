class ElementosProg2025 extends BaseMateria {
    calcular() {
        const notaTPE1 = this.getNota('parcial1');
        const notaTPE2 = this.getNota('parcial2');
        const notaActividadFinal = this.getNota('parcial3');

        // Verificar qué evaluaciones están completas
        const tpe1Completo = !isNaN(notaTPE1);
        const tpe2Completo = !isNaN(notaTPE2);
        const actividadFinalCompleta = !isNaN(notaActividadFinal);

        // Si todos los TPEs y la Actividad Final están completos
        if (tpe1Completo && tpe2Completo && actividadFinalCompleta) {
            this.evaluarCondicionFinalCompleta(notaTPE1, notaTPE2, notaActividadFinal);
            return;
        }

        // Si ambos TPEs están completos pero falta la Actividad Final
        if (tpe1Completo && tpe2Completo && !actividadFinalCompleta) {
            this.evaluarTPEsCompletos(notaTPE1, notaTPE2);
            return;
        }

        // Si solo TPE1 está completo
        if (tpe1Completo && !tpe2Completo) {
            this.evaluarTPE1Solo(notaTPE1);
            return;
        }

        // Si solo TPE2 está completo
        if (!tpe1Completo && tpe2Completo) {
            this.evaluarTPE2Solo(notaTPE2);
            return;
        }

        // Si ningún TPE está completo
        this.displayResult(
            "Estado: Pendiente",
            "Ingresa las notas de los TPEs para evaluar tu condición.",
            "pendiente",
            "📝"
        );
    }

    evaluarTPE1Solo(notaTPE1) {
        // Convertir nota a escala de 10 si está en porcentaje
        const nota1 = notaTPE1 > 10 ? notaTPE1 / 10 : notaTPE1;
        
        // Calcular qué nota necesita en TPE2 para cada condición
        const necesarioPromocion = Math.max(0, (7 * 2) - nota1);
        const necesarioRegular = Math.max(0, (6 * 2) - nota1);

        let mensaje, estado, icon;

        if (necesarioRegular > 10) {
            // Imposible regularizar
            mensaje = `Con TPE 1 = ${nota1.toFixed(2)}, necesitas más de 10 en TPE 2 para regularizar, lo cual es imposible. Condición: LIBRE.`;
            estado = "libre";
            icon = "❌";
        } else if (necesarioPromocion <= 0) {
            // Ya aseguró promoción (pendiente de Actividad Final)
            mensaje = `Con TPE 1 = ${nota1.toFixed(2)}, ya aseguraste un promedio para PROMOCIÓN (≥7). Necesitas al menos ${necesarioRegular.toFixed(2)} en TPE 2 para mantener la regularidad. Luego deberás aprobar la Actividad Integradora Final con ≥6 (60%) para confirmar la promoción.`;
            estado = "promocionado";
            icon = "🎉";
        } else if (necesarioPromocion <= 10) {
            // Puede promocionar
            mensaje = `Con TPE 1 = ${nota1.toFixed(2)}, necesitas al menos ${necesarioPromocion.toFixed(2)} en TPE 2 para PROMOCIONAR (promedio ≥7), o al menos ${necesarioRegular.toFixed(2)} para REGULARIZAR (promedio ≥6). Luego deberás aprobar la Actividad Integradora Final con ≥6 (60%).`;
            estado = "pendiente";
            icon = "⏳";
        } else {
            // Solo puede regularizar
            mensaje = `Con TPE 1 = ${nota1.toFixed(2)}, necesitas al menos ${necesarioRegular.toFixed(2)} en TPE 2 para REGULARIZAR (promoción ya no es posible). Luego deberás aprobar la Actividad Integradora Final con ≥6 (60%).`;
            estado = "pendiente";
            icon = "⏳";
        }

        this.displayResult("TPE 1 Completado", mensaje, estado, icon);
    }

    evaluarTPE2Solo(notaTPE2) {
        // Convertir nota a escala de 10 si está en porcentaje
        const nota2 = notaTPE2 > 10 ? notaTPE2 / 10 : notaTPE2;
        
        // Calcular qué nota necesita en TPE1 para cada condición
        const necesarioPromocion = Math.max(0, (7 * 2) - nota2);
        const necesarioRegular = Math.max(0, (6 * 2) - nota2);

        let mensaje, estado, icon;

        if (necesarioRegular > 10) {
            // Imposible regularizar
            mensaje = `Con TPE 2 = ${nota2.toFixed(2)}, necesitas más de 10 en TPE 1 para regularizar, lo cual es imposible. Condición: LIBRE.`;
            estado = "libre";
            icon = "❌";
        } else if (necesarioPromocion <= 0) {
            // Ya aseguró promoción (pendiente de Actividad Final)
            mensaje = `Con TPE 2 = ${nota2.toFixed(2)}, ya aseguraste un promedio para PROMOCIÓN (≥7). Necesitas al menos ${necesarioRegular.toFixed(2)} en TPE 1 para mantener la regularidad. Luego deberás aprobar la Actividad Integradora Final con ≥6 (60%) para confirmar la promoción.`;
            estado = "promocionado";
            icon = "🎉";
        } else if (necesarioPromocion <= 10) {
            // Puede promocionar
            mensaje = `Con TPE 2 = ${nota2.toFixed(2)}, necesitas al menos ${necesarioPromocion.toFixed(2)} en TPE 1 para PROMOCIONAR (promedio ≥7), o al menos ${necesarioRegular.toFixed(2)} para REGULARIZAR (promedio ≥6). Luego deberás aprobar la Actividad Integradora Final con ≥6 (60%).`;
            estado = "pendiente";
            icon = "⏳";
        } else {
            // Solo puede regularizar
            mensaje = `Con TPE 2 = ${nota2.toFixed(2)}, necesitas al menos ${necesarioRegular.toFixed(2)} en TPE 1 para REGULARIZAR (promoción ya no es posible). Luego deberás aprobar la Actividad Integradora Final con ≥6 (60%).`;
            estado = "pendiente";
            icon = "⏳";
        }

        this.displayResult("TPE 2 Completado", mensaje, estado, icon);
    }

    evaluarTPEsCompletos(notaTPE1, notaTPE2) {
        // Convertir notas a escala de 10 si están en porcentaje
        const nota1 = notaTPE1 > 10 ? notaTPE1 / 10 : notaTPE1;
        const nota2 = notaTPE2 > 10 ? notaTPE2 / 10 : notaTPE2;
        
        // Calcular promedio de ambos TPEs
        const promedio = (nota1 + nota2) / 2;

        let condicion, mensaje, estado, icon;

        if (promedio >= 7) {
            // Condición para PROMOCIÓN (pendiente de Actividad Final)
            condicion = "Condición Provisoria: PROMOCIÓN";
            mensaje = `Promedio de TPEs: ${promedio.toFixed(2)} (≥7). Estás en condiciones de PROMOCIONAR.\n\n⚠️ Para confirmar la PROMOCIÓN, debes aprobar la Actividad Integradora Final con una nota ≥6 (60%).`;
            estado = "promocionado";
            icon = "🎯";
        } else if (promedio >= 6) {
            // Condición para REGULAR (pendiente de Actividad Final)
            condicion = "Condición Provisoria: REGULAR";
            mensaje = `Promedio de TPEs: ${promedio.toFixed(2)} (≥6 y <7). Estás en condiciones de REGULARIZAR.\n\n⚠️ Para confirmar la REGULARIDAD, debes aprobar la Actividad Integradora Final con una nota ≥6 (60%).`;
            estado = "regular";
            icon = "⚠️";
        } else {
            // LIBRE
            condicion = "LIBRE";
            mensaje = `Promedio de TPEs: ${promedio.toFixed(2)} (<6). Condición: LIBRE. Deberás recursar la materia.`;
            estado = "libre";
            icon = "❌";
        }

        // Agregar detalles de las notas
        mensaje += `\n\nDetalle:\n• TPE 1 (U1-3): ${nota1.toFixed(2)}\n• TPE 2 (U4-5): ${nota2.toFixed(2)}\n• Promedio: ${promedio.toFixed(2)}`;

        this.displayResult(condicion, mensaje, estado, icon);
    }

    evaluarCondicionFinalCompleta(notaTPE1, notaTPE2, notaActividadFinal) {
        // Convertir notas a escala de 10 si están en porcentaje
        const nota1 = notaTPE1 > 10 ? notaTPE1 / 10 : notaTPE1;
        const nota2 = notaTPE2 > 10 ? notaTPE2 / 10 : notaTPE2;
        const notaFinal = notaActividadFinal > 10 ? notaActividadFinal / 10 : notaActividadFinal;
        
        // Calcular promedio de ambos TPEs
        const promedio = (nota1 + nota2) / 2;

        let condicion, mensaje, estado, icon;

        // Verificar si aprobó la Actividad Integradora Final
        const aproboActividadFinal = notaFinal >= 6;

        if (promedio >= 7 && aproboActividadFinal) {
            // PROMOCIONADO
            condicion = "PROMOCIONADO";
            mensaje = `¡Felicitaciones! Promedio de TPEs: ${promedio.toFixed(2)} (≥7) y Actividad Integradora Final: ${notaFinal.toFixed(2)} (≥6). Has PROMOCIONADO la materia.`;
            estado = "promocionado";
            icon = "🎉";
        } else if (promedio >= 7 && !aproboActividadFinal) {
            // Tenía promedio para promoción pero no aprobó la Actividad Final
            condicion = "REGULAR";
            mensaje = `Promedio de TPEs: ${promedio.toFixed(2)} (≥7), pero la Actividad Integradora Final: ${notaFinal.toFixed(2)} (<6). Condición: REGULAR. Deberás rendir examen final.`;
            estado = "regular";
            icon = "⚠️";
        } else if (promedio >= 6 && aproboActividadFinal) {
            // REGULAR
            condicion = "REGULAR";
            mensaje = `Promedio de TPEs: ${promedio.toFixed(2)} (≥6 y <7) y Actividad Integradora Final: ${notaFinal.toFixed(2)} (≥6). Condición: REGULAR. Deberás rendir examen final.`;
            estado = "regular";
            icon = "✅";
        } else if (promedio >= 6 && !aproboActividadFinal) {
            // No aprobó la Actividad Final
            condicion = "LIBRE";
            mensaje = `Promedio de TPEs: ${promedio.toFixed(2)} (≥6), pero la Actividad Integradora Final: ${notaFinal.toFixed(2)} (<6). Condición: LIBRE. Deberás recursar la materia.`;
            estado = "libre";
            icon = "❌";
        } else {
            // LIBRE por promedio bajo
            condicion = "LIBRE";
            mensaje = `Promedio de TPEs: ${promedio.toFixed(2)} (<6). Condición: LIBRE. Deberás recursar la materia.`;
            estado = "libre";
            icon = "❌";
        }

        // Agregar detalles de las notas
        mensaje += `\n\nDetalle:\n• TPE 1 (U1-3): ${nota1.toFixed(2)}\n• TPE 2 (U4-5): ${nota2.toFixed(2)}\n• Promedio TPEs: ${promedio.toFixed(2)}\n• Actividad Integradora Final: ${notaFinal.toFixed(2)}`;

        this.displayResult(`Condición Final: ${condicion}`, mensaje, estado, icon);
    }
}