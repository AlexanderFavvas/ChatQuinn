// Particle system for visual effects
class ParticleSystem {
    constructor(config = {}) {
        this.canvas = document.getElementById('particle-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.particles = [];
        this.config = {
            colors: [
                '#E6E6FA',
                '#DCD0FF',
                '#C8B6FF',
                '#B8A6FF',
                '#D8BFD8',
                '#CDB4E6'
            ],
            count: 40,
            sizeMin: 10,
            sizeMax: 25,
            floatAmplitude: 30,
            floatSpeed: 3000,
            ...config
        };

        this.init();
    }

    init() {
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
        this.createParticles();
        this.startAnimation();
    }

    resizeCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    createParticles() {
        this.particles = Array.from({ length: this.config.count }, () => ({
            x: Math.random() * this.canvas.width,
            y: Math.random() * this.canvas.height,
            size: this.getRandomNumber(this.config.sizeMin, this.config.sizeMax),
            color: this.getRandomArrayElement(this.config.colors),
            blur: this.getRandomNumber(3, 5),
            phaseOffset: Math.random() * Math.PI * 2,
            horizontalOffset: Math.random() * Math.PI * 2
        }));
    }

    startAnimation() {
        const animate = (currentTime) => {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            
            this.particles.forEach(particle => {
                const verticalMovement = Math.sin((currentTime / this.config.floatSpeed) + particle.phaseOffset) 
                    * this.config.floatAmplitude;
                const horizontalMovement = Math.sin((currentTime / (this.config.floatSpeed * 1.5)) + particle.horizontalOffset) 
                    * (this.config.floatAmplitude * 0.5);

                this.drawParticle(particle, particle.x + horizontalMovement, particle.y + verticalMovement);
            });

            requestAnimationFrame(animate);
        };

        requestAnimationFrame(animate);
    }

    drawParticle(particle, x, y) {
        this.ctx.beginPath();
        this.ctx.arc(x, y, particle.size / 2, 0, Math.PI * 2);
        this.ctx.globalAlpha = 0.2;
        this.ctx.fillStyle = particle.color;
        this.ctx.shadowColor = particle.color;
        this.ctx.shadowBlur = particle.blur;
        this.ctx.fill();
    }

    getRandomArrayElement(array) {
        return array[Math.floor(Math.random() * array.length)];
    }

    getRandomNumber(min, max) {
        return min + Math.random() * (max - min);
    }
}

class SetupFlow {
    constructor() {
        this.state = {
            currentQuestionIndex: -1,
            answers: {},
            hasUnsavedChanges: false,
            isSaving: false,
            isAnimating: false,
            errors: [],
            saveRetryCount: 0,
            maxRetries: 3,
            retryDelay: 1000, // ms
        };

        this.questions = [
            {
                question: "How should Quinn disclose its AI status?",
                type: "double-toggle",
                field: "discloseAI",
                options: [
                    {
                        field: "discloseAIReplies",
                        label: "Disclose AI status in email replies"
                    },
                    {
                        field: "discloseAIInitial",
                        label: "Disclose AI status when initiating emails"
                    }
                ]
            },
            {
                question: "What types of emails should Quinn ignore?",
                type: "textarea",
                field: "ignoredEmails",
                placeholder: "e.g., promotional emails, newsletters, automated notifications..."
            },
            {
                question: "Should Quinn add calendar events from emails?",
                type: "double-toggle",
                field: "calendarIntegration",
                options: [
                    {
                        field: "autoAddEvents",
                        label: "Automatically add detected calendar events"
                    }
                ]
            },
            {
                question: "Any specific instructions for how Quinn should handle your emails?",
                type: "textarea",
                field: "customInstructions",
                placeholder: "e.g., tone of voice, response style, specific handling instructions..."
            },
            {
                question: "How would you like Quinn to address you?",
                type: "text",
                field: "userAddress",
                placeholder: "e.g., First name, Full name, Title + Last name..."
            }
        ];

        this.elements = {
            container: document.querySelector('.question-container'),
            progressBar: document.querySelector('.progress-bar')
        };

        // Remove or comment out the particle system initialization
        // this.particleSystem = new ParticleSystem();

        this.deleteAllCookies();
        this.init();
    }

    deleteAllCookies() {
        const cookies = document.cookie.split(';');
        
        for (let cookie of cookies) {
            const eqPos = cookie.indexOf('=');
            const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
            
            // Delete the cookie by setting an expired date
            document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
            
            // Also try to delete for all possible paths and domains
            document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=${window.location.hostname}`;
            document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=.${window.location.hostname}`;
        }
    }

