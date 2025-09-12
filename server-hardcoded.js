const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const { AIProjectClient } = require('@azure/ai-projects');
const { DefaultAzureCredential } = require('@azure/identity');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// 🔥 CREDENCIALES HARDCODEADAS - CONFIGURACIÓN DEL PORTAL AZURE
const AZURE_CONFIG = {
  PROJECT_URL: 'https://senorialesbot-resource.services.ai.azure.com/api/projects/senorialesbot',
  AGENT_ID: 'asst_T2Ng0OAbJRfXNvzATw7jINtd'
};

// Initialize Azure AI Projects client
let projectClient;
let agent;

async function initializeAzureClient() {
  try {
    // Usar DefaultAzureCredential (funciona con Azure CLI, Managed Identity, etc.)
    projectClient = new AIProjectClient(
      AZURE_CONFIG.PROJECT_URL,
      new DefaultAzureCredential()
    );
    
    agent = await projectClient.agents.getAgent(AZURE_CONFIG.AGENT_ID);
    console.log(`✅ Azure AI Projects initialized. Agent: ${agent.name}`);
  } catch (error) {
    console.error('❌ Error initializing Azure AI Projects:', error);
    console.log('⚠️ Continuando en modo demo...');
  }
}

// Store active threads (in production, use a proper database)
const activeThreads = new Map();

// Fallback response generator for when Azure AI Projects is not available
function generateFallbackResponse(userMessage) {
  const responses = [
    `¡Hola! Soy ALPAR, tu asistente virtual. Recibí tu mensaje: "${userMessage}". 

Actualmente estoy funcionando en modo de demostración ya que los servicios de Azure AI Projects no están configurados. 

**¿Qué puedo hacer por ti?**
- Responder preguntas generales
- Ayudarte con información básica
- Mostrarte las capacidades de la interfaz

Para habilitar las funcionalidades completas de IA, configura las credenciales de Azure.`,

    `¡Perfecto! Entiendo que quieres: "${userMessage}".

Como asistente ALPAR, estoy aquí para ayudarte. Aunque actualmente estoy en modo de demostración, puedo:

**📋 Funcionalidades disponibles:**
- ✅ Interfaz de chat interactiva
- ✅ Renderizado de Markdown
- ✅ Soporte para gráficos y tablas
- ✅ Respuestas contextuales básicas

**🔧 Para funcionalidad completa:**
Configura las credenciales de Azure AI Projects en el código.`,

    `¡Excelente pregunta! "${userMessage}" es muy interesante.

**🤖 Estado actual:** Modo demostración
**🎯 Capacidades:** Interfaz completa + respuestas básicas
**🚀 Próximo paso:** Configurar autenticación de Azure

¿Hay algo específico en lo que pueda ayudarte mientras tanto?`
  ];
  
  // Simple logic to provide contextual responses
  const message = userMessage.toLowerCase();
  
  if (message.includes('hola') || message.includes('hello') || message.includes('hi')) {
    return responses[0];
  } else if (message.includes('ayuda') || message.includes('help') || message.includes('qué') || message.includes('que')) {
    return responses[1];
  } else {
    return responses[2];
  }
}

