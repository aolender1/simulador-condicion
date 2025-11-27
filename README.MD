# Simulador de Condición - UNSL

Un simulador interactivo que permite a los estudiantes de la Universidad Nacional de San Luis (UNSL) calcular su condición final en diferentes materias según el régimen de aprobación vigente, con un calendario integrado para gestionar actividades académicas.

## 📚 Descripción

Esta aplicación web permite a los estudiantes seleccionar una materia y simular el resultado de su cursada ingresando las notas de sus evaluaciones. El simulador calcula automáticamente si el estudiante promociona, regulariza o queda libre según las reglas específicas de cada materia. Además, incluye un calendario interactivo para visualizar y gestionar todas las actividades académicas.

## ✨ Características

### Simulador de Condición
- **Regímenes de aprobación personalizados**: Cada materia tiene su propio sistema de evaluación.
- **Resultados detallados**: Muestra no solo la condición final, sino también la explicación y el promedio obtenido.
- **Interfaz intuitiva**: Fácil de usar con mensajes claros y campos de entrada validados.
- **Validación en tiempo real**: Verifica que las notas ingresadas estén en el rango correcto.

### Calendario de Actividades
- **Integración con Google Sheets**: Las actividades se cargan automáticamente desde una hoja de cálculo de Google.
- **Vista mensual y de lista**: Alterna entre diferentes vistas del calendario según tu preferencia.
- **Modal de detalles**: Al hacer clic en una actividad, se muestra un modal con información detallada (materia, título, fecha de inicio y fin).
- **Marcado de actividades completadas**: Checkbox para marcar actividades como completadas, con persistencia en localStorage.
- **Indicador visual**: Las actividades completadas se muestran con un estilo diferenciado (tachadas).
- **Colores personalizados**: Cada actividad puede tener su propio color para mejor organización.

### Diseño y Experiencia de Usuario
- **Diseño responsive**: Funciona perfectamente en dispositivos móviles y de escritorio.
- **Tema claro/oscuro**: Cambia fácilmente entre modo claro y oscuro según tu preferencia.
- **Animaciones suaves**: Transiciones y efectos visuales para una mejor experiencia.
- **Persistencia de datos**: Guarda tus preferencias de tema y actividades completadas localmente.

## 🚀 Cómo usar

### Simulador de Condición
1. Abre la aplicación en tu navegador
2. Selecciona la materia que deseas simular
3. Ingresa tus notas en los campos correspondientes (en escala 0-100)
4. Presiona el botón "Calcular Condición"
5. ¡Listo! Verás tu condición final con una explicación detallada

### Calendario de Actividades
1. Visualiza todas tus actividades en el calendario del lado derecho
2. Navega entre meses usando los botones "Anterior" y "Siguiente"
3. Haz clic en cualquier actividad para ver sus detalles
4. Marca las actividades como completadas usando el checkbox en el modal
5. Las actividades completadas se mostrarán tachadas en el calendario

## ⚙️ Tecnologías utilizadas

- HTML5
- CSS3 (con variables CSS para temas)
- JavaScript (ES6+)
- **FullCalendar.js** - Librería para el calendario interactivo
- **PapaParse** - Parser de CSV para integración con Google Sheets
- Diseño responsive
- LocalStorage para persistencia de datos

## 🛠️ Personalización

### Agregar nuevas materias
El simulador está diseñado para ser fácilmente extensible. Para agregar nuevas materias, edita el archivo `materias.json` y agrega la configuración según el formato establecido.

### Gestionar actividades del calendario
Las actividades del calendario se cargan desde una hoja de cálculo de Google Sheets. Para agregar, editar o eliminar actividades:
1. Accede a la hoja de cálculo vinculada
2. Agrega o modifica las filas con las siguientes columnas:
   - `Materia`: Nombre de la materia
   - `title`: Título de la actividad
   - `start`: Fecha de inicio (formato ISO: YYYY-MM-DD o YYYY-MM-DDTHH:mm:ss)
   - `end`: Fecha de fin (opcional)
   - `color`: Color personalizado para el evento (opcional)
3. Los cambios se reflejarán automáticamente en el calendario al recargar la página

## 🤝 Contribuciones

Las contribuciones son bienvenidas. Si deseas agregar nuevas materias o mejorar la funcionalidad:

1. Haz fork del repositorio
2. Crea una nueva rama (`git checkout -b feature/nueva-materia`)
3. Realiza tus cambios
4. Haz commit de tus cambios (`git commit -m 'Agrega nueva materia XYZ'`)
5. Sube tus cambios (`git push origin feature/nueva-materia`)
6. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo licencia MIT.

## 👨‍💻 Autor

Desarrollado por [aolender](https://github.com/aolender1)

---

¿Encontraste un error o tienes sugerencias? Abre un issue en este repositorio.