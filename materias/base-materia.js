class BaseMateria {
    constructor(key, data, formData, displayResult, getNota) {
        this.key = key;
        this.data = data;
        this.formData = formData;
        this.displayResult = displayResult;
        this.getNota = getNota;
    }

    // Método que debe ser implementado por cada materia
    calcular() {
        throw new Error('calcular() debe ser implementado por cada materia específica');
    }

    // Métodos auxiliares comunes
    calcularPromedioPonderado(notas, pesos) {
        if (notas.length !== pesos.length || notas.length === 0) return NaN;
        const sumaPonderada = notas.reduce((sum, nota, i) => sum + nota * pesos[i], 0);
        const sumaPesos = pesos.reduce((sum, peso) => sum + peso, 0);
        return sumaPesos > 0 ? sumaPonderada / sumaPesos : NaN;
    }

    obtenerNotaMinima(notas) {
        return notas.length > 0 ? Math.min(...notas) : Infinity;
    }

    esCalculoParcial(totalCampos, camposCompletos) {
        return camposCompletos < totalCampos;
    }
}