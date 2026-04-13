# 📅 Calendario UNSL - Sistema de Gestión Académica

Aplicación web para gestionar eventos académicos, contactos y envío de alertas automáticas por email. Incluye autenticación con Google OAuth y panel de administración completo.

## ✨ Características

### 🔐 Autenticación
- Login con Google OAuth (Neon Auth).
- Control de acceso por lista de emails permitidos.
- Sesiones persistentes.

### 📆 Gestión de Eventos
- Crear, editar y eliminar eventos académicos
- Calendario interactivo con vistas mensual, semanal y de lista
- Colores personalizados por evento
- Zona horaria local (GMT-3)
- Formato 24 horas

### 📧 Sistema de Alertas
- Envío de emails a lista de contactos
- Integración con Resend API
- Estado de alertas (pendiente/enviado)
- Modo de prueba para desarrollo

### 👥 Gestión de Contactos
- Agregar/eliminar contactos (email + teléfono)
- Lista completa de destinatarios de alertas

### 📚 Simulador de Correlatividades (Nuevo)
- Visualización interactiva del plan de estudios.
- **Sistema de marcado cíclico**: Regular -> Aprobada -> Pendiente (**optimizado para Mobile**).
- Detección automática de materias habilitadas/bloqueadas según requisitos.
- Tooltips informativos con requisitos faltantes.
- Links directos a programas oficiales de cada materia.

### 🎨 Interfaz
- Tema claro/oscuro (con persistencia).
- Diseño responsive y optimizado para mobile (PWA Ready).
- Animaciones suaves y transiciones modernas.

## 🔗 Producción
La aplicación se encuentra desplegada en: [**https://www.unsldatos.com/**](https://www.unsldatos.com/)

## 🛠️ Stack Tecnológico

### Frontend
- **React 18** + **Vite**
- **FullCalendar** - Calendario interactivo
- **CSS Modules** - Estilos con variables CSS

### Backend
- **Express.js** - API REST
- **Neon PostgreSQL** - Base de datos serverless
- **Neon Auth** - Autenticación con Google OAuth
- **Resend** - Envío de emails

### Deploy
- **Vercel** - Hosting y serverless functions

## 🚀 Instalación Local

### Pre-requisitos
- Node.js 18+
- Cuenta en [Neon.tech](https://neon.tech)
- Cuenta en [Resend.com](https://resend.com)

### Pasos

1. **Clonar el repositorio**
```bash
git clone https://github.com/aolender1/simulador-condicion.git
cd simulador-condicion
```

2. **Instalar dependencias**
```bash
npm install
```

3. **Configurar variables de entorno**

Crea un archivo `.env` en la raíz:

```env
# Base de datos Neon
DATABASE_URL=postgresql://user:password@host/database?sslmode=require

# Neon Auth
VITE_NEON_AUTH_URL=https://your-project.neonauth.region.aws.neon.tech/database/auth

# Resend
RESEND_API_KEY=re_your_api_key

# Emails permitidos (separados por coma)
ALLOWED_EMAILS=admin@gmail.com,otro@gmail.com

# Modo de prueba (true = solo envía a RESEND_TEST_EMAIL)
RESEND_TESTING_MODE=true
RESEND_TEST_EMAIL=test@gmail.com
```

4. **Crear tablas en la base de datos**
```bash
npm run setup-db
```

5. **Ejecutar en desarrollo**
```bash
npm run dev        # Frontend (puerto 5173)
npm run server     # Backend (puerto 3001)
```

## � Deploy en Vercel

### 1. Instalar Vercel CLI
```bash
npm install -g vercel
```

### 2. Deploy
```bash
vercel --prod
```

### 3. Configurar Variables de Entorno

En el dashboard de Vercel → Settings → Environment Variables, agrega:
- `DATABASE_URL`
- `VITE_NEON_AUTH_URL`
- `RESEND_API_KEY`
- `ALLOWED_EMAILS`
- `RESEND_TESTING_MODE`
- `RESEND_TEST_EMAIL`

### 4. Configurar Neon Auth

En Neon Console → Auth → Configuration:
- **Allowed Redirect URLs**: `https://www.unsldatos.com/admin`
- **Allowed Origins**: `https://www.unsldatos.com`

### 5. (Opcional) Dominio Personalizado

Para usar Resend sin restricciones, necesitas un dominio propio:
1. Compra un dominio (ej: Namecheap)
2. Conéctalo a Vercel (Settings → Domains)
3. Verifica el dominio en Resend
4. Actualiza `RESEND_TESTING_MODE=false`

## 📂 Estructura del Proyecto

```
simulador-condicion/
├── src/
│   ├── components/
│   │   ├── EventsManager.jsx    # CRUD de eventos
│   │   ├── ContactsManager.jsx  # CRUD de contactos
│   │   └── ConfirmModal.jsx     # Modal de confirmación
│   ├── pages/
│   │   ├── Calendar.jsx         # Vista del calendario
│   │   └── Login.jsx            # Página de login
│   ├── lib/
│   │   └── auth.js              # Cliente de Neon Auth
│   ├── App.jsx                  # Componente principal
│   └── main.jsx                 # Entry point
├── server.js                    # API Express
├── vercel.json                  # Configuración de Vercel
└── package.json
```

## 🔧 Scripts Disponibles

```bash
npm run dev          # Ejecutar frontend en desarrollo
npm run server       # Ejecutar backend en desarrollo
npm run build        # Build de producción
npm run preview      # Preview del build
npm run setup-db     # Crear tablas en Neon
```

## 🗄️ Base de Datos

### Tabla: `events`
```sql
id, materia, title, start_date, end_date, color, alert_status, created_at
```

### Tabla: `contacts`
```sql
id, email, phone, created_at
```

## 🤝 Contribuir

1. Fork el repositorio
2. Crea una rama: `git checkout -b feature/nueva-funcionalidad`
3. Commit: `git commit -m 'Agrega nueva funcionalidad'`
4. Push: `git push origin feature/nueva-funcionalidad`
5. Abre un Pull Request

## 📄 Licencia

MIT License - Ver [LICENSE](LICENSE) para más detalles.

## 👨‍💻 Autor

Desarrollado por [aolender](https://github.com/aolender1)

---

**¿Problemas?** Abre un [issue](https://github.com/aolender1/simulador-condicion/issues)