export class LoginScreen {
    private element: HTMLDivElement;
    private form: HTMLFormElement;
    private onLoginSuccess: () => void;
    private autoLoginTimeout: NodeJS.Timeout | null = null;

    constructor(elementId: string, onLoginSuccess: () => void) {
        this.element = document.getElementById(elementId) as HTMLDivElement;
        this.form = this.element.querySelector('#login-form') as HTMLFormElement;
        this.onLoginSuccess = onLoginSuccess;
        this.init();
    }

    private init(): void {
        this.form.addEventListener('submit', (e) => {
            e.preventDefault();
            // No actual authentication, just proceed to the next screen
            this.onLoginSuccess();
        });
        
        // Auto-login after a short delay for demo purposes
        console.log('Login screen initialized - auto-login in 1 second');
        this.autoLoginTimeout = setTimeout(() => {
            console.log('Auto-login triggered');
            this.onLoginSuccess();
        }, 1000);
    }

    public show(): void { this.element.classList.remove('hidden'); }
    public hide(): void { this.element.classList.add('hidden'); }
    public isHidden(): boolean { return this.element.classList.contains('hidden'); }
    
    public reset(): void {
        console.log('Resetting login screen');
        // Clear any existing auto-login timeout
        if (this.autoLoginTimeout) {
            clearTimeout(this.autoLoginTimeout);
            this.autoLoginTimeout = null;
        }
        
        // Reset form values
        const emailInput = this.element.querySelector('#email-address') as HTMLInputElement;
        const passwordInput = this.element.querySelector('#password') as HTMLInputElement;
        if (emailInput) emailInput.value = 'admin@rescue.org';
        if (passwordInput) passwordInput.value = 'password';
        
        // Restart auto-login timer
        this.autoLoginTimeout = setTimeout(() => {
            console.log('Auto-login triggered after reset');
            this.onLoginSuccess();
        }, 1000);
    }
}
