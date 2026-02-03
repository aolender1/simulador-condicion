import { useState, useEffect } from 'react'

const materiasConfig = {
  'calculo1-2025': {
    nombre: '1- Calculo I (2025)',
    tps: 0,
    parciales: 6,
    nombresParciales: [
      'TPE Individual Unidades 1-2',
      'Trabajo Grupal Unidades 1-2',
      'TPE Individual Unidad 3',
      'Trabajo Grupal Unidad 3',
      'TPE Individual Unidad 4',
      'Trabajo Grupal Final'
    ],
    pesos: [0.5, 0.5, 0.5, 0.5, 0.5, 0.5],
    condiciones: {
      promocion: { minNotaParcial: 1, minPromedioGeneral: 75, minTpsAprobados: 0 },
      regular: { minNotaParcial: 1, minPromedioGeneral: 50, minTpsAprobados: 0 }
    }
  },
  'introalgebra-2025': {
    nombre: '1- Introduccion al Algebra (2025)',
    tps: 0,
    parciales: 4,
    nombresParciales: [
      'Trabajo Teórico-Práctico Individual 1-2',
      'Trabajo Práctico Grupal 1-2',
      'Trabajo Teórico-Práctico Individual 3-4',
      'Trabajo Práctico Grupal 3-4'
    ],
    pesos: [0.2, 0.8, 0.2, 0.8],
    condiciones: {
      promocion: { minNotaParcial: 1, minPromedioGeneral: 75, minTpsAprobados: 0 },
      regular: { minNotaParcial: 1, minPromedioGeneral: 60, minTpsAprobados: 0 }
    }
  },
  'ctys-2025': {
    nombre: '1- Ciencia, Tecnología y Sociedad (2025)',
    asistencia: true,
    parciales: 1,
    tps: 2,
    nombresParciales: ['Trabajo Integrador Final'],
    nombresTps: ['TP1', 'TP2'],
    condiciones: {
      promocion: { minAsistencia: 75, minTP1: 70, minTP2: 70, minTIF: 60 },
      regular: { minAsistencia: 75, minTP1: 60, minTP2: 60, minTIF: 50 }
    }
  },
  'elementosprog-2025': {
    nombre: '1- Elementos de Programacion (2025)',
    asistencia: true,
    parciales: 2,
    tps: 8,
    condiciones: {
      promocion: { minAsistencia: 75, minNotaParcial: 60, minPromedioGeneral: 75, minTpsAprobados: 8 },
      regular: { minAsistencia: 75, minNotaParcial: 50, minPromedioGeneral: 50, minTpsAprobados: 6 }
    }
  },
  'introdatos-2025': {
    nombre: '1- Introduccion a los Datos (2025)',
    asistencia: true,
    parciales: 2,
    tps: 10,
    condiciones: {
      promocion: { minAsistencia: 75, minNotaParcial: 60, minPromedioGeneral: 75, minTpsAprobados: 10 },
      regular: { minAsistencia: 75, minNotaParcial: 50, minPromedioGeneral: 50, minTpsAprobados: 7 }
    }
  },
  'algebramatricial-2025': {
    nombre: '2- Algebra Matricial (2025)',
    tps: 0,
    parciales: 4,
    nombresParciales: [
      'Parcial 1',
      'Trabajo Práctico Individual 1',
      'Parcial 2',
      'Trabajo Práctico Individual 2'
    ],
    condiciones: {
      promocion: { minNotaParcial: 60, minPromedioGeneral: 75, minTpsAprobados: 0 },
      regular: { minNotaParcial: 50, minPromedioGeneral: 50, minTpsAprobados: 0 }
    }
  }
}