// API Routes
app.post('/api/chat', async (req, res) => {
  try {
    const { message, threadId } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Check if Azure AI Projects is properly initialized
    if (!projectClient || !agent) {
      console.log('⚠️ Azure AI Projects not initialized, using fallback response');
      
      // Generate a fallback response
      const fallbackResponse = generateFallbackResponse(message);
      
      return res.json({
        response: fallbackResponse,
        threadId: threadId || 'fallback-thread',
        conversation: [
          { role: 'user', content: message, id: 'user-msg' },
          { role: 'assistant', content: fallbackResponse, id: 'assistant-msg' }
        ]
      });
    }

    let currentThreadId = threadId;
    
    // Create new thread if none exists
    if (!currentThreadId) {
      const thread = await projectClient.agents.threads.create();
      currentThreadId = thread.id;
      activeThreads.set(currentThreadId, { createdAt: new Date() });
      console.log(`📝 Created new thread: ${currentThreadId}`);
    }

    // Create user message
    const userMessage = await projectClient.agents.messages.create(
      currentThreadId, 
      "user", 
      message
    );
    console.log(`💬 User message created: ${userMessage.id}`);

    // Create and run agent
    let run = await projectClient.agents.runs.create(currentThreadId, agent.id);
    console.log(`🚀 Run started: ${run.id}`);

    // Poll until completion
    while (run.status === "queued" || run.status === "in_progress") {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      run = await projectClient.agents.runs.get(currentThreadId, run.id);
    }

    if (run.status === "failed") {
      console.error(`❌ Run failed:`, run.lastError);
      return res.status(500).json({ 
        error: 'Agent run failed', 
        details: run.lastError 
      });
    }

    console.log(`✅ Run completed with status: ${run.status}`);

    // Get all messages from thread
    const messages = await projectClient.agents.messages.list(currentThreadId, { order: "asc" });
    const conversation = [];

    for await (const msg of messages) {
      const content = msg.content.find((c) => c.type === "text" && "text" in c);
      if (content) {
        conversation.push({
          role: msg.role,
          content: content.text.value,
          id: msg.id
        });
      }
    }

    // Get the latest assistant message
    const assistantMessages = conversation.filter(msg => msg.role === 'assistant');
    const latestResponse = assistantMessages[assistantMessages.length - 1];

    res.json({
      response: latestResponse ? latestResponse.content : 'No response received',
      threadId: currentThreadId,
      conversation: conversation
    });

  } catch (error) {
    console.error('❌ Error in chat endpoint:', error);
    
    // Provide a fallback response even on error
    const fallbackResponse = generateFallbackResponse(req.body.message || 'Hello');
    
    res.json({
      response: fallbackResponse,
      threadId: req.body.threadId || 'error-thread',
      conversation: [
        { role: 'user', content: req.body.message || 'Hello', id: 'user-msg' },
        { role: 'assistant', content: fallbackResponse, id: 'assistant-msg' }
      ]
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  const isAzureConfigured = !!(projectClient && agent);
  
  res.json({ 
    status: 'healthy', 
    agent: agent ? agent.name : 'Not initialized',
    azureConfigured: isAzureConfigured,
    mode: isAzureConfigured ? 'full' : 'demo',
    timestamp: new Date().toISOString(),
    message: isAzureConfigured 
      ? 'Azure AI Projects fully configured' 
      : 'Running in demo mode - Azure AI Projects not configured'
  });
});

// Chart data endpoint
app.get('/api/chart-data/:type', async (req, res) => {
  try {
    const { type } = req.params;
    const { period = '30d', metric = 'usage' } = req.query;
    
    // Generate sample data based on type and parameters
    const chartData = generateChartData(type, period, metric);
    
    res.json({
      success: true,
      type: type,
      period: period,
      metric: metric,
      data: chartData
    });
  } catch (error) {
    console.error('Error generating chart data:', error);
    res.status(500).json({ 
      error: 'Error generating chart data', 
      details: error.message 
    });
  }
});

// Function to generate sample chart data
function generateChartData(type, period, metric) {
  const now = new Date();
  const days = period === '7d' ? 7 : period === '30d' ? 30 : 90;
  
  // Generate labels based on period
  const labels = [];
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    labels.push(date.toLocaleDateString('es-ES', { month: 'short', day: 'numeric' }));
  }
  
  // Generate data based on metric
  let data = [];
  switch (metric) {
    case 'usage':
      data = labels.map(() => Math.floor(Math.random() * 100) + 20);
      break;
    case 'performance':
      data = labels.map(() => Math.floor(Math.random() * 40) + 60);
      break;
    case 'errors':
      data = labels.map(() => Math.floor(Math.random() * 10));
      break;
    default:
      data = labels.map(() => Math.floor(Math.random() * 50) + 10);
  }
  
  return {
    labels: labels,
    datasets: [{
      label: getMetricLabel(metric),
      data: data,
      borderColor: '#2ecc71',
      backgroundColor: 'rgba(46, 204, 113, 0.2)',
      tension: type === 'line' ? 0.1 : 0
    }]
  };
}

function getMetricLabel(metric) {
  const labels = {
    'usage': 'Uso (%)',
    'performance': 'Rendimiento (%)',
    'errors': 'Errores',
    'requests': 'Solicitudes',
    'response_time': 'Tiempo de Respuesta (ms)'
  };
  return labels[metric] || 'Métrica';
}

// Serve the main page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Initialize and start server
async function startServer() {
  await initializeAzureClient();
  
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`🌐 Open http://localhost:${PORT} to view the chatbot`);
  });
}

startServer().catch(error => {
  console.error('❌ Failed to start server:', error);
  process.exit(1);
});
