// --- Configuration ---
// Standard RPC transactions fail 30% of the time under congestion
const STANDARD_FAIL_RATE = 0.30; 
// Raiku is guaranteed, so it only fails if the entire network fails (simulated as 0% for this demo)
const RAIKU_FAIL_RATE = 0.00; 

// --- State and DOM Element Selection ---
// ... (existing variables)
// NEW MODAL ELEMENTS
const welcomeModal = document.getElementById('welcomeModal');
const modalCloseButton = document.getElementById('modalCloseButton');
const closeSpan = document.querySelector('.close-btn');
// -------------------------
let isConnected = false; // State variable to track connection
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
    // Remove the disconnect styling (red button)
    connectWalletBtn.classList.remove('disconnect-btn'); 

    walletStatus.textContent = 'Status: Disconnected';
    walletStatus.classList.remove('connected');
    walletAddress.textContent = '';
    runSimulationBtn.disabled = true; // Disable simulation on disconnect
    connectWalletBtn.disabled = false;
    resetSimulation(); // Clear results when disconnecting
    console.log("Wallet Disconnected.");
}

// 2. Transaction Simulation Function
function simulateMint(isRaiku, failRate, submittedElement, successfulElement, failedElement, messageElement) {
    return new Promise(resolve => {
        
        const isSuccessful = Math.random() > failRate; // True if random number is greater than failRate
        
        // Update submitted count immediately
        let submitted = parseInt(submittedElement.textContent) + 1;
        submittedElement.textContent = submitted;

        // Simulate network delay before results (visual effect)
        setTimeout(() => {
            if (isSuccessful) {
                // SUCCESS (Guaranteed Execution)
                let successCount = parseInt(successfulElement.textContent) + 1;
                successfulElement.textContent = successCount;
                messageElement.textContent = isRaiku ? "Success: Raiku guaranteed inclusion!" : "Success: Standard RPC got lucky.";
                messageElement.style.color = '#7ed3d7'; // Green
            } else {
                // FAILURE (Dropped Transaction)
                let failedCount = parseInt(failedElement.textContent) + 1;
                failedElement.textContent = failedCount;
                messageElement.textContent = isRaiku ? 
                    "ERROR: Raiku Infrastructure FAILED (Extremely Rare)" : 
                    "ERROR: Transaction Dropped (Standard RPC Congestion)";
                messageElement.style.color = '#d0021b'; // Red
            }
            resolve(isSuccessful);
        }, Math.random() * 500 + 100); // 100ms to 600ms simulated time
    });
}

// 3. Wallet Connection/Disconnection Handler
connectWalletBtn.addEventListener('click', () => {
    if (isConnected) {
        // If currently connected, disconnect
        disconnectWallet();
    } else {
        // If currently disconnected, connect
        const address = generateRandomAddress();
        isConnected = true;
        connectWalletBtn.textContent = 'Disconnect Wallet';
        // Add the disconnect styling (red button)
        connectWalletBtn.classList.add('disconnect-btn'); 
        
        walletStatus.textContent = 'Status: Connected';
        walletStatus.classList.add('connected');
        walletAddress.textContent = `Wallet: ${address.substring(0, 4)}...${address.substring(address.length - 4)}`;
        runSimulationBtn.disabled = false; // Enable simulation on connect
        connectWalletBtn.disabled = false; // Keep button enabled for disconnect
        
        console.log("Wallet Connected:", address);
    }
});

// 4. Run Simulation Button Handler (UPDATED TO USE USER INPUT)
runSimulationBtn.addEventListener('click', async () => {
    resetSimulation();
    runSimulationBtn.disabled = true;
    
    // Get the user-defined mint quantity
    const userMintQuantity = parseInt(mintQuantityInput.value) || 10;
    
    let standardSuccesses = 0;
    let raikuSuccesses = 0;

    // Loop through the user's defined mint quantity
    for (let i = 0; i < userMintQuantity; i++) {
        // Run both bots in parallel for a single mint attempt
        const [standardResult, raikuResult] = await Promise.all([
            simulateMint(false, STANDARD_FAIL_RATE, standardSubmitted, standardSuccessful, standardFailed, standardMessage),
            simulateMint(true, RAIKU_FAIL_RATE, raikuSubmitted, raikuSuccessful, raikuFailed, raikuMessage)
        ]);

        if (standardResult) standardSuccesses++;
        if (raikuResult) raikuSuccesses++;
    }

    // Final Summary (UPDATED TO REFERENCE userMintQuantity)
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
    runSimulationBtn.disabled = false; // Allow re-running
});

// 5. Input Field Listener (NEW FUNCTION)
mintQuantityInput.addEventListener('input', () => {
    let value = parseInt(mintQuantityInput.value);
    // Ensure value is within bounds (1-1000)
    if (isNaN(value) || value < 1) {
        value = 1;
    } else if (value > 1000) {
        value = 1000;
    }
    // Set the input value and update the display text in the heading
    mintQuantityInput.value = value;
    mintQuantityDisplay.textContent = value;
});
// --- MODAL DISPLAY LOGIC ---

// Function to close the modal
function closeModal() {
    welcomeModal.style.display = 'none';
}

// Add event listeners to close buttons
modalCloseButton.addEventListener('click', closeModal);
closeSpan.addEventListener('click', closeModal);

// Show the modal when the page loads
window.onload = function() {
    welcomeModal.style.display = 'block';
}

// Close the modal if the user clicks anywhere outside of the modal content
window.addEventListener('click', (event) => {
    if (event.target == welcomeModal) {
        closeModal();
    }
});
// --- Initial Setup (Disable simulation until wallet connects) ---
runSimulationBtn.disabled = true;