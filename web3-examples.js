/**
 * WEB3 MASTER LAB - CORE LOGIC
 * 
 * Este archivo es el puente definitivo entre tu interfaz de usuario (Frontend)
 * y la red descentralizada de Ethereum (Backend).
 */

let provider; // Instancia de conexión al nodo RPC
let signer;   // Instancia para firmar y enviar datos a la red
let address;  // Dirección 0x del usuario conectado

// --- REFERENCIAS A LA UI ---
const mainConnectBtn = document.getElementById('main-connect-btn');
const userInfo = document.getElementById('user-info');
const userAddressSpan = document.getElementById('user-address');

/**
 * FUNCIÓN DE CONEXIÓN MAESTRA
 * Maneja la inyección de window.ethereum y configura el estado global.
 */
async function connect() {
    // 1. Verificamos si el navegador tiene una wallet (MetaMask, Rabby, etc.)
    if (!window.ethereum) return alert("¡Wallet no detectada! Instala MetaMask.");
    
    try {
        // 2. Creamos el Provider (Lectura)
        provider = new ethers.BrowserProvider(window.ethereum);
        
        // 3. Solicitamos acceso a las cuentas (Backend local de la wallet)
        const accounts = await provider.send("eth_requestAccounts", []);
        
        // 4. Creamos el Signer (Escritura)
        signer = await provider.getSigner();
        address = await signer.getAddress();

        // 5. Actualizamos la interfaz visual
        mainConnectBtn.classList.add('hidden');
        userInfo.classList.remove('hidden');
        userAddressSpan.textContent = `${address.slice(0, 6)}...${address.slice(-4)}`;
        
        // 6. Activamos los listeners para detectar cambios en tiempo real
        setupEventListeners();
        
    } catch (error) {
        console.error("Conexión fallida:", error);
    }
}

/**
 * EJEMPLO 1: CONSULTA DE IDENTIDAD (READ CALL)
 * ¿Cómo extraemos datos de la base de datos global?
 */
async function showProfile() {
    if (!address) return alert("Conecta tu wallet primero.");
    
    const display = document.getElementById('profile-display');
    display.classList.remove('hidden');
    
    // Llamada al backend (Blockchain): Consultamos balance y red
    const [balance, network] = await Promise.all([
        provider.getBalance(address),
        provider.getNetwork()
    ]);
    
    // Formateamos y mostramos los datos
    document.getElementById('p-addr').textContent = address;
    document.getElementById('p-bal').textContent = `${ethers.formatEther(balance).slice(0, 6)} ETH`;
    document.getElementById('p-net').textContent = network.name;
}

/**
 * EJEMPLO 2: ENVÍO DE TRANSACCIÓN (WRITE CALL)
 * Aquí es donde el usuario firma una instrucción que cambia el estado del backend.
 */
async function sendEth() {
    if (!signer) return alert("Conecta tu wallet.");
    
    const target = document.getElementById('send-target').value;
    const status = document.getElementById('send-status');
    
    if (!ethers.isAddress(target)) return alert("Dirección destino inválida.");

    try {
        status.classList.remove('hidden');
        status.textContent = "ESPERANDO FIRMA EN METAMASK...";
        
        // 1. Enviamos la transacción a la red
        const tx = await signer.sendTransaction({
            to: target,
            value: ethers.parseEther("0.001")
        });
        
        status.textContent = "TRANSACCIÓN ENVIADA AL MEMPOOL... 🚀";
        
        // 2. Esperamos la confirmación del bloque (Minería)
        const receipt = await tx.wait();
        status.textContent = `✅ CONFIRMADA EN BLOQUE #${receipt.blockNumber}`;
        
    } catch (error) {
        status.textContent = "❌ TRANSACCIÓN CANCELADA";
    }
}

/**
 * EJEMPLO 3: LECTURA DE CONTRATOS (ABI CALL)
 * Interactuamos con código ya desplegado en la red.
 */
async function readContract() {
    const addr = document.getElementById('contract-addr').value;
    const result = document.getElementById('contract-result');
    
    if (!ethers.isAddress(addr)) return alert("Contrato inválido.");

    try {
        result.classList.remove('hidden');
        result.textContent = "CONSULTANDO ABI...";
        
        // Definimos la interfaz (lo que queremos preguntar)
        const abi = ["function name() view returns (string)"];
        const contract = new ethers.Contract(addr, abi, provider);
        
        // Ejecutamos la consulta al backend
        const name = await contract.name();
        result.textContent = `NOMBRE ENCONTRADO: "${name}"`;
        
    } catch (error) {
        result.textContent = "ERROR: ¿ESTÁS EN LA RED CORRECTA?";
    }
}

/**
 * HERRAMIENTAS DE DEBUG (JSON-RPC)
 * Inspeccionamos los datos crudos que viajan por el cable.
 */
async function debugRaw(type) {
    if (!provider) return alert("Conecta tu wallet.");
    
    const consoleDiv = document.getElementById('raw-console');
    const output = document.getElementById('raw-output');
    
    consoleDiv.classList.remove('hidden');
    output.textContent = "// Consultando al Nodo RPC...";

    try {
        let data;
        if (type === 'block') {
            const num = await provider.getBlockNumber();
            data = await provider.getBlock(num);
        } else if (type === 'gas') {
            data = await provider.getFeeData();
        } else {
            data = await provider.getNetwork();
        }

        // Limpiamos BigInts para que JSON.stringify no falle
        const cleanData = JSON.parse(JSON.stringify(data, (k, v) => 
            typeof v === 'bigint' ? v.toString() : v
        ));
        
        output.textContent = JSON.stringify(cleanData, null, 4);
    } catch (e) {
        output.textContent = `// Error RPC: ${e.message}`;
    }
}

/**
 * LISTENERS DE EVENTOS
 * Detectamos cambios en la billetera sin refrescar la página.
 */
function setupEventListeners() {
    window.ethereum.on('accountsChanged', () => window.location.reload());
    window.ethereum.on('chainChanged', () => window.location.reload());
}

// --- ASIGNACIÓN DE EVENTOS A BOTONES ---
mainConnectBtn.addEventListener('click', connect);
document.getElementById('btn-show-profile').addEventListener('click', showProfile);
document.getElementById('btn-send-eth').addEventListener('click', sendEth);
document.getElementById('btn-read-contract').addEventListener('click', readContract);
document.getElementById('btn-raw-block').addEventListener('click', () => debugRaw('block'));
document.getElementById('btn-raw-gas').addEventListener('click', () => debugRaw('gas'));
document.getElementById('btn-raw-net').addEventListener('click', () => debugRaw('net'));

// Reconexión automática si el usuario ya tiene sesión
if (window.ethereum && window.ethereum.selectedAddress) connect();
