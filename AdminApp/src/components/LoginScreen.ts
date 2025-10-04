import { auth } from '../supabase/supabase';

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
        this.form.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.handleEmailLogin();
        });

        
        // Add signup button event listener
        this.addSignupListener();
        
        // Add password visibility toggles
        this.addPasswordToggles();
        
        // Add signup modal handlers
        this.addSignupModalHandlers();
        
        
        // Check for existing session
        this.checkExistingSession();
    }


    private addSignupListener(): void {
        const signupBtn = this.element.querySelector('#show-signup-btn');
        if (signupBtn) {
            console.log('Signup button found, adding click listener');
            signupBtn.addEventListener('click', (e) => {
                e.preventDefault();
                console.log('Signup button clicked');
                this.showSignupModal();
            });
        } else {
            console.error('Signup button not found in DOM');
        }
    }

    private addPasswordToggles(): void {
        // Login password toggle
        const togglePassword = this.element.querySelector('#toggle-password');
        const passwordInput = this.element.querySelector('#password') as HTMLInputElement;
        
        if (togglePassword && passwordInput) {
            togglePassword.addEventListener('click', () => {
                const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
                passwordInput.setAttribute('type', type);
            });
        }
    }

    private addSignupModalHandlers(): void {
        // Use setTimeout to ensure DOM is ready
        setTimeout(() => {
            // Note: Signup button listener is already added in addSignupListener()

            // Close signup modal
            const closeSignupModal = document.querySelector('#close-signup-modal');
            const cancelSignup = document.querySelector('#cancel-signup');
            
            if (closeSignupModal) {
                closeSignupModal.addEventListener('click', () => {
                    this.hideSignupModal();
                });
            }
            
            if (cancelSignup) {
                cancelSignup.addEventListener('click', () => {
                    this.hideSignupModal();
                });
            }

            // Signup form submission
            const signupForm = document.querySelector('#signup-form') as HTMLFormElement;
            if (signupForm) {
                signupForm.addEventListener('submit', async (e) => {
                    e.preventDefault();
                    await this.handleSignup();
                });
            }

            // Signup password toggles
            this.addSignupPasswordToggles();
        }, 100);
    }

    private addSignupPasswordToggles(): void {
        // Signup password toggle
        const toggleSignupPassword = document.querySelector('#toggle-signup-password');
        const signupPasswordInput = document.querySelector('#signup-password') as HTMLInputElement;
        
        if (toggleSignupPassword && signupPasswordInput) {
            toggleSignupPassword.addEventListener('click', () => {
                const type = signupPasswordInput.getAttribute('type') === 'password' ? 'text' : 'password';
                signupPasswordInput.setAttribute('type', type);
            });
        }

        // Confirm password toggle
        const toggleConfirmPassword = document.querySelector('#toggle-confirm-password');
        const confirmPasswordInput = document.querySelector('#signup-confirm-password') as HTMLInputElement;
        
        if (toggleConfirmPassword && confirmPasswordInput) {
            toggleConfirmPassword.addEventListener('click', () => {
                const type = confirmPasswordInput.getAttribute('type') === 'password' ? 'text' : 'password';
                confirmPasswordInput.setAttribute('type', type);
            });
        }
    }


    private showSignupModal(): void {
        console.log('Attempting to show signup modal');
        const modal = document.querySelector('#signup-modal');
        if (modal) {
            console.log('Signup modal found, removing hidden class');
            modal.classList.remove('hidden');
        } else {
            console.error('Signup modal not found in DOM');
        }
    }

    private hideSignupModal(): void {
        const modal = document.querySelector('#signup-modal');
        if (modal) {
            modal.classList.add('hidden');
        }
    }

    private async checkExistingSession(): Promise<void> {
        try {
            const { session } = await auth.getCurrentSession();
            if (session) {
                console.log('Existing session found, auto-login');
                this.onLoginSuccess();
            }
        } catch (error) {
            console.log('No existing session found');
        }
    }

    private async handleEmailLogin(): Promise<void> {
        const emailInput = this.element.querySelector('#email-address') as HTMLInputElement;
        const passwordInput = this.element.querySelector('#password') as HTMLInputElement;
        
        if (!emailInput || !passwordInput) {
            console.error('Email or password input not found');
            return;
        }

        const email = emailInput.value;
        const password = passwordInput.value;

        if (!email || !password) {
            alert('Please enter both email and password');
            return;
        }

        try {
            const { error } = await auth.signIn(email, password);
            if (error) {
                console.error('Login error:', error);
                alert('Login failed: ' + (error as any).message);
            } else {
                console.log('Login successful');
                this.onLoginSuccess();
            }
        } catch (error) {
            console.error('Login error:', error);
            alert('Login failed');
        }
    }


    private async handleSignup(): Promise<void> {
        const firstNameInput = document.querySelector('#signup-first-name') as HTMLInputElement;
        const lastNameInput = document.querySelector('#signup-last-name') as HTMLInputElement;
        const emailInput = document.querySelector('#signup-email') as HTMLInputElement;
        const phoneInput = document.querySelector('#signup-phone') as HTMLInputElement;
        const passwordInput = document.querySelector('#signup-password') as HTMLInputElement;
        const confirmPasswordInput = document.querySelector('#signup-confirm-password') as HTMLInputElement;
        const termsCheckbox = document.querySelector('#signup-terms') as HTMLInputElement;
        
        if (!firstNameInput || !lastNameInput || !emailInput || !passwordInput || !confirmPasswordInput || !termsCheckbox) {
            console.error('Required signup inputs not found');
            return;
        }

        const firstName = firstNameInput.value.trim();
        const lastName = lastNameInput.value.trim();
        const email = emailInput.value.trim();
        const phone = phoneInput?.value.trim() || '';
        const password = passwordInput.value;
        const confirmPassword = confirmPasswordInput.value;

        // Validation
        if (!firstName || !lastName || !email || !password) {
            alert('Please fill in all required fields');
            return;
        }

        if (password !== confirmPassword) {
            alert('Passwords do not match');
            return;
        }

        if (password.length < 6) {
            alert('Password must be at least 6 characters long');
            return;
        }

        if (!termsCheckbox.checked) {
            alert('Please agree to the Terms of Service and Privacy Policy');
            return;
        }

        try {
            const userData = {
                firstName,
                lastName,
                phone
            };

            const { error } = await auth.signUp(email, password, userData);
            if (error) {
                console.error('Signup error:', error);
                alert('Signup failed: ' + (error as any).message);
            } else {
                console.log('Signup successful');
                alert('Account created successfully! Please check your email to verify your account.');
                
                // Clear the form
                firstNameInput.value = '';
                lastNameInput.value = '';
                emailInput.value = '';
                phoneInput.value = '';
                passwordInput.value = '';
                confirmPasswordInput.value = '';
                termsCheckbox.checked = false;
                
                // Hide the modal
                this.hideSignupModal();
            }
        } catch (error) {
            console.error('Signup error:', error);
            alert('Signup failed');
        }
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
        if (emailInput) emailInput.value = '';
        if (passwordInput) passwordInput.value = '';
    }
}