    async init() {
        try {
            // Remove or comment out the particle system initialization
            // this.particleSystem = new ParticleSystem();

            await this.loadSavedAnswers();
            this.showInitialScreen();
            this.setupUnloadHandler();
            this.setupErrorHandler();
        } catch (error) {
            this.handleError(error, 'Initialization failed');
        }
    }

    setupUnloadHandler() {
        window.addEventListener('beforeunload', (e) => {
            if (this.state.hasUnsavedChanges) {
                this.forceSaveAnswers();
                e.preventDefault();
                e.returnValue = '';
            }
        });
    }

    setupErrorHandler() {
        window.addEventListener('error', (event) => {
            this.handleError(event.error, 'Unexpected error occurred');
        });
    }

    async loadSavedAnswers() {
        try {
            const response = await this.makeRequest('GET', 'getData');
            
            if (response.ok) {
                const data = await response.json();
                if (data.settings) {
                    this.state.answers = data.settings;
                }
            }
        } catch (error) {
            this.handleError(error, 'Failed to load saved settings');
        }
    }

    async makeRequest(method, type, body = null) {
        const options = {
            method,
            headers: {
                'X-Request-Type': type,
                'Content-Type': 'application/json'
            },
            credentials: 'include'
        };

        if (body) {
            options.body = JSON.stringify(body);
        }

        const response = await fetch('https://us-central1-movie-thing-439716.cloudfunctions.net/function-1', options);
        
        if (!response.ok) {
            throw new Error('Request failed');
        }
        
        return response;
    }

    async saveAnswers() {
        if (this.state.hasUnsavedChanges) {
            clearTimeout(this.saveDebounceTimeout);
            this.saveDebounceTimeout = setTimeout(() => this.forceSaveAnswers(), 500);
        }
    }

    async forceSaveAnswers() {
        if (this.state.isSaving) return;
        this.state.isSaving = true;

        try {
            const response = await this.makeRequest('POST', 'updateSettings', {
                settings: this.state.answers
            });

            if (response.ok) {
                this.state.hasUnsavedChanges = false;
                this.state.saveRetryCount = 0;
            }
        } catch (error) {
            await this.handleSaveError(error);
        } finally {
            this.state.isSaving = false;
        }
    }

    async handleSaveError(error) {
        if (this.state.saveRetryCount < this.state.maxRetries) {
            this.state.saveRetryCount++;
            await new Promise(resolve => setTimeout(resolve, this.state.retryDelay));
            await this.forceSaveAnswers();
        } else {
            this.handleError(error, 'Failed to save settings');
        }
    }

    handleError(error, userMessage) {
        console.error('Error:', error);
        
        const errorDetails = {
            timestamp: new Date().toISOString(),
            message: error.message,
            stack: error.stack,
            state: { ...this.state }
        };
        
        this.state.errors.push(errorDetails);
        
        this.showErrorMessage(userMessage || 'An error occurred. Your progress has been saved locally.');
    }

    showErrorMessage(message, duration = 5000) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = message;
        errorDiv.style.cssText = 'color: #ff4444; margin-top: 1rem; padding: 0.5rem; text-align: center;';
        
        const existingError = this.elements.container.querySelector('.error-message');
        if (existingError) {
            existingError.remove();
        }
        
        this.elements.container.appendChild(errorDiv);
        setTimeout(() => errorDiv.remove(), duration);
    }

    async navigateQuestion(direction) {
        if (this.state.isAnimating) return;
        this.state.isAnimating = true;

        try {
            if (this.state.hasUnsavedChanges) {
                await this.forceSaveAnswers();
            }

            await this.animateTransition(async () => {
                if (direction === 'next') {
                    this.state.currentQuestionIndex++;
                    if (this.state.currentQuestionIndex < this.questions.length) {
                        this.showQuestion(this.questions[this.state.currentQuestionIndex]);
                    } else {
                        this.showCompletionScreen();
                    }
                } else {
                    this.state.currentQuestionIndex--;
                    if (this.state.currentQuestionIndex >= 0) {
                        this.showQuestion(this.questions[this.state.currentQuestionIndex]);
                    } else {
                        this.showInitialScreen();
                    }
                }
            });
        } catch (error) {
            this.handleError(error);
        } finally {
            this.state.isAnimating = false;
        }
    }

    async animateTransition(callback) {
        this.elements.container.classList.add('fade-out');
        await new Promise(resolve => setTimeout(resolve, 250));
        
        await callback();
        
        this.elements.container.classList.remove('fade-out');
        await new Promise(resolve => setTimeout(resolve, 50));
        
        this.updateProgressBar();
    }

