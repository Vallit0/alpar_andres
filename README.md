# 🤖 AlparBot - Chatbot con Azure AI Projects

Un chatbot moderno y elegante construido con Azure AI Projects, diseñado para ser desplegado en **Azure Static Web Apps** o **GitHub Pages**.

## ✨ Características

- 🎨 **Interfaz moderna**: Diseño responsive y atractivo con modo oscuro
- 🔄 **Conversaciones persistentes**: Mantiene el contexto de la conversación
- 📱 **Responsive**: Funciona perfectamente en móviles y escritorio
- 🚀 **Deploy automático**: Configurado para Azure Static Web Apps y GitHub Pages
- ⚡ **Tiempo real**: Respuestas instantáneas del agente de Azure AI
- 🎯 **Fácil configuración**: Solo necesitas configurar las variables de entorno
- 📝 **Markdown**: Soporte completo para formato Markdown en respuestas
- 📊 **Gráficos**: Visualización de datos con Chart.js
- 🎭 **Fuentes personalizadas**: Roboto y Victor Mono para mejor legibilidad

## 🛠️ Tecnologías Utilizadas

- **Backend**: Node.js + Express
- **Frontend**: HTML5, CSS3, JavaScript vanilla
- **AI**: Azure AI Projects
- **Deploy**: GitHub Pages + GitHub Actions
- **Styling**: CSS Grid, Flexbox, Gradientes

## 📋 Prerrequisitos

- Node.js 18+ instalado
- Cuenta de Azure con AI Projects configurado
- Repositorio de GitHub

## 🚀 Instalación y Configuración

### 1. Clonar el repositorio

```bash
git clone <tu-repositorio>
cd alpar-chatbot
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar variables de entorno

Copia el archivo de ejemplo y configura tus credenciales:

```bash
cp env.example .env
```

Edita el archivo `.env` con tus credenciales de Azure:

```env
# Azure AI Projects Configuration
AZURE_CLIENT_ID=tu_client_id
AZURE_CLIENT_SECRET=tu_client_secret
AZURE_TENANT_ID=tu_tenant_id
AZURE_PROJECT_URL=https://vallebances-resource.services.ai.azure.com/api/projects/vallebances
AZURE_AGENT_ID=asst_9LyDDRRIZfvCfZXfLOJ8GKvh

# Server Configuration
PORT=5000
NODE_ENV=production
```

### 4. Ejecutar localmente

```bash
npm start
```

El chatbot estará disponible en `http://localhost:3000`

## 🌐 Opciones de Deployment

### 🚀 Opción 1: Azure Static Web Apps (Recomendado)

**Ventajas:**
- ✅ **Gratis** para proyectos pequeños
- ✅ **Backend y frontend** en un solo servicio
- ✅ **Integración nativa** con Azure
- ✅ **Perfecto** para tu caso de uso

**Pasos:**

1. **Crear Azure Static Web App:**
   ```bash
   # Instalar Azure CLI
   az login
   az staticwebapp create \
     --name "alpar-chatbot" \
     --resource-group "myResourceGroup" \
     --source "https://github.com/tu-usuario/tu-repo" \
     --location "Central US" \
     --branch "main"
   ```

2. **Configurar Secrets en GitHub:**
   - Ve a tu repositorio > Settings > Secrets and variables > Actions
   - Agrega: `AZURE_STATIC_WEB_APPS_API_TOKEN` (lo obtienes de Azure)

3. **Hacer push:**
   ```bash
   git add .
   git commit -m "Deploy to Azure Static Web Apps"
   git push origin main
   ```

### 📄 Opción 2: GitHub Pages (Solo Frontend)

**Limitación:** Solo sirve archivos estáticos, necesitarás un backend separado.

**Pasos:**

1. **Configurar GitHub Pages:**
   - Ve a Settings > Pages
   - Selecciona "GitHub Actions" como fuente

2. **Configurar Secrets:**
   - `AZURE_CLIENT_ID`, `AZURE_CLIENT_SECRET`, `AZURE_TENANT_ID`
   - `AZURE_PROJECT_URL`, `AZURE_AGENT_ID`

