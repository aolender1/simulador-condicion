class IntroDatos2025 extends BaseMateria {
    calcular() {
        const notaTPE1 = this.getNota('parcial1');
        const notaTPE2 = this.getNota('parcial2');

        // Verificar si ambos TPEs están completos
        const tpe1Completo = !isNaN(notaTPE1);
        const tpe2Completo = !isNaN(notaTPE2);

        // Si ambos TPEs están completos, evaluar condición final
        if (tpe1Completo && tpe2Completo) {
            this.evaluarCondicionFinal(notaTPE1, notaTPE2);
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
        // Calcular qué nota necesita en TPE2 para cada condición
        const necesarioPromocion = Math.max(0, (70 * 2) - notaTPE1);
        const necesarioRegular = Math.max(0, (40 * 2) - notaTPE1);

        let mensaje, estado, icon;

        if (necesarioRegular > 100) {
            // Imposible regularizar
            mensaje = `Con TPE nº1 = ${notaTPE1}%, necesitas más de 100% en TPE nº2 para regularizar, lo cual es imposible. Condición: LIBRE.`;
            estado = "libre";
            icon = "❌";
        } else if (necesarioPromocion <= 0) {
            // Ya aseguró promoción
            mensaje = `Con TPE nº1 = ${notaTPE1}%, ya aseguraste la PROMOCIÓN. Necesitas al menos ${necesarioRegular.toFixed(1)}% en TPE nº2 para mantener la regularidad.`;
            estado = "promocionado";
            icon = "🎉";
        } else if (necesarioPromocion <= 100) {
            // Puede promocionar
            mensaje = `Con TPE nº1 = ${notaTPE1}%, necesitas al menos ${necesarioPromocion.toFixed(1)}% en TPE nº2 para PROMOCIONAR, o al menos ${necesarioRegular.toFixed(1)}% para REGULARIZAR.`;
            estado = "pendiente";
            icon = "⏳";
        } else {
            // Solo puede regularizar
            mensaje = `Con TPE nº1 = ${notaTPE1}%, necesitas al menos ${necesarioRegular.toFixed(1)}% en TPE nº2 para REGULARIZAR (promoción ya no es posible).`;
            estado = "pendiente";
            icon = "⏳";
        }

        this.displayResult("TPE nº1 Completado", mensaje, estado, icon);
    }

    evaluarTPE2Solo(notaTPE2) {
        // Calcular qué nota necesita en TPE1 para cada condición
        const necesarioPromocion = Math.max(0, (70 * 2) - notaTPE2);
        const necesarioRegular = Math.max(0, (40 * 2) - notaTPE2);

        let mensaje, estado, icon;

        if (necesarioRegular > 100) {
            // Imposible regularizar
            mensaje = `Con TPE nº2 = ${notaTPE2}%, necesitas más de 100% en TPE nº1 para regularizar, lo cual es imposible. Condición: LIBRE.`;
            estado = "libre";
            icon = "❌";
        } else if (necesarioPromocion <= 0) {
            // Ya aseguró promoción
            mensaje = `Con TPE nº2 = ${notaTPE2}%, ya aseguraste la PROMOCIÓN. Necesitas al menos ${necesarioRegular.toFixed(1)}% en TPE nº1 para mantener la regularidad.`;
            estado = "promocionado";
            icon = "🎉";
        } else if (necesarioPromocion <= 100) {
            // Puede promocionar
            mensaje = `Con TPE nº2 = ${notaTPE2}%, necesitas al menos ${necesarioPromocion.toFixed(1)}% en TPE nº1 para PROMOCIONAR, o al menos ${necesarioRegular.toFixed(1)}% para REGULARIZAR.`;
            estado = "pendiente";
            icon = "⏳";
        } else {
            // Solo puede regularizar
            mensaje = `Con TPE nº2 = ${notaTPE2}%, necesitas al menos ${necesarioRegular.toFixed(1)}% en TPE nº1 para REGULARIZAR (promoción ya no es posible).`;
            estado = "pendiente";
            icon = "⏳";
        }

        this.displayResult("TPE nº2 Completado", mensaje, estado, icon);
    }

    evaluarCondicionFinal(notaTPE1, notaTPE2) {
        // Calcular promedio de ambos TPEs
        const promedio = (notaTPE1 + notaTPE2) / 2;

        let condicion, mensaje, estado, icon;

        if (promedio >= 70) {
            // PROMOCIÓN
            condicion = "PROMOCIONADO";
            mensaje = `¡Felicitaciones! Aprobaste ambos TPEs con un promedio de ${promedio.toFixed(1)}% (≥70%). Has PROMOCIONADO la materia.`;
            estado = "promocionado";
            icon = "🎉";
        } else if (promedio >= 40) {
            // REGULAR
            condicion = "REGULAR";
            mensaje = `Aprobaste ambos TPEs con un promedio de ${promedio.toFixed(1)}% (≥40% y <70%). Condición: REGULAR. Deberás rendir examen final.`;
            estado = "regular";
            icon = "✅";
        } else {
            // LIBRE
            condicion = "LIBRE";
            mensaje = `El promedio de ambos TPEs es ${promedio.toFixed(1)}% (<40%). Condición: LIBRE. Deberás recursar la materia.`;
            estado = "libre";
            icon = "❌";
        }

        // Agregar detalles de las notas
        mensaje += `\n\nDetalle:\n• TPE nº1 (U1-4): ${notaTPE1}%\n• TPE nº2 (U5-7): ${notaTPE2}%\n• Promedio: ${promedio.toFixed(1)}%`;

        this.displayResult(`Condición Final: ${condicion}`, mensaje, estado, icon);
    }
}