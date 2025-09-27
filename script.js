// --- Configuration ---
// Standard RPC transactions fail 30% of the time under congestion
const STANDARD_FAIL_RATE = 0.30; 
// Raiku is guaranteed, so it only fails if the entire network fails (simulated as 0% for this demo)
const RAIKU_FAIL_RATE = 0.00; 

// --- State and DOM Element Selection ---
let isConnected = false; 
const connectWalletBtn = document.getElementById('connectWalletBtn');
const runSimulationBtn = document.getElementById('runSimulationBtn');
const walletStatus = document.getElementById('walletStatus');
const walletAddress = document.getElementById('walletAddress');
const finalSummary = document.getElementById('final-summary');

// NEW ELEMENTS FOR QUANTITY INPUT
const mintQuantityInput = document.getElementById('mintQuantityInput');
const mintQuantityDisplay = document.getElementById('mintQuantityDisplay');
// -------------------------

// Standard Bot Elements
const standardSubmitted = document.getElementById('standardSubmitted');
const standardSuccessful = document.getElementById('standardSuccessful');
const standardFailed = document.getElementById('standardFailed');
const standardMessage = document.getElementById('standardMessage');

// Raiku Bot Elements
const raikuSubmitted = document.getElementById('raikuSubmitted');
const raikuSuccessful = document.getElementById('raikuSuccessful');
const raikuFailed = document.getElementById('raikuFailed');
const raikuMessage = document.getElementById('raikuMessage');

// --- MODAL ELEMENTS (CORRECTED SELECTORS) ---
const welcomeModal = document.getElementById('welcomeModal');
const closeModalBtn = document.getElementById('closeModalBtn'); // <-- USING THE ID FROM YOUR HTML
// ------------------------------------------

// --- Helper Functions ---

// Generates a random Solana-like public key for the simulation
function generateRandomAddress() {
    const chars = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
    let address = '';
    for (let i = 0; i < 44; i++) {
        address += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return address;
}

// Resets all display elements before a new run
function resetSimulation() {
    standardSubmitted.textContent = 0;
    standardSuccessful.textContent = 0;
    standardFailed.textContent = 0;
    raikuSubmitted.textContent = 0;
    raikuSuccessful.textContent = 0;
    raikuFailed.textContent = 0;
    standardMessage.textContent = '';
    raikuMessage.textContent = '';
    finalSummary.textContent = '';
    finalSummary.className = 'summary-box';
}

// Function to handle the actual Disconnect logic
function disconnectWallet() {
    isConnected = false;
    connectWalletBtn.textContent = 'Connect Wallet';
    connectWalletBtn.classList.remove('disconnect-btn'); 

    walletStatus.textContent = 'Status: Disconnected';
    walletStatus.classList.remove('connected');
    walletAddress.textContent = '';
    runSimulationBtn.disabled = true;
    connectWalletBtn.disabled = false;
    resetSimulation();
    console.log("Wallet Disconnected.");
}

// 2. Transaction Simulation Function
function simulateMint(isRaiku, failRate, submittedElement, successfulElement, failedElement, messageElement) {
    return new Promise(resolve => {
        
        const isSuccessful = Math.random() > failRate;
        
        let submitted = parseInt(submittedElement.textContent) + 1;
        submittedElement.textContent = submitted;

        setTimeout(() => {
            if (isSuccessful) {
                let successCount = parseInt(successfulElement.textContent) + 1;
                successfulElement.textContent = successCount;
                messageElement.textContent = isRaiku ? "Success: Raiku guaranteed inclusion!" : "Success: Standard RPC got lucky.";
                messageElement.style.color = '#7ed3d7';
            } else {
                let failedCount = parseInt(failedElement.textContent) + 1;
                failedElement.textContent = failedCount;
                messageElement.textContent = isRaiku ? 
                    "ERROR: Raiku Infrastructure FAILED (Extremely Rare)" : 
                    "ERROR: Transaction Dropped (Standard RPC Congestion)";
                messageElement.style.color = '#d0021b';
            }
            resolve(isSuccessful);
        }, Math.random() * 500 + 100);
    });
}

// 3. Wallet Connection/Disconnection Handler
connectWalletBtn.addEventListener('click', () => {
    if (isConnected) {
        disconnectWallet();
    } else {
        const address = generateRandomAddress();
        isConnected = true;
        connectWalletBtn.textContent = 'Disconnect Wallet';
        connectWalletBtn.classList.add('disconnect-btn'); 
        
        walletStatus.textContent = 'Status: Connected';
        walletStatus.classList.add('connected');
        walletAddress.textContent = `Wallet: ${address.substring(0, 4)}...${address.substring(address.length - 4)}`;
        runSimulationBtn.disabled = false;
        connectWalletBtn.disabled = false;
        
        console.log("Wallet Connected:", address);
    }
});

// 4. Run Simulation Button Handler
runSimulationBtn.addEventListener('click', async () => {
    resetSimulation();
    runSimulationBtn.disabled = true;
    
    const userMintQuantity = parseInt(mintQuantityInput.value) || 10;
    
    let standardSuccesses = 0;
    let raikuSuccesses = 0;

    for (let i = 0; i < userMintQuantity; i++) {
        const [standardResult, raikuResult] = await Promise.all([
            simulateMint(false, STANDARD_FAIL_RATE, standardSubmitted, standardSuccessful, standardFailed, standardMessage),
            simulateMint(true, RAIKU_FAIL_RATE, raikuSubmitted, raikuSuccessful, raikuFailed, raikuMessage)
        ]);

        if (standardResult) standardSuccesses++;
        if (raikuResult) raikuSuccesses++;
    }

    // Final Summary
    let summaryText = '';
    if (raikuSuccesses > standardSuccesses) {
        summaryText = `Raiku wins! ${raikuSuccesses}/${userMintQuantity} successful mints vs. Standard's ${standardSuccesses}/${userMintQuantity}. Predictability is key.`;
        finalSummary.classList.add('success-msg');
    } else if (raikuSuccesses === standardSuccesses) {
        summaryText = `It's a tie! Both bots got lucky, but Raiku guaranteed success. ${raikuSuccesses}/${userMintQuantity}.`;
    } else {
        summaryText = `Standard RPC somehow won! ${standardSuccesses}/${userMintQuantity}. But Raiku still provided a ${RAIKU_FAIL_RATE * 100}% failure guarantee.`;
        finalSummary.classList.add('failure-msg');
    }
    
    finalSummary.textContent = summaryText;
    runSimulationBtn.disabled = false;
});

// 5. Input Field Listener
mintQuantityInput.addEventListener('input', () => {
    let value = parseInt(mintQuantityInput.value);
    if (isNaN(value) || value < 1) {
        value = 1;
    } else if (value > 1000) {
        value = 1000;
    }
    mintQuantityInput.value = value;
    mintQuantityDisplay.textContent = value;
});

// --- MODAL DISPLAY LOGIC (FIXED) ---

// Function to close the modal
function closeModal() {
    if (welcomeModal) {
        welcomeModal.style.display = 'none';
    }
}

// Add event listener to the correct close button ID
if (closeModalBtn) {
    closeModalBtn.addEventListener('click', closeModal);
}

// Show the modal when the page loads
window.onload = function() {
    if (welcomeModal) {
        welcomeModal.style.display = 'block';
    }
}

// Close the modal if the user clicks anywhere outside of the modal content
window.addEventListener('click', (event) => {
    if (event.target === welcomeModal) {
        closeModal();
    }
});

// --- Initial Setup (Disable simulation until wallet connects) ---
runSimulationBtn.disabled = true;