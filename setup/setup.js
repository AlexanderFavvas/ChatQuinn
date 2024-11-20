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
            retryDelay: 1000,
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

        this.init();
    }

    async init() {
        try {
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

        const response = await fetch('https://api.chatquinn.com/', options);
        
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
                    <button class="button back" onclick="setupFlow.navigateQuestion('prev')">Back</button>
                    <button class="button" onclick="setupFlow.navigateQuestion('next')">Next</button>
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
                    <button class="button" onclick="setupFlow.navigateQuestion('next')">Get Started</button>
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
                    <button class="button back" onclick="setupFlow.navigateQuestion('prev')">Back</button>
                    <button class="button" onclick="setupFlow.finishSetup()">Get Started</button>
                </div>
            </div>
        `;
        this.updateProgressBar();
    }

    async finishSetup() {
        const button = this.elements.container.querySelector('.button');
        
        button.disabled = true;
        button.innerHTML = `
            <span class="loading-spinner"></span>
            Setting up...
        `;

        try {
            this.state.answers.setupCompleted = new Date().toISOString();
            this.state.answers.setupStatus = 'completed';

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

            button.innerHTML = 'Success!';
            await new Promise(resolve => setTimeout(resolve, 1000));
            window.location.href = '/verification/verification.html';
            
        } catch (error) {
            console.error('Failed to save settings:', error);
            this.handleError(error, 'Failed to save settings');
            
            button.innerHTML = 'Failed to save';
            
            setTimeout(() => {
                button.disabled = false;
                button.innerHTML = 'Get Started';
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