    showQuestion(questionData) {
        this.elements.container.innerHTML = `
            <div class="question">${questionData.question}</div>
            <div class="input-container">
                ${this.createInputElement(questionData)}
                <div class="button-container">
                    <button class="button secondary" onclick="setupFlow.navigateQuestion('prev')">← Back</button>
                    <button class="button" onclick="setupFlow.navigateQuestion('next')">Next →</button>
                </div>
            </div>
        `;
    }

    createInputElement(questionData) {
        const currentValue = this.state.answers[questionData.field] || '';

        switch (questionData.type) {
            case 'double-toggle':
                return questionData.options.map(option => `
                    <div class="toggle-container">
                        <label class="toggle-switch">
                            <input type="checkbox" 
                                   onchange="setupFlow.handleInput('${option.field}', this.checked)"
                                   ${this.state.answers[option.field] ? 'checked' : ''}>
                            <span class="slider"></span>
                        </label>
                        <span class="toggle-label">${option.label}</span>
                    </div>
                `).join('');
            
            case 'textarea':
                return `
                    <textarea 
                        placeholder="${questionData.placeholder}"
                        onkeyup="setupFlow.handleInput('${questionData.field}', this.value)"
                    >${currentValue}</textarea>
                `;
            
            default:
                return `
                    <input 
                        type="text" 
                        placeholder="${questionData.placeholder}"
                        value="${currentValue}"
                        onkeyup="setupFlow.handleInput('${questionData.field}', this.value)"
                    >
                `;
        }
    }

    handleInput(field, value) {
        this.state.answers[field] = value;
        this.state.hasUnsavedChanges = true;
        this.saveAnswers();
    }

    showInitialScreen() {
        this.elements.container.innerHTML = `
            <div class="question">Welcome to Quinn! Let's get you set up.</div>
            <div class="input-container">
                <div class="button-container">
                    <button class="button" onclick="setupFlow.navigateQuestion('next')">Get Started →</button>
                </div>
            </div>
        `;
        this.updateProgressBar();
    }

    showCompletionScreen() {
        this.elements.container.innerHTML = `
            <div class="question">All set! Welcome to Quinn.</div>
            <div class="input-container">
                <div class="button-container">
                    <button class="button secondary" onclick="setupFlow.navigateQuestion('prev')">← Back</button>
                    <button class="completion-button" onclick="setupFlow.finishSetup()">Get started →</button>
                </div>
            </div>
        `;
        this.updateProgressBar();
    }

    async finishSetup() {
        const button = this.elements.container.querySelector('.completion-button');
        
        // Disable button and show loading state
        button.disabled = true;
        const originalText = button.textContent;
        button.innerHTML = `
            <span class="loading-spinner"></span>
            <span class="loading-dots">Saving settings</span>
        `;

        try {
            // Add completion data
            this.state.answers.setupCompleted = new Date().toISOString();
            this.state.answers.setupStatus = 'completed';

            // Save all settings with retries
            let success = false;
            this.state.saveRetryCount = 0;

            while (!success && this.state.saveRetryCount < this.state.maxRetries) {
                try {
                    await this.makeRequest('POST', 'updateSettings', {
                        settings: this.state.answers
                    });
                    success = true;
                } catch (error) {
                    this.state.saveRetryCount++;
                    if (this.state.saveRetryCount < this.state.maxRetries) {
                        await new Promise(resolve => setTimeout(resolve, this.state.retryDelay));
                    } else {
                        throw error;
                    }
                }
            }

            // Show success state briefly before redirect
            button.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 8px; vertical-align: middle;">
                    <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
                Settings saved!
            `;

            // Wait a moment to show the success state
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Redirect to verification page instead of home
            window.location.href = '/verification/verification.html';
            
        } catch (error) {
            console.error('Failed to save settings:', error);
            this.handleError(error, 'Failed to save settings');
            
            // Show error state
            button.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 8px; vertical-align: middle;">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="15" y1="9" x2="9" y2="15"></line>
                    <line x1="9" y1="9" x2="15" y2="15"></line>
                </svg>
                Failed to save
            `;
            
            // Re-enable button after a delay
            setTimeout(() => {
                button.disabled = false;
                button.innerHTML = originalText;
            }, 2000);
        }
    }

    updateProgressBar() {
        let progress = 0;
        if (this.state.currentQuestionIndex >= 0) {
            progress = ((this.state.currentQuestionIndex + 1) / this.questions.length) * 100;
        }
        this.elements.progressBar.style.width = `${progress}%`;
    }
}

const setupFlow = new SetupFlow();