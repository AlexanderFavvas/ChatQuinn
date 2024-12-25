class SetupFlow {
    constructor() {
        this.state = {
            currentStep: 0,
            answers: {},
            isLoading: false,
            hasUnsavedChanges: false,
            saveRetryCount: 0,
            maxRetries: 3,
            retryDelay: 1000,
            questions: [
                {
                    id: 'aiDisclosure',
                    question: "How should Quinn disclose its AI status?",
                    type: "toggles",
                    options: [
                        {
                            id: 'discloseReplies',
                            label: "Disclose AI status in email replies"
                        },
                        {
                            id: 'discloseInitial',
                            label: "Disclose AI status when initiating emails"
                        }
                    ]
                },
                {
                    id: 'ignoreEmails',
                    question: "What types of emails should Quinn ignore?",
                    type: "textarea",
                    placeholder: "e.g., promotional emails, newsletters, automated notifications..."
                },
                {
                    id: 'calendar',
                    question: "Should Quinn add calendar events from emails?",
                    type: "toggle",
                    label: "Automatically add detected calendar events"
                },
                {
                    id: 'instructions',
                    question: "Any specific instructions for how Quinn should handle your emails?",
                    type: "textarea",
                    placeholder: "e.g., tone of voice, response style, specific handling instructions..."
                },
                {
                    id: 'name',
                    question: "How would you like Quinn to address you?",
                    type: "text",
                    placeholder: "e.g., First name, Full name, Title + Last name..."
                }
            ]
        };

        this.elements = {
            questionContainer: document.querySelector('.question-container'),
            progressSteps: document.getElementById('progressSteps'),
            backButton: document.getElementById('backButton'),
            nextButton: document.getElementById('nextButton')
        };

        this.init();
    }

    async init() {
        try {
            await this.loadSavedAnswers();
            this.createProgressSteps();
            this.loadCurrentStep();
            this.setupEventListeners();
        } catch (error) {
            this.handleError(error, 'Failed to initialize setup');
        }
    }

    createProgressSteps() {
        const totalSteps = this.state.questions.length + 2;
        const stepsHtml = Array(totalSteps).fill('')
            .map((_, index) => `<div class="step-indicator${index === this.state.currentStep ? ' active' : ''}"></div>`)
            .join('');
        this.elements.progressSteps.innerHTML = stepsHtml;
    }

    updateProgressSteps() {
        const indicators = this.elements.progressSteps.querySelectorAll('.step-indicator');
        indicators.forEach((indicator, index) => {
            indicator.classList.toggle('active', index === this.state.currentStep);
        });
    }

    setupEventListeners() {
        window.addEventListener('beforeunload', (e) => {
            if (this.state.hasUnsavedChanges) {
                e.preventDefault();
                e.returnValue = '';
            }
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                this.navigateQuestion('next');
            }
        });
    }

    async loadSavedAnswers() {
        try {
            const response = await this.makeRequest('GET', '/api/settings');
            if (response.ok) {
                const data = await response.json();
                if (data.settings) {
                    this.state.answers = data.settings;
                }
            }
        } catch (error) {
            console.error('Failed to load saved answers:', error);
        }
    }

    async makeRequest(method, endpoint, body = null) {
        const options = {
            method,
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include'
        };

        if (body) {
            options.body = JSON.stringify(body);
        }

        const response = await fetch('https://api.chatquinn.com/hello_http', options);
        
        if (!response.ok) {
            throw new Error(`Request failed: ${response.statusText}`);
        }
        
        return response;
    }

    loadCurrentStep() {
        this.elements.questionContainer.classList.add('fade-out');
        
        setTimeout(() => {
            if (this.state.currentStep === 0) {
                this.showWelcomeScreen();
            } else if (this.state.currentStep === this.state.questions.length + 1) {
                this.showCompletionScreen();
            } else {
                this.loadQuestion();
            }
            
            this.updateProgressSteps();
            this.updateNavigation();
            
            setTimeout(() => {
                this.elements.questionContainer.classList.remove('fade-out');
            }, 50);
        }, 300);
    }

    showWelcomeScreen() {
        const html = `
            <div class="question">Welcome to Quinn! Let's get you set up.</div>
            <div class="input-container">
                <button class="get-started-button" onclick="setupFlow.navigateQuestion('next')">
                    Get Started
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M5 12h14M12 5l7 7-7 7"/>
                    </svg>
                </button>
            </div>
        `;
        this.elements.questionContainer.innerHTML = html;
    }

    showCompletionScreen() {
        const html = `
            <div class="question">All set! Welcome to Quinn.</div>
            <div class="input-container">
                <button class="get-started-button" onclick="setupFlow.completeSetup()">
                    Get Started
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M5 12h14M12 5l7 7-7 7"/>
                    </svg>
                </button>
            </div>
        `;
        this.elements.questionContainer.innerHTML = html;
    }

    loadQuestion() {
        const question = this.state.questions[this.state.currentStep - 1];
        if (!question) return;

        let html = `<div class="question">${question.question}</div>`;
        html += '<div class="input-container">';

        switch (question.type) {
            case 'toggles':
                html += question.options.map(option => `
                    <div class="toggle-container">
                        <span class="toggle-label">${option.label}</span>
                        <label class="toggle-switch">
                            <input type="checkbox" 
                                   data-id="${option.id}"
                                   ${this.state.answers[option.id] ? 'checked' : ''}
                                   onchange="setupFlow.handleInput('${option.id}', this.checked)">
                            <span class="slider"></span>
                        </label>
                    </div>
                `).join('');
                break;

            case 'toggle':
                html += `
                    <div class="toggle-container">
                        <span class="toggle-label">${question.label}</span>
                        <label class="toggle-switch">
                            <input type="checkbox" 
                                   data-id="${question.id}"
                                   ${this.state.answers[question.id] ? 'checked' : ''}
                                   onchange="setupFlow.handleInput('${question.id}', this.checked)">
                            <span class="slider"></span>
                        </label>
                    </div>
                `;
                break;

            case 'textarea':
                html += `
                    <textarea 
                        placeholder="${question.placeholder}"
                        onchange="setupFlow.handleInput('${question.id}', this.value)"
                        onkeyup="setupFlow.handleInput('${question.id}', this.value)"
                    >${this.state.answers[question.id] || ''}</textarea>
                `;
                break;

            case 'text':
                html += `
                    <input 
                        type="text" 
                        placeholder="${question.placeholder}"
                        value="${this.state.answers[question.id] || ''}"
                        onchange="setupFlow.handleInput('${question.id}', this.value)"
                        onkeyup="setupFlow.handleInput('${question.id}', this.value)"
                    >
                `;
                break;
        }

        html += '</div>';
        this.elements.questionContainer.innerHTML = html;
    }

    handleInput(id, value) {
        this.state.answers[id] = value;
        this.state.hasUnsavedChanges = true;
        this.saveAnswers();
    }

    updateNavigation() {
        const isFirstStep = this.state.currentStep === 0;
        const isLastStep = this.state.currentStep === this.state.questions.length + 1;

        this.elements.backButton.style.display = isFirstStep ? 'none' : 'flex';
        this.elements.nextButton.style.display = isFirstStep || isLastStep ? 'none' : 'flex';

        const nextButtonText = this.elements.nextButton.querySelector('.button-text');
        if (nextButtonText) {
            nextButtonText.textContent = this.state.currentStep === this.state.questions.length ? 'Complete' : 'Next';
        }
    }

    async navigateQuestion(direction) {
        if (this.state.isLoading) return;

        try {
            if (this.state.hasUnsavedChanges) {
                await this.saveAnswers();
            }

            if (direction === 'next') {
                this.state.currentStep++;
            } else {
                this.state.currentStep--;
            }

            this.loadCurrentStep();
        } catch (error) {
            this.handleError(error, 'Navigation failed');
        }
    }

    async saveAnswers() {
        if (!this.state.hasUnsavedChanges || this.state.isLoading) return;

        this.state.isLoading = true;
        try {
            const response = await this.makeRequest('POST', '/api/settings', {
                settings: this.state.answers
            });

            if (response.ok) {
                this.state.hasUnsavedChanges = false;
                this.state.saveRetryCount = 0;
            }
        } catch (error) {
            if (this.state.saveRetryCount < this.state.maxRetries) {
                this.state.saveRetryCount++;
                await new Promise(resolve => setTimeout(resolve, this.state.retryDelay));
                await this.saveAnswers();
            } else {
                throw error;
            }
        } finally {
            this.state.isLoading = false;
        }
    }

    async completeSetup() {
        if (this.state.isLoading) return;

        const button = document.querySelector('.get-started-button');
        button.disabled = true;
        
        try {
            this.state.answers.setupCompleted = new Date().toISOString();
            this.state.answers.setupStatus = 'completed';

            button.innerHTML = `
                <span class="loading-spinner"></span>
                Saving settings...
            `;

            await this.saveAnswers();

            button.innerHTML = `
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M20 6L9 17l-5-5"/>
                </svg>
                Setup Complete!
            `;

            await new Promise(resolve => setTimeout(resolve, 1000));
            window.location.href = '/dashboard';

        } catch (error) {
            this.handleError(error, 'Failed to complete setup');
            
            button.innerHTML = 'Try Again';
            button.disabled = false;
        }
    }

    handleError(error, userMessage) {
        console.error('Error:', error);
        
        const errorHtml = `
            <div class="error-message">
                ${userMessage || 'An error occurred. Please try again.'}
            </div>
        `;
        
        const container = this.elements.questionContainer;
        const existingError = container.querySelector('.error-message');
        if (existingError) {
            existingError.remove();
        }
        
        container.insertAdjacentHTML('beforeend', errorHtml);
        
        setTimeout(() => {
            const error = container.querySelector('.error-message');
            if (error) {
                error.remove();
            }
        }, 5000);
    }
}

// Initialize setup flow
const setupFlow = new SetupFlow();