export class ScanningScreen {
    private element: HTMLDivElement;
    private stopButton: HTMLButtonElement;
    private autoToggle: HTMLInputElement;
    private onScanComplete: () => void;
    private scanTimeout: NodeJS.Timeout | null = null;
    private isAutoScanning: boolean = false;

    constructor(elementId: string, onScanComplete: () => void) {
        this.element = document.getElementById(elementId) as HTMLDivElement;
        this.stopButton = this.element.querySelector('#stop-scanning-button') as HTMLButtonElement;
        this.autoToggle = this.element.querySelector('#auto-scan-toggle') as HTMLInputElement;
        this.onScanComplete = onScanComplete;
        this.init();
    }

    private init(): void {
        this.stopButton.addEventListener('click', () => {
            if (this.scanTimeout) clearTimeout(this.scanTimeout);
            this.onScanComplete();
        });
        
        this.autoToggle.addEventListener('change', (e) => {
            const target = e.target as HTMLInputElement;
            this.isAutoScanning = target.checked;
            if (this.isAutoScanning) {
                console.log('Auto-scanning enabled');
                // Don't start auto-scanning immediately, just mark as enabled
            } else {
                console.log('Auto-scanning disabled');
                this.stopAutoScanning();
            }
        });
    }

    public startScan(duration: number): void {
        console.log(`Starting scan for ${duration}ms`);
        this.show();
        this.scanTimeout = setTimeout(() => {
            console.log('Scan completed');
            this.onScanComplete();
        }, duration);
    }
    
    private startAutoScanning(): void {
        if (this.isAutoScanning) {
            this.startScan(3000); // 3 second intervals for auto-scanning
        }
    }
    
    public stopAutoScanning(): void {
        this.isAutoScanning = false;
        if (this.scanTimeout) {
            clearTimeout(this.scanTimeout);
            this.scanTimeout = null;
        }
    }
    
    public reset(): void {
        console.log('Resetting scanning screen');
        this.stopAutoScanning();
        this.autoToggle.checked = false;
        this.isAutoScanning = false;
    }

    public show(): void { this.element.classList.remove('hidden'); }
    public hide(): void { this.element.classList.add('hidden'); }
}