3. **Hacer push:**
   ```bash
   git add .
   git commit -m "Deploy to GitHub Pages"
   git push origin main
   ```

### 🔧 Opción 3: Vercel (Todo en uno)

**Ventajas:**
- ✅ **Gratis** y fácil
- ✅ **Soporte completo** para Node.js
- ✅ **Deployment automático**

**Pasos:**

1. **Conectar con Vercel:**
   - Ve a [vercel.com](https://vercel.com)
   - Conecta tu repositorio de GitHub
   - Configura las variables de entorno

2. **Variables de entorno en Vercel:**
   - `AZURE_CLIENT_ID`, `AZURE_CLIENT_SECRET`, `AZURE_TENANT_ID`
   - `AZURE_PROJECT_URL`, `AZURE_AGENT_ID`

3. **Deploy automático:**
   - Cada push a `main` se despliega automáticamente

## 📁 Estructura del Proyecto

```
alpar-chatbot/
├── public/                 # Archivos estáticos para GitHub Pages
│   ├── index.html         # Página principal
│   ├── styles.css         # Estilos CSS
│   ├── script.js          # Lógica del frontend
│   ├── 404.html           # Página de error
│   └── _redirects         # Configuración de redirecciones
├── .github/
│   └── workflows/
│       └── deploy.yml     # Workflow de GitHub Actions
├── server.js              # Servidor Express (para desarrollo local)
├── package.json           # Dependencias y scripts
├── env.example            # Ejemplo de variables de entorno
└── README.md              # Este archivo
```

## 🔧 Scripts Disponibles

- `npm start`: Inicia el servidor de desarrollo
- `npm run dev`: Inicia el servidor con nodemon (desarrollo)
- `npm run build`: Construye el proyecto
- `npm run deploy`: Despliega a GitHub Pages

## 🎨 Personalización

### Cambiar colores

Edita el archivo `public/styles.css` y modifica las variables CSS:

```css
/* Cambiar el gradiente principal */
background: linear-gradient(135deg, #tu-color-1 0%, #tu-color-2 100%);
```

### Modificar el agente

Cambia el `AZURE_AGENT_ID` en tu archivo `.env` para usar un agente diferente.

### Personalizar la interfaz

- **Logo**: Modifica el icono en `public/index.html`
- **Mensajes**: Cambia los textos de bienvenida en `public/script.js`
- **Estilos**: Personaliza `public/styles.css`

## 🐛 Solución de Problemas

### Error de autenticación de Azure

1. Verifica que las credenciales en `.env` sean correctas
2. Asegúrate de que tu aplicación Azure tenga los permisos necesarios
3. Revisa que el `AZURE_AGENT_ID` sea válido

### El chatbot no responde

1. Verifica la conexión a internet
2. Revisa la consola del navegador para errores
3. Comprueba que el servidor esté ejecutándose

### Problemas de deploy

1. Verifica que los secrets estén configurados correctamente
2. Revisa los logs de GitHub Actions
3. Asegúrate de que el workflow esté en la rama correcta

## 📝 API Endpoints

### POST /api/chat

Envía un mensaje al chatbot.

**Request:**
```json
{
  "message": "Hola, ¿cómo estás?",
  "threadId": "thread_123" // opcional
}
```

**Response:**
```json
{
  "response": "¡Hola! Estoy muy bien, gracias por preguntar.",
  "threadId": "thread_123",
  "conversation": [...]
}
```

### GET /api/health

Verifica el estado del servidor y la conexión con Azure.

**Response:**
```json
{
  "status": "healthy",
  "agent": "AlparBot",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## 🙏 Agradecimientos

- [Azure AI Projects](https://azure.microsoft.com/en-us/products/ai-services/ai-projects) por la plataforma de IA
- [GitHub Pages](https://pages.github.com/) por el hosting gratuito
- [Font Awesome](https://fontawesome.com/) por los iconos

---

**Desarrollado con ❤️ por Alpar**
"# alpar_andres" 