function Calculadora() {
  const [selectedMateria, setSelectedMateria] = useState('')
  const [formData, setFormData] = useState({})
  const [resultado, setResultado] = useState(null)

  const materia = selectedMateria ? materiasConfig[selectedMateria] : null

  const handleInputChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const calcularCondicion = (e) => {
    e.preventDefault()
    if (!materia) return

    const getNota = (name) => {
      const val = formData[name]
      return val !== undefined && val !== '' ? parseFloat(val) : NaN
    }

    let condicion = 'LIBRE'
    let descripcion = ''
    let icon = '❌'
    let cssClass = 'libre'

    const cond = materia.condiciones

    if (selectedMateria === 'ctys-2025') {
      const asistencia = getNota('asistencia')
      const tp1 = getNota('tp1')
      const tp2 = getNota('tp2')
      const tif = getNota('parcial1')

      if (isNaN(asistencia) || isNaN(tp1) || isNaN(tp2) || isNaN(tif)) {
        setResultado({ condicion: 'Error', descripcion: 'Completa todos los campos', icon: '⚠️', cssClass: 'libre' })
        return
      }

      if (asistencia >= cond.promocion.minAsistencia &&
          tp1 >= cond.promocion.minTP1 &&
          tp2 >= cond.promocion.minTP2 &&
          tif >= cond.promocion.minTIF) {
        condicion = 'PROMOCIONADO'
        icon = '🎉'
        cssClass = 'promocionado'
        descripcion = 'Cumples con todos los requisitos de promoción'
      } else if (asistencia >= cond.regular.minAsistencia &&
                 tp1 >= cond.regular.minTP1 &&
                 tp2 >= cond.regular.minTP2 &&
                 tif >= cond.regular.minTIF) {
        condicion = 'REGULAR'
        icon = '📝'
        cssClass = 'regular'
        descripcion = 'Cumples con los requisitos de regularidad'
      } else {
        descripcion = 'No cumples con los requisitos mínimos'
      }
    } else {
      const notas = []
      for (let i = 1; i <= materia.parciales; i++) {
        const nota = getNota(`parcial${i}`)
        if (isNaN(nota)) {
          setResultado({ condicion: 'Error', descripcion: 'Completa todos los campos', icon: '⚠️', cssClass: 'libre' })
          return
        }
        notas.push(nota)
      }

      let asistencia = 100
      if (materia.asistencia) {
        asistencia = getNota('asistencia')
        if (isNaN(asistencia)) {
          setResultado({ condicion: 'Error', descripcion: 'Completa todos los campos', icon: '⚠️', cssClass: 'libre' })
          return
        }
      }

      let tpsAprobados = materia.tps
      if (materia.tps > 0 && !materia.nombresTps) {
        tpsAprobados = getNota('tpsAprobados')
        if (isNaN(tpsAprobados)) tpsAprobados = 0
      }

      let promedio
      if (materia.pesos) {
        promedio = notas.reduce((sum, nota, i) => sum + nota * materia.pesos[i], 0) / 
                   materia.pesos.reduce((a, b) => a + b, 0)
      } else {
        promedio = notas.reduce((a, b) => a + b, 0) / notas.length
      }

      const minNota = Math.min(...notas)

      const cumpleAsistenciaPromo = !cond.promocion.minAsistencia || asistencia >= cond.promocion.minAsistencia
      const cumpleAsistenciaReg = !cond.regular.minAsistencia || asistencia >= cond.regular.minAsistencia
      const cumpleNotaMinPromo = !cond.promocion.minNotaParcial || minNota >= cond.promocion.minNotaParcial
      const cumpleNotaMinReg = !cond.regular.minNotaParcial || minNota >= cond.regular.minNotaParcial
      const cumpleTpsPromo = !cond.promocion.minTpsAprobados || tpsAprobados >= cond.promocion.minTpsAprobados
      const cumpleTpsReg = !cond.regular.minTpsAprobados || tpsAprobados >= cond.regular.minTpsAprobados

      if (cumpleAsistenciaPromo && cumpleNotaMinPromo && cumpleTpsPromo && promedio >= cond.promocion.minPromedioGeneral) {
        condicion = 'PROMOCIONADO'
        icon = '🎉'
        cssClass = 'promocionado'
        descripcion = `Promedio: ${promedio.toFixed(1)}%. Cumples con todos los requisitos de promoción.`
      } else if (cumpleAsistenciaReg && cumpleNotaMinReg && cumpleTpsReg && promedio >= cond.regular.minPromedioGeneral) {
        condicion = 'REGULAR'
        icon = '📝'
        cssClass = 'regular'
        descripcion = `Promedio: ${promedio.toFixed(1)}%. Cumples con los requisitos de regularidad.`
      } else {
        descripcion = `Promedio: ${promedio.toFixed(1)}%. No cumples con los requisitos mínimos.`
      }
    }

    setResultado({ condicion, descripcion, icon, cssClass })
  }

  const renderInputs = () => {
    if (!materia) {
      return <div className="info-message">Selecciona una materia para ver los campos disponibles.</div>
    }

    const inputs = []

    if (materia.asistencia) {
      inputs.push(
        <div key="asistencia" className="form-group">
          <label>Asistencia (%):</label>
          <input
            type="number"
            min="0"
            max="100"
            step="0.1"
            placeholder="0-100"
            value={formData.asistencia || ''}
            onChange={(e) => handleInputChange('asistencia', e.target.value)}
          />
        </div>
      )
    }

    if (materia.parciales > 0) {
      for (let i = 1; i <= materia.parciales; i++) {
        const nombre = materia.nombresParciales?.[i - 1] || `Parcial ${i}`
        let max = 100
        let placeholder = '0-100'

        if (selectedMateria === 'introalgebra-2025') {
          if (i % 2 !== 0) {
            max = 10
            placeholder = '0-10'
          } else {
            max = 80
            placeholder = '0-80'
          }
        }

        inputs.push(
          <div key={`parcial${i}`} className="form-group">
            <label>{nombre}:</label>
            <input
              type="number"
              min="0"
              max={max}
              step="0.1"
              placeholder={placeholder}
              value={formData[`parcial${i}`] || ''}
              onChange={(e) => handleInputChange(`parcial${i}`, e.target.value)}
            />
          </div>
        )
      }
    }

    if (materia.tps > 0) {
      if (materia.nombresTps) {
        for (let i = 1; i <= materia.tps; i++) {
          inputs.push(
            <div key={`tp${i}`} className="form-group">
              <label>{materia.nombresTps[i - 1]}:</label>
              <input
                type="number"
                min="0"
                max="100"
                step="0.1"
                placeholder="0-100"
                value={formData[`tp${i}`] || ''}
                onChange={(e) => handleInputChange(`tp${i}`, e.target.value)}
              />
            </div>
          )
        }
      } else {
        inputs.push(
          <div key="tpsAprobados" className="form-group">
            <label>TPs Aprobados (de {materia.tps}):</label>
            <input
              type="number"
              min="0"
              max={materia.tps}
              step="1"
              placeholder={`0-${materia.tps}`}
              value={formData.tpsAprobados || ''}
              onChange={(e) => handleInputChange('tpsAprobados', e.target.value)}
            />
          </div>
        )
      }
    }

    return inputs
  }

  const handleMateriaChange = (e) => {
    setSelectedMateria(e.target.value)
    setFormData({})
    setResultado(null)
  }

  return (
    <div className="main-content">
      <div className="container">
        <h3>Calculadora de Condición</h3>
        <form onSubmit={calcularCondicion}>
          <div className="form-group">
            <label>Materia:</label>
            <select 
              className="materia-select"
              value={selectedMateria} 
              onChange={handleMateriaChange}
            >
              <option value="">Selecciona una materia</option>
              {Object.entries(materiasConfig).map(([key, m]) => (
                <option key={key} value={key}>{m.nombre}</option>
              ))}
            </select>
          </div>
          {renderInputs()}
          <button type="submit" disabled={!selectedMateria}>Calcular Condición</button>
        </form>
      </div>
      <div className="results-container">
        <h3>Resultado</h3>
        <div className="icon-placeholder">{resultado?.icon || '📊'}</div>
        <p className={`condicion-final ${resultado?.cssClass || ''}`}>
          {resultado?.condicion || 'Esperando datos...'}
        </p>
        <p className="descripcion-condicion">
          {resultado?.descripcion || 'Selecciona una materia y completa los campos para calcular tu condición.'}
        </p>
      </div>
    </div>
  )
}

export default Calculadora