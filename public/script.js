class AlparBot {
    constructor() {
        this.threadId = null;
        this.isLoading = false;
        this.isFirstMessage = true;
        this.initializeElements();
        this.setupEventListeners();
        this.initializeMarkdown();
        this.initializeCharts();
        this.checkServerHealth();
    }

    initializeElements() {
        this.chatMessages = document.getElementById('chatMessages');
        this.messageInput = document.getElementById('messageInput');
        this.sendButton = document.getElementById('sendButton');
        this.loadingOverlay = document.getElementById('loadingOverlay');
        this.welcomeSection = document.getElementById('welcomeSection');
        this.menuButton = document.getElementById('menuButton');
        this.addButton = document.getElementById('addButton');
        this.attachButton = document.getElementById('attachButton');
    }

    setupEventListeners() {
        // Send message on button click
        this.sendButton.addEventListener('click', () => this.sendMessage());
        
        // Send message on Enter key
        this.messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });

        // Detect when user is typing
        this.messageInput.addEventListener('input', () => {
            this.onUserTyping();
        });

        // Menu button functionality
        this.menuButton.addEventListener('click', () => {
            console.log('Menu clicked');
            // TODO: Implement menu functionality
        });

        // Add button functionality
        this.addButton.addEventListener('click', () => {
            console.log('Add clicked');
            // TODO: Implement add functionality
        });

        // Attach button functionality
        this.attachButton.addEventListener('click', () => {
            console.log('Attach clicked');
            // TODO: Implement file attachment
        });

        // Focus input on load
        this.messageInput.focus();
    }

    initializeMarkdown() {
        // Configure marked options for beautiful rendering
        if (typeof marked !== 'undefined') {
            marked.setOptions({
                highlight: function(code, lang) {
                    if (typeof hljs !== 'undefined' && lang && hljs.getLanguage(lang)) {
                        try {
                            return hljs.highlight(code, { language: lang }).value;
                        } catch (err) {
                            console.warn('Error highlighting code:', err);
                        }
                    }
                    return code;
                },
                breaks: true,           // Convert \n to <br>
                gfm: true,             // GitHub Flavored Markdown
                sanitize: false,       // Allow HTML
                smartLists: true,      // Better list handling
                smartypants: true,     // Smart quotes and dashes
                tables: true,          // Enable tables
                pedantic: false,       // Don't be strict about markdown
                renderer: new marked.Renderer()
            });
            
            // Custom renderer for better styling
            const renderer = new marked.Renderer();
            
            // Custom heading renderer
            renderer.heading = function(text, level) {
                const id = text.toLowerCase().replace(/[^\w]+/g, '-');
                return `<h${level} id="${id}" class="markdown-heading markdown-h${level}">${text}</h${level}>`;
            };
            
            // Custom paragraph renderer
            renderer.paragraph = function(text) {
                return `<p class="markdown-paragraph">${text}</p>`;
            };
            
            // Custom list renderer
            renderer.list = function(body, ordered) {
                const type = ordered ? 'ol' : 'ul';
                const className = ordered ? 'markdown-ordered-list' : 'markdown-unordered-list';
                return `<${type} class="${className}">${body}</${type}>`;
            };
            
            // Custom list item renderer
            renderer.listitem = function(text) {
                return `<li class="markdown-list-item">${text}</li>`;
            };
            
            // Custom blockquote renderer
            renderer.blockquote = function(quote) {
                return `<blockquote class="markdown-blockquote">${quote}</blockquote>`;
            };
            
            // Custom code renderer
            renderer.code = function(code, language) {
                const validLang = language && hljs.getLanguage(language) ? language : '';
                const highlighted = validLang ? hljs.highlight(code, { language: validLang }).value : code;
                return `<pre class="markdown-code-block"><code class="language-${validLang}">${highlighted}</code></pre>`;
            };
            
            // Custom inline code renderer
            renderer.codespan = function(code) {
                return `<code class="markdown-inline-code">${code}</code>`;
            };
            
            // Custom link renderer
            renderer.link = function(href, title, text) {
                const titleAttr = title ? ` title="${title}"` : '';
                return `<a href="${href}"${titleAttr} class="markdown-link" target="_blank" rel="noopener noreferrer">${text}</a>`;
            };
            
            // Custom table renderer
            renderer.table = function(header, body) {
                return `<table class="markdown-table">${header}${body}</table>`;
            };
            
            renderer.tablerow = function(content) {
                return `<tr class="markdown-table-row">${content}</tr>`;
            };
            
            renderer.tablecell = function(content, flags) {
                const type = flags.header ? 'th' : 'td';
                const className = flags.header ? 'markdown-table-header' : 'markdown-table-cell';
                return `<${type} class="${className}">${content}</${type}>`;
            };
            
            // Set the custom renderer
            marked.setOptions({ renderer: renderer });
        }
    }

    initializeCharts() {
        // Chart.js default configuration for dark theme
        if (typeof Chart !== 'undefined') {
            Chart.defaults.color = '#ecf0f1';
            Chart.defaults.borderColor = 'rgba(46, 204, 113, 0.3)';
            Chart.defaults.backgroundColor = 'rgba(46, 204, 113, 0.1)';
        }
    }

    async checkServerHealth() {
        try {
            const response = await fetch('/api/health');
            const data = await response.json();
            
            if (response.ok) {
                console.log('✅ Server connected:', data.agent);
                this.hideLoadingOverlay();
            } else {
                console.log('❌ Server error');
                this.hideLoadingOverlay();
            }
        } catch (error) {
            console.error('Health check failed:', error);
            this.hideLoadingOverlay();
        }
    }

    hideLoadingOverlay() {
        setTimeout(() => {
            this.loadingOverlay.classList.add('hidden');
        }, 1000);
    }

    async sendMessage() {
        const message = this.messageInput.value.trim();
        
        if (!message || this.isLoading) {
            return;
        }

        // Hide welcome section and show chat on first message
        if (this.isFirstMessage) {
            this.showChat();
            this.isFirstMessage = false;
        }

        // Add user message to chat
        this.addMessage('user', message);
        
        // Clear input and disable send button
        this.messageInput.value = '';
        this.setLoading(true);

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message: message,
                    threadId: this.threadId
                })
            });

            const data = await response.json();

            if (response.ok) {
                // Update thread ID if this is a new conversation
                if (!this.threadId) {
                    this.threadId = data.threadId;
                }

                // Add assistant response
                this.addMessage('assistant', data.response);
            } else {
                throw new Error(data.error || 'Error en la respuesta del servidor');
            }
        } catch (error) {
            console.error('Error sending message:', error);
            this.addMessage('assistant', 'Lo siento, hubo un error al procesar tu mensaje. Por favor, inténtalo de nuevo.');
        } finally {
            this.setLoading(false);
        }
    }

    showChat() {
        this.welcomeSection.classList.add('hide');
        this.chatMessages.classList.add('show');
        this.chatMessages.style.display = 'block';
    }

    addMessage(role, content) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${role}-message`;

        // For assistant messages, render directly as markdown without bubble
        if (role === 'assistant') {
            // Process content with Markdown support and special blocks
            const processedContent = this.processSpecialBlocks(content);
            const renderedContent = this.renderMarkdown(processedContent);
            
            // Create a simple div for assistant content (no bubble)
            const assistantContent = document.createElement('div');
            assistantContent.className = 'assistant-content';
            assistantContent.innerHTML = `<div class="markdown-content">${renderedContent}</div>`;
            
            messageDiv.appendChild(assistantContent);
            
            // Add message actions for assistant messages
            const actions = this.createMessageActions(role, content);
            messageDiv.appendChild(actions);
        } else {
            // User messages keep the bubble style
            const messageContent = document.createElement('div');
            messageContent.className = 'message-content';
            
            // Add message actions for user messages
            const actions = this.createMessageActions(role, content);
            messageDiv.appendChild(actions);
            
            // Render content with Markdown support
            const renderedContent = this.renderMarkdown(content);
            messageContent.innerHTML = `<div class="markdown-content">${renderedContent}</div>`;

            messageDiv.appendChild(messageContent);
        }

        this.chatMessages.appendChild(messageDiv);
        this.scrollToBottom();
        
        // Initialize collapsible blocks and render charts
        setTimeout(() => {
            this.initializeCollapsibleBlocks();
            this.renderCharts();
        }, 100);
    }

    createMessageActions(role, content) {
        const actions = document.createElement('div');
        actions.className = 'message-actions';
        
        // Copy button
        const copyButton = document.createElement('button');
        copyButton.className = 'action-button';
        copyButton.innerHTML = '<i class="fas fa-copy"></i>';
        copyButton.title = 'Copiar mensaje';
        copyButton.addEventListener('click', () => this.copyMessage(content));
        
        // Edit button (only for user messages)
        if (role === 'user') {
            const editButton = document.createElement('button');
            editButton.className = 'action-button';
            editButton.innerHTML = '<i class="fas fa-edit"></i>';
            editButton.title = 'Editar mensaje';
            editButton.addEventListener('click', () => this.editMessage(content, editButton.closest('.message')));
            actions.appendChild(editButton);
        }
        
        // Regenerate button (only for assistant messages)
        if (role === 'assistant') {
            const regenerateButton = document.createElement('button');
            regenerateButton.className = 'action-button';
            regenerateButton.innerHTML = '<i class="fas fa-redo"></i>';
            regenerateButton.title = 'Regenerar respuesta';
            regenerateButton.addEventListener('click', () => this.regenerateMessage(regenerateButton.closest('.message')));
            actions.appendChild(regenerateButton);
        }
        
        actions.appendChild(copyButton);
        return actions;
    }

    copyMessage(content) {
        navigator.clipboard.writeText(content).then(() => {
            // Show temporary feedback
            const button = event.target.closest('.action-button');
            const originalHTML = button.innerHTML;
            button.innerHTML = '<i class="fas fa-check"></i>';
            button.style.color = '#4CAF50';
            
            setTimeout(() => {
                button.innerHTML = originalHTML;
                button.style.color = '';
            }, 1000);
        }).catch(err => {
            console.error('Error copying message:', err);
        });
    }

    editMessage(content, messageElement) {
        // Create input field to edit the message
        const messageContent = messageElement.querySelector('.message-content');
        const originalContent = messageContent.innerHTML;
        
        const editInput = document.createElement('input');
        editInput.type = 'text';
        editInput.value = content;
        editInput.className = 'edit-input';
        editInput.style.cssText = `
            width: 100%;
            background: rgba(255, 255, 255, 0.1);
            border: 1px solid #007AFF;
            border-radius: 8px;
            padding: 8px 12px;
            color: white;
            font-size: 14px;
            outline: none;
        `;
        
        messageContent.innerHTML = '';
        messageContent.appendChild(editInput);
        editInput.focus();
        editInput.select();
        
        const handleEdit = () => {
            const newContent = editInput.value.trim();
            if (newContent && newContent !== content) {
                // Update the message content
                const renderedContent = this.renderMarkdown(newContent);
                messageContent.innerHTML = `<div class="markdown-content">${renderedContent}</div>`;
                
                // Re-send the edited message
                this.sendEditedMessage(newContent);
            } else {
                // Restore original content
                messageContent.innerHTML = originalContent;
            }
        };
        
        editInput.addEventListener('blur', handleEdit);
        editInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                handleEdit();
            } else if (e.key === 'Escape') {
                messageContent.innerHTML = originalContent;
            }
        });
    }

    regenerateMessage(messageElement) {
        // Find the user's original message
        const messages = Array.from(this.chatMessages.children);
        const currentIndex = messages.indexOf(messageElement);
        
        // Find the previous user message
        let userMessage = null;
        for (let i = currentIndex - 1; i >= 0; i--) {
            if (messages[i].classList.contains('user-message')) {
                userMessage = messages[i];
                break;
            }
        }
        
        if (userMessage) {
            const userContent = userMessage.querySelector('.markdown-content').textContent;
            
            // Remove the current assistant message
            messageElement.remove();
            
            // Re-send the user's message
            this.sendMessage(userContent);
        }
    }

    sendEditedMessage(newContent) {
        // Clear input and send the edited message
        this.messageInput.value = newContent;
        this.sendMessage();
    }

    processSpecialBlocks(content) {
        // Process thinking blocks (like "Thought for X seconds")
        content = content.replace(/Thought for (\d+) seconds?/gi, (match, seconds) => {
            return `<thinking-block seconds="${seconds}">${match}</thinking-block>`;
        });
        
        // Process reasoning blocks
        content = content.replace(/Reasoning:/gi, '<reasoning-block>Reasoning:');
        content = content.replace(/Final Answer:/gi, '</reasoning-block><final-answer>Final Answer:');
        content = content.replace(/Final answer:/gi, '</reasoning-block><final-answer>Final answer:');
        
        return content;
    }

    renderMarkdown(content) {
        // Check if marked is available
        if (typeof marked !== 'undefined') {
            try {
                // Parse and render markdown
                let html = marked.parse(content);
                
                // Process chart blocks
                html = this.processChartBlocks(html);
                
                // Process special blocks
                html = this.processSpecialBlocksHTML(html);
                
                return html;
            } catch (error) {
                console.warn('Error rendering markdown:', error);
                // Fallback to plain text with HTML escaping
                return this.escapeHtml(content);
            }
        } else {
            // Fallback to plain text with HTML escaping
            return this.escapeHtml(content);
        }
    }

    processSpecialBlocksHTML(html) {
        // Process thinking blocks
        html = html.replace(/<thinking-block seconds="(\d+)">(.*?)<\/thinking-block>/gi, (match, seconds, title) => {
            const blockId = 'thinking_' + Math.random().toString(36).substr(2, 9);
            return `
                <div class="collapsible-block" id="${blockId}">
                    <div class="collapsible-header" onclick="toggleCollapsible('${blockId}')">
                        <i class="fas fa-chevron-right collapsible-icon"></i>
                        <span class="collapsible-title">${title}</span>
                    </div>
                    <div class="collapsible-content">
                        <p>Procesando pensamiento por ${seconds} segundos...</p>
                    </div>
                </div>
            `;
        });

        // Process reasoning blocks
        html = html.replace(/<reasoning-block>(.*?)<\/reasoning-block>/gi, (match, content) => {
            const blockId = 'reasoning_' + Math.random().toString(36).substr(2, 9);
            return `
                <div class="collapsible-block" id="${blockId}">
                    <div class="collapsible-header" onclick="toggleCollapsible('${blockId}')">
                        <i class="fas fa-chevron-right collapsible-icon"></i>
                        <span class="collapsible-title">Razonamiento</span>
                    </div>
                    <div class="collapsible-content">
                        ${content}
                    </div>
                </div>
            `;
        });

        // Process final answer blocks
        html = html.replace(/<final-answer>(.*?)(?=<|$)/gi, (match, content) => {
            return `
                <div class="final-response">
                    <div class="final-response-text">${content}</div>
                </div>
            `;
        });

        return html;
    }

    initializeCollapsibleBlocks() {
        // Add click handlers for collapsible blocks
        const collapsibleBlocks = document.querySelectorAll('.collapsible-block');
        collapsibleBlocks.forEach(block => {
            const header = block.querySelector('.collapsible-header');
            if (header && !header.hasAttribute('data-initialized')) {
                header.setAttribute('data-initialized', 'true');
                header.addEventListener('click', () => {
                    this.toggleCollapsible(block.id);
                });
            }
        });
    }

    toggleCollapsible(blockId) {
        const block = document.getElementById(blockId);
        if (block) {
            block.classList.toggle('expanded');
        }
    }

    processChartBlocks(html) {
        // Look for chart blocks in the format: <chart type="line" data="..."></chart>
        const chartRegex = /<chart\s+type="([^"]+)"(?:\s+title="([^"]*)")?(?:\s+description="([^"]*)")?(?:\s+data="([^"]*)")?><\/chart>/gi;
        
        return html.replace(chartRegex, (match, type, title, description, data) => {
            const chartId = 'chart_' + Math.random().toString(36).substr(2, 9);
            const chartTitle = title || `${type.charAt(0).toUpperCase() + type.slice(1)} Chart`;
            const chartDescription = description || '';
            
            return `
                <div class="chart-container">
                    <div class="chart-title">${chartTitle}</div>
                    <div class="chart-loading">
                        <i class="fas fa-spinner"></i>
                        Generando gráfica...
                    </div>
                    <canvas id="${chartId}" style="display: none;"></canvas>
                    ${chartDescription ? `<div class="chart-description">${chartDescription}</div>` : ''}
                </div>
            `;
        });
    }

    renderCharts() {
        // Find all chart containers and render them
        const chartContainers = document.querySelectorAll('.chart-container');
        
        chartContainers.forEach(container => {
            const canvas = container.querySelector('canvas');
            const loading = container.querySelector('.chart-loading');
            
            if (canvas && loading) {
                // Generate sample data for demonstration
                const chartData = this.generateSampleChartData();
                
                // Hide loading and show canvas
                loading.style.display = 'none';
                canvas.style.display = 'block';
                
                // Create chart
                this.createChart(canvas, chartData);
            }
        });
    }

    generateSampleChartData() {
        // Generate different types of sample data
        const types = ['line', 'bar', 'pie', 'doughnut', 'radar'];
        const type = types[Math.floor(Math.random() * types.length)];
        
        const baseData = {
            labels: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio'],
            datasets: [{
                label: 'Ventas',
                data: [12, 19, 3, 5, 2, 3],
                borderColor: '#2ecc71',
                backgroundColor: 'rgba(46, 204, 113, 0.2)',
                tension: 0.1
            }]
        };

        switch (type) {
            case 'pie':
            case 'doughnut':
                return {
                    type: type,
                    data: {
                        labels: ['Desktop', 'Mobile', 'Tablet'],
                        datasets: [{
                            data: [45, 35, 20],
                            backgroundColor: [
                                '#2ecc71',
                                '#3498db',
                                '#f39c12'
                            ]
                        }]
                    }
                };
            case 'radar':
                return {
                    type: type,
                    data: {
                        labels: ['Ventas', 'Marketing', 'Desarrollo', 'Soporte', 'Administración'],
                        datasets: [{
                            label: 'Equipo A',
                            data: [65, 59, 90, 81, 56],
                            borderColor: '#2ecc71',
                            backgroundColor: 'rgba(46, 204, 113, 0.2)'
                        }]
                    }
                };
            default:
                return {
                    type: type,
                    data: baseData
                };
        }
    }

    createChart(canvas, chartConfig) {
        if (typeof Chart === 'undefined') {
            console.warn('Chart.js not available');
            return;
        }

        try {
            new Chart(canvas, {
                type: chartConfig.type,
                data: chartConfig.data,
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            labels: {
                                color: '#ecf0f1'
                            }
                        }
                    },
                    scales: chartConfig.type !== 'pie' && chartConfig.type !== 'doughnut' ? {
                        x: {
                            ticks: {
                                color: '#ecf0f1'
                            },
                            grid: {
                                color: 'rgba(46, 204, 113, 0.1)'
                            }
                        },
                        y: {
                            ticks: {
                                color: '#ecf0f1'
                            },
                            grid: {
                                color: 'rgba(46, 204, 113, 0.1)'
                            }
                        }
                    } : {}
                }
            });
        } catch (error) {
            console.error('Error creating chart:', error);
        }
    }

    setLoading(loading) {
        this.isLoading = loading;
        this.sendButton.disabled = loading;
        
        if (loading) {
            this.sendButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
            this.showTypingIndicator();
            this.startThinkingAnimation();
        } else {
            this.sendButton.innerHTML = '<i class="fas fa-arrow-up"></i>';
            this.hideTypingIndicator();
            this.stopThinkingAnimation();
        }
    }

    startThinkingAnimation() {
        const logo = document.querySelector('.alpar-logo');
        if (logo) {
            logo.style.animation = 'logoThink 1s ease-in-out infinite';
        }
    }

    stopThinkingAnimation() {
        const logo = document.querySelector('.alpar-logo');
        if (logo) {
            logo.style.animation = 'logoFloat 3s ease-in-out infinite';
        }
    }

    onUserTyping() {
        const logo = document.querySelector('.alpar-logo');
        if (logo && !this.isLoading) {
            // Add a subtle animation when user is typing
            logo.style.animation = 'logoType 0.5s ease-in-out';
            setTimeout(() => {
                if (!this.isLoading) {
                    logo.style.animation = 'logoFloat 3s ease-in-out infinite';
                }
            }, 500);
        }
    }

    showTypingIndicator() {
        // Remove existing typing indicator
        this.hideTypingIndicator();
        
        const typingDiv = document.createElement('div');
        typingDiv.className = 'message assistant-message typing-message';
        typingDiv.id = 'typing-indicator';
        
        const messageContent = document.createElement('div');
        messageContent.className = 'message-content';
        
        messageContent.innerHTML = `
            <div class="typing-indicator">
                <div class="typing-dots">
                    <div class="typing-dot"></div>
                    <div class="typing-dot"></div>
                    <div class="typing-dot"></div>
                </div>
                <span>ALPAR está escribiendo...</span>
            </div>
        `;
        
        typingDiv.appendChild(messageContent);
        this.chatMessages.appendChild(typingDiv);
        this.scrollToBottom();
    }

    hideTypingIndicator() {
        const existingTyping = document.getElementById('typing-indicator');
        if (existingTyping) {
            existingTyping.remove();
        }
    }

    scrollToBottom() {
        this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Method to clear conversation (useful for testing)
    clearConversation() {
        this.chatMessages.innerHTML = '';
        this.welcomeSection.classList.remove('hide');
        this.chatMessages.classList.remove('show');
        this.chatMessages.style.display = 'none';
        this.isFirstMessage = true;
        this.threadId = null;
    }
}

// Initialize the chatbot when the page loads
document.addEventListener('DOMContentLoaded', () => {
    window.alparBot = new AlparBot();
    
    // Add some helpful console commands for development
    console.log('🤖 AlparBot initialized!');
    console.log('💡 Development commands:');
    console.log('   - alparBot.clearConversation() - Clear chat history');
    console.log('   - alparBot.checkServerHealth() - Check server status');
});

// Handle page visibility changes to check server health
document.addEventListener('visibilitychange', () => {
    if (!document.hidden && window.alparBot) {
        window.alparBot.checkServerHealth();
    }
});

// Handle escape key to clear conversation
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && window.alparBot) {
        window.alparBot.clearConversation();
    }
});

// Global function for collapsible blocks (called from HTML)
function toggleCollapsible(blockId) {
    if (window.alparBot) {
        window.alparBot.toggleCollapsible(blockId);
    }
}
