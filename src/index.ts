import * as a1lib from "alt1";
import ChatboxReader from "alt1/chatbox";

import "./appconfig.json";
import "./icon.png";

declare global {
    interface Window {
        alt1: any;
    }
}

// ===== CONSTS =====
const APP_NAME = "LuckyDrops";
const timestampRegex = /\[\d{2}:\d{2}:\d{2}\]/g;

const RARE_COMPONENTS = [
    "Brassican","Knightly","Dragonfire","Fungal",
    "Explosive",
    "Corporeal",
    "Armadyl",
    "Bandos",
    "Saradomin",
    "Seren",
    "Zamorak",
    "Zaros",
    "Resilient",
    "Silent",
    "Noxious",
    "Rumbling",
    "Pestiferous",
    "Third-age",
    "Culinary",
    "Shifting",
    "Harnessed",
    "Oceanic",
    "Ascended",
    "Undead",
    "Avernic",
    "Shadow",
    "Ilujankan",
    "Cywir",
    "Faceted",
    "Clockwork",
    "Fortunate",
    "Manufactured",
    "Ecliptic"
];

// ===== VARIÁVEL DE FILTRO ATUAL =====
let currentFilter: string = "all"; // "all", "LOTD", "HSR", "BEAM", "SEREN", "COMPS"


// ===== VISUAL DEBUG =====
let debugDiv: HTMLDivElement | null = null;
let debugPanelVisible = false;
const DEBUG_MODE = true;  // ← Declara ANTES de usar

if (DEBUG_MODE) {
    debugDiv = document.createElement('div');
    debugDiv.style.cssText = `
        position: fixed; top: 200px; right: 50px; width: 300px; height: 500px;
        background: rgba(0,0,0,0.9); color: #0f0; font-family: monospace;
        font-size: 10px; padding: 5px; overflow-y: auto; z-index: 10000;
        border: 2px solid #ffd700; border-radius: 5px;
        display: none;
    `;
    document.body.appendChild(debugDiv);
}

function debug(msg: string) {
    console.log(msg);
    if (DEBUG_MODE && debugDiv && debugPanelVisible) {
        const line = document.createElement('div');
        line.textContent = `[${new Date().toLocaleTimeString()}] ${msg}`;
        debugDiv.appendChild(line);
        debugDiv.scrollTop = debugDiv.scrollHeight;
        
        while (debugDiv.children.length > 500) {
            debugDiv.removeChild(debugDiv.children[0]);
        }
    }
}
// ===== DOM ELEMENTS =====
const itemList = document.querySelector(".itemList") as HTMLElement;
const chatSelector = document.querySelector(".chat") as HTMLSelectElement;
const exportButton = document.querySelector(".export") as HTMLElement;
const clearButton = document.querySelector(".clear") as HTMLElement;
const listHeader = document.querySelector(".header") as HTMLElement;
const itemTotal = document.getElementById("total") as HTMLElement;
const totalCountDisplay = document.getElementById("totalCount") as HTMLElement; 
const appColor = a1lib.mixColor(0, 255, 255);
const reader = new ChatboxReader();
const appName = "LuckyDrops";




// ===== COLOR CONFIG =====
reader.readargs = {
    colors: [
        a1lib.mixColor(255, 255, 255),  // Branco (texto fixo)
        a1lib.mixColor(255, 112, 0),    // LOTD & HSR (laranja)
        a1lib.mixColor(245, 151, 0),    // Beam (laranja mais claro)
        a1lib.mixColor(0, 255, 255),    // Seren (ciano)
        a1lib.mixColor(255, 165, 0),    // COMPONENTS (laranja)
        a1lib.mixColor(255, 128, 0),    // COMPONENTS (laranja Blessing Gods)
        a1lib.mixColor(255, 0, 0)       // Vermelho (componentes raros)
    ]
};

// ===== UPDATE COUNT IN MODAL =====
function updateCounters() {
    const data = getSaveData("data") || [];
    
    let lotd = 0, hsr = 0, beam = 0, seren = 0, comps = 0;
    
    data.forEach((item: any) => {
        if (item.type === "LOTD") lotd++;
        else if (item.type.includes("HSR")) hsr++;
        else if (item.type === "BEAM") beam++;
        else if (item.type === "SEREN") seren++;
        else if (item.type === "COMPS") comps++;
    });
    
    const lotdEl = document.getElementById("lotdCount");
    const hsrEl = document.getElementById("hazelmereCount");
    const beamEl = document.getElementById("beamCount");
    const serenEl = document.getElementById("serenCount");
    const compsEl = document.getElementById("compsCount");
    
    if (lotdEl) lotdEl.textContent = String(lotd);
    if (hsrEl) hsrEl.textContent = String(hsr);
    if (beamEl) beamEl.textContent = String(beam);
    if (serenEl) serenEl.textContent = String(seren);
    if (compsEl) compsEl.textContent = String(comps);
}

// ===== CACHE DE DROPS POR MINUTO =====
const dropsCache = new Map<string, { type: string, time: string, timestamp: number }>(); // Adiciona timestamp numérico

// Limpa apenas entradas antigas do cache (mais de 2 minutos)
setInterval(() => {
    const now = Date.now();
    let removed = 0;
    
    for (let [key, value] of dropsCache.entries()) {
        // Se o registro tem mais de 2 minutos (120000 ms)
        if (now - value.timestamp > 120000) {
            dropsCache.delete(key);
            removed++;
        }
    }
    
    if (removed > 0) {
        debug(`🧹 Cache limpo: ${removed} entradas removidas, ${dropsCache.size} restantes`);
    }
}, 60000); // Verifica a cada minuto

// ===== DEFAULT PHRASES =====
const DEFAULT_PHRASES = [
    // LOTD
    "Your Luck of the Dwarves ring shines brightly. You receive: (\\d+) x (.*)",
    "Your Luck of the Dwarves shines brightly and you receive: (\\d+) x (.*)",
    
    // BEAM (SÓ UMA VEZ!)
    "A golden beam shines over one of your items. You receive: (\\d+) x (.*)",
    
    // HAZELMERE
    "Your Hazelmere's signet ring shines brightly. You receive: (\\d+) x (.*)",
    "The power of Hazelmere blesses your drop and doubles it before your very eyes: (\\d+) x (.*)",
    
    // SEREN
    "The Seren spirit gifts you: (\\d+) x (.*)",

    // COMPONENTS
    "Materials gained: (\\d+) x (.*)",
    "Your Scavenging perk adds: (\\d+) x (.*)"
];
// ===== DROPS RESET =====
const factoryResetBtn = document.getElementById("factoryResetBtn");

if (factoryResetBtn) {
    const newBtn = factoryResetBtn.cloneNode(true);
    factoryResetBtn.parentNode?.replaceChild(newBtn, factoryResetBtn);

    newBtn.addEventListener("click", function() {
        debug("🖱️ Reset clicked!");
        
        showConfirmModal(
            "RESET DROP HISTORY?\n\n" +
            "This will delete:\n" +
            "• All drop history\n\n" +
            "Saved phrases and webhook will NOT be affected.\n\n" +
            "This cannot be undone!",
            () => {
                debug("✅ User confirms");
                
                // No change webhook e frases
                const webhook = localStorage.getItem(`${APP_NAME}_webhook`);
                const phrases = localStorage.getItem(`${APP_NAME}_phrases`);
                
                localStorage.clear();
                
                if (webhook) localStorage.setItem(`${APP_NAME}_webhook`, webhook);
                if (phrases) localStorage.setItem(`${APP_NAME}_phrases`, phrases);
                
                localStorage.setItem(APP_NAME, JSON.stringify({ 
                    chat: 0, 
                    data: [], 
                    mode: "history" 
                }));
                
                sessionStorage.removeItem(`${APP_NAME}chatHistory`);
                
                debug("✅ Drops erased! Webhook and phrases no changed.");
                
                // Feedback
                this.textContent = "✅ DROPS RESET!";
                this.style.backgroundColor = "#28a745";
                
                setTimeout(() => {
                    location.reload();
                }, 1500);
            }
        );
    });
}

// ===== CHECK ALT1 =====
if (window.alt1) {
    window.alt1.identifyAppUrl("./appconfig.json");
    debug("✅ Alt1 detectado");
} else {
    itemList.innerHTML = `<li>Alt1 not detected. <a href="https://alt1.org">Get Alt1</a></li>`;
}

// ===== BASICS FUNCTIONS =====
function showSelectedChat(chat: any) {
    if (!chat?.mainbox?.rect) return;
    try {
        window.alt1?.overLayRect(appColor, chat.mainbox.rect.x, chat.mainbox.rect.y,
            chat.mainbox.rect.width, chat.mainbox.rect.height, 2000, 5);
    } catch (e) { debug("Overlay error"); }
}

function updateChatHistory(chatLine: string) {
    let history = sessionStorage.getItem(`${appName}chatHistory`) || "";
    let lines = history ? history.split("\n") : [];
    lines.push(chatLine);
    while (lines.length > 100) lines.shift();
    sessionStorage.setItem(`${appName}chatHistory`, lines.join("\n"));
}

function isInHistory(chatLine: string): boolean {
    let history = sessionStorage.getItem(`${appName}chatHistory`);
    return history ? history.split("\n").some(l => l.trim() === chatLine) : false;
}

function updateSaveData(...datasets: any[]) {
    let current = JSON.parse(localStorage.getItem(appName) || "{}");
    datasets.forEach(data => {
        let key = Object.keys(data)[0];
        let val = data[key];
        if (key === "data") {
            if (!current[key]) current[key] = [];
            current[key].push(val);
        } else {
            current[key] = val;
        }
    });
    localStorage.setItem(appName, JSON.stringify(current));
}

function getSaveData(key: string) {
    let data = JSON.parse(localStorage.getItem(appName) || "null");
    return data?.[key] ?? false;
}


// ===== FUNÇÃO PARA VERIFICAR SE DROP JÁ EXISTE =====
function isDuplicateDrop(itemName: string, chatLine: string, currentType: string): boolean {
    // Extrai o timestamp
    let timeMatch = chatLine.match(/\[(\d{2}:\d{2}:\d{2})\]/);
    if (!timeMatch) return false;
    
    let currentTime = timeMatch[1];
    let minuteKey = currentTime.substring(0, 5); // HH:MM
    let cacheKey = `${itemName}:${minuteKey}`;
    
    // Verifica no cache
    if (dropsCache.has(cacheKey)) {
        let cached = dropsCache.get(cacheKey);
        debug(`🔍 Cache HIT: ${itemName} já registrado como ${cached?.type} às ${minuteKey}`);
        return true;
    }
    
    // Se não está no cache, adiciona com timestamp atual
    dropsCache.set(cacheKey, { 
        type: currentType, 
        time: currentTime,
        timestamp: Date.now() // Adiciona timestamp numérico
    });
    
    debug(`💚 Cache MISS: ${itemName} adicionado ao cache como ${currentType} às ${minuteKey}`);
    return false;
}

function debugCache() {
    if (dropsCache.size > 0) {
        debug(`📊 Cache atual (${dropsCache.size} entradas):`);
        for (let [key, value] of dropsCache.entries()) {
            debug(`   ${key} -> ${value.type} (${new Date(value.timestamp).toLocaleTimeString()})`);
        }
    } else {
        debug(`📊 Cache vazio`);
    }
}


function readChatbox() {
    let opts = reader.read() || [];
    if (opts.length === 0) return;
    
    debug(`📖 Lendo chat... ${opts.length} segmentos`);
    
    // DEBUG: Mostrar todos os segmentos brutos
    for (let i = 0; i < opts.length; i++) {
        const segment = opts[i];
        debug(`  Segmento ${i}: y=${segment.y}, text="${segment.text?.substring(0, 50)}"`);
    }
    
    // PASSO 1: Se muitos segmentos têm y undefined, usa abordagem alternativa
    let hasValidY = opts.some(seg => seg.y !== undefined && seg.y !== null);
    
    let allMessages: string[] = [];
    
    if (!hasValidY) {
        debug("⚠️ Nenhum segmento com Y válido, usando abordagem alternativa");
        
        // Abordagem alternativa: simplesmente juntar todos os textos
        let fullText = opts.map(seg => seg.text || "").join(" ");
        
        // Dividir por timestamps
        let parts = fullText.split(/(?=\[\d{2}:\d{2}:\d{2}\])/);
        
        for (let part of parts) {
            let message = part.trim();
            if (message && message.match(/\[\d{2}:\d{2}:\d{2}\]/) && message.length > 15) {
                message = message.replace(/\s+/g, ' ').trim();
                allMessages.push(message);
                debug(`  📌 Mensagem: "${message}"`);
            }
        }
    } else {
        debug(`✅ ${opts.filter(seg => seg.y !== undefined).length} segmentos com Y válido`);
        
        // Abordagem normal: agrupar por Y
        let linesMap = new Map<number, string>();
        
        for (let i = 0; i < opts.length; i++) {
            const segment = opts[i];
            if (!segment.text) continue;
            
            // Só agrupa se tiver Y válido
            if (segment.y !== undefined && segment.y !== null) {
                const y = segment.y;
                const currentText = linesMap.get(y) || "";
                linesMap.set(y, currentText + (currentText ? " " : "") + segment.text);
            } else {
                // Se não tem Y, trata como linha separada
                debug(`  ⚠️ Segmento sem Y: "${segment.text.substring(0, 30)}"`);
                allMessages.push(segment.text.trim());
            }
        }
        
        // Processar linhas agrupadas por Y
        for (let [y, lineText] of linesMap.entries()) {
            let parts = lineText.split(/(?=\[\d{2}:\d{2}:\d{2}\])/);
            
            for (let part of parts) {
                let message = part.trim();
                if (message && message.match(/\[\d{2}:\d{2}:\d{2}\]/) && message.length > 15) {
                    message = message.replace(/\s+/g, ' ').trim();
                    allMessages.push(message);
                    debug(`  📌 Mensagem Y=${y}: "${message}"`);
                }
            }
        }
    }
    
    debug(`📨 Total de ${allMessages.length} mensagens encontradas`);
    
    // PASSO 2: Processar cada mensagem
    for (let chatLine of allMessages) {
        debug(`\n📄 Processando: "${chatLine}"`);
        
        if (isInHistory(chatLine)) {
            debug(`⏭️ Já processada`);
            continue;
        }
        
        let salvo = false;
        
        // ===== DETECÇÃO POR PALAVRAS-CHAVE =====
        
        // LOTD
        if (!salvo && chatLine.includes("Luck") && chatLine.includes("Dwarves")) {
            debug("💍 LOTD detected");
            let match = chatLine.match(/receive:?\s*(\d+)\s*x\s*(.+)/i);
            if (match) {
                let qty = parseInt(match[1]);
                let item = match[2].trim().replace(/[.!?]$/, '');
                
                if (isDuplicateDrop(item, chatLine, "LOTD")) {
                    debug(`⏭️ Drop duplicated (LOTD): ${item}`);
                    salvo = true;
                } else {
                    let dropItem = {
                        item: `${qty} x ${item}`,
                        quantity: qty,
                        name: item,
                        type: "LOTD",
                        time: new Date(),
                        chatLine
                    };
                    
                    updateSaveData({ data: dropItem });
                    updateChatHistory(chatLine);
                    showItems();
                    sendDiscordNotification(dropItem);
                    debug(`💾 LOTD SAVE! ${qty} x ${item}`);
                    salvo = true;
                }
            }
        }

        // BEAM
        if (!salvo && chatLine.includes("golden") && chatLine.includes("beam")) {
            debug("✨ BEAM detected");
            let match = chatLine.match(/receive:?\s*(\d+)\s*x\s*(.+)/i);
            if (match) {
                let qty = parseInt(match[1]);
                let item = match[2].trim().replace(/[.!?]$/, '');
                
                if (isDuplicateDrop(item, chatLine, "BEAM")) {
                    debug(`⏭️ Drop duplicated (BEAM): ${item}`);
                    salvo = true;
                } else {
                    let dropItem = {
                        item: `${qty} x ${item}`,
                        quantity: qty,
                        name: item,
                        type: "BEAM",
                        time: new Date(),
                        chatLine
                    };
                    
                    updateSaveData({ data: dropItem });
                    updateChatHistory(chatLine);
                    showItems();
                    sendDiscordNotification(dropItem);
                    debug(`💾 BEAM SAVE! ${qty} x ${item}`);
                    salvo = true;
                }
            }
        }

        // SEREN
        if (!salvo && chatLine.includes("Seren") && chatLine.includes("spirit")) {
            debug("💎 SEREN detected");
            let match = chatLine.match(/gifts you:?\s*(\d+)\s*x\s*(.+)/i);
            if (match) {
                let qty = parseInt(match[1]);
                let item = match[2].trim();
                item = item.replace(/\.?\s*The gift is sent to your bank\.?$/i, '').replace(/[.!?]$/, '');
                
                if (isDuplicateDrop(item, chatLine, "SEREN")) {
                    debug(`⏭️ Drop duplicated (SEREN): ${item}`);
                    salvo = true;
                } else {
                    let dropItem = {
                        item: `${qty} x ${item}`,
                        quantity: qty,
                        name: item,
                        type: "SEREN",
                        time: new Date(),
                        chatLine
                    };
                    
                    updateSaveData({ data: dropItem });
                    updateChatHistory(chatLine);
                    showItems();
                    sendDiscordNotification(dropItem);
                    debug(`💾 SEREN SAVE! ${qty} x ${item}`);
                    salvo = true;
                }
            }
        }

        // HAZELMERE
        if (!salvo && chatLine.includes("Hazelmere")) {
            debug("🔱 HAZELMERE detected");
            let match = chatLine.match(/receive:?\s*(\d+)\s*x\s*(.+)/i);
            if (match) {
                let qty = parseInt(match[1]);
                let item = match[2].trim().replace(/[.!?]$/, '');
                let type = chatLine.includes("doubles") ? "HSR_DOUBLE" : "HSR";
                
                if (isDuplicateDrop(item, chatLine, type)) {
                    debug(`⏭️ Duplicated Drop (HAZELMERE): ${item}`);
                    salvo = true;
                } else {
                    let dropItem = {
                        item: `${qty} x ${item}`,
                        quantity: qty,
                        name: item,
                        type: type,
                        time: new Date(),
                        chatLine
                    };
                    
                    updateSaveData({ data: dropItem });
                    updateChatHistory(chatLine);
                    showItems();
                    sendDiscordNotification(dropItem);
                    debug(`💾 HAZELMERE SAVE! ${qty} x ${item}`);
                    salvo = true;
                }
            }
        }
        
        // COMPONENTS (Scavenging) - COM DETECÇÃO DE COR VERMELHA
        if (!salvo && (chatLine.includes("Materials gained:") || chatLine.includes("Scavenging perk adds:"))) {
            debug("💡 COMPONENTS detected");
            
            let match = chatLine.match(/(?:Materials gained:|Your Scavenging perk adds:)\s*(\d+)\s*x\s*(.+)/i);
            if (match) {
                let qty = parseInt(match[1]);
                let item = match[2].trim().replace(/[.!?]$/, '');
                
                debug(`  → Quantidade: ${qty}, Item: "${item}"`);
                
                if (isDuplicateDrop(item, chatLine, "COMPS")) {
                    debug(`⏭️ Component duplicated: ${item}`);
                    salvo = true;
                } else {
                    let displayName = item.replace(/\s+components?$/i, '');
                    
                    // ===== DETECTA SE O COMPONENTE É VERMELHO PELA COR DO CHAT =====
                    // O Alt1 já detecta a cor no objeto 'opts' original
                    // Precisamos encontrar qual segmento contém este texto
                    let isRareByColor = false;
                    
                    // Procurar nos segmentos originais do reader
                    if (reader.read() && reader.read().length > 0) {
                        const segments = reader.read();
                        for (let seg of segments) {
                            if (seg.text && seg.text.includes(displayName) && seg.color) {
                                const [r, g, b] = seg.color;
                                // Verifica se é vermelho (R alto, G e B baixos)
                                if (r > 200 && g < 100 && b < 100) {
                                    isRareByColor = true;
                                    debug(`🔴 Componente VERMELHO detectado pela cor: ${displayName} (rgb: ${r},${g},${b})`);
                                    break;
                                }
                            }
                        }
                    }
                    
                    // Fallback: se não detectou pela cor, usa a lista estática
                    let isRare = isRareByColor || RARE_COMPONENTS.includes(displayName);
                    
                    let dropItem = {
                        item: `${qty} x ${displayName}`,
                        quantity: qty,
                        name: displayName,
                        type: "COMPS",
                        isRare: isRare,
                        time: new Date(),
                        chatLine
                    };
                    
                    updateSaveData({ data: dropItem });
                    updateChatHistory(chatLine);
                    showItems();
                    sendDiscordNotification(dropItem);
                    debug(`💾 COMPONENTS SAVE! ${qty} x ${item} -> ${displayName}${isRare ? ' 🔴 RARO!' : ''}`);
                    salvo = true;
                }
            }
        }
        
        // ===== FRASES PERSONALIZADAS =====
        if (!salvo) {
            let phrases = JSON.parse(localStorage.getItem(`${appName}_phrases`) || "null") || DEFAULT_PHRASES;
            
            for (let phrase of phrases) {
                let pattern = phrase
                    .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
                    .replace(/\\\(\\d\+\\\\\)/g, '(\\d+)')
                    .replace(/\\\(\.\+\\\\\)/g, '(.*)');
                
                let regex = new RegExp(`^\\[\\d{2}:\\d{2}:\\d{2}\\] ${pattern}`);
                let match = chatLine.match(regex);
                
                if (match) {
                    let type = "CUSTOM";
                    if (phrase.includes("Luck")) type = "LOTD";
                    else if (phrase.includes("Hazelmere")) type = phrase.includes("doubles") ? "HSR_DOUBLE" : "HSR";
                    else if (phrase.includes("golden")) type = "BEAM";
                    else if (phrase.includes("Seren")) type = "SEREN";
                    
                    let qty = parseInt(match[1]);
                    let item = match[2].trim().replace(/[.!?]$/, '');
                    
                    if (isDuplicateDrop(item, chatLine, type)) {
                        debug(`⏭️ Drop por frase duplicado ignorado (${type}): ${item}`);
                        salvo = true;
                        break;
                    }
                    
                    debug(`🎉 DROP por frase! ${type}: ${qty} x ${item}`);
                    
                    let dropItem = {
                        item: `${qty} x ${item}`,
                        quantity: qty,
                        name: item,
                        type: type,
                        time: new Date(),
                        chatLine
                    };
                    
                    updateSaveData({ data: dropItem });
                    updateChatHistory(chatLine);
                    showItems();
                    sendDiscordNotification(dropItem);
                    salvo = true;
                    break;
                }
            }
        }
        
        if (!salvo) {
            debug(`ℹ️ Nenhum drop detectado nesta linha`);
        }
    }
}
function showItems() {
    if (!itemList) return;
    
    // Remove apenas os itens de drop
    const dropItems = itemList.querySelectorAll("li.item:not(.header):not(.total):not(.filters-container):not(.filter-count):not(.loading)");
    dropItems.forEach(el => el.remove());
    
    let data = getSaveData("data") || [];
    
    // Atualiza o total principal
    const totalElement = document.getElementById("total");
    if (totalElement) {
        totalElement.textContent = String(data.length);
    }
    
    // Atualiza o totalCount na área de filtros
    const totalCountElement = document.getElementById("totalCount");
    if (totalCountElement) {
        totalCountElement.textContent = String(data.length);
    }
    
    // Atualiza o totalFiltered na área de filtros
    const totalFilteredElement = document.getElementById("totalFiltered");
    if (totalFilteredElement) {
        if (data.length === 0) {
            totalFilteredElement.textContent = "0";
        }
    }
    
    // Se não há dados, mantém o loading
    if (data.length === 0) {
        let loadingItem = itemList.querySelector(".item.loading");
        if (!loadingItem) {
            itemList.insertAdjacentHTML("beforeend", `
                <li class="list-group-item item loading">
                    ⚠️ If you're reading this, the Chat Reader is not working ⚠️<br>
                    Try:<br>
                    • Enable timestamps (Runescape settings)<br>
                    • Set interface transparency to 0%<br>
                    • In Alt1, click 🔧 and enable:<br>
                    &nbsp;&nbsp;- View screen<br>
                    &nbsp;&nbsp;- Get game state<br>
                    &nbsp;&nbsp;- Show overlay<br>
                    • Close and reopen the app<br>
                    <br>
                    Still issues? Wait for an update.<br>
                    <br>
                    ⚠️ Se está lendo isso o Leitor de Chat Não Funciona ⚠️<br>
                    Tente:<br>
                    • Ativar os horários do jogo (config. do RS3)<br>
                    • Colocar a Transparência da interface em 0%<br>
                    • No Alt1, clique em 🔧 e ative:<br>
                    &nbsp;&nbsp;- Ver tela<br>
                    &nbsp;&nbsp;- Obter estado do jogo<br>
                    &nbsp;&nbsp;- Mostrar overlay<br>
                    • Fecha e abrir o app novamente<br>
                    <br>
                    Ainda com problemas? Aguarde uma atualização.
                </li>
            `);
        }
        return;
    }
    
    // Se tem dados, remove o loading se existir
    const loadingItem = itemList.querySelector(".item.loading");
    if (loadingItem) {
        loadingItem.remove();
    }
    
    let mode = getSaveData("mode");
    
    // Filtrar dados se não for "all"
    let filteredData = data;
    if (currentFilter !== "all") {
        if (currentFilter === "HSR") {
            filteredData = data.filter((item: any) => item.type.includes("HSR"));
        } else {
            filteredData = data.filter((item: any) => item.type === currentFilter);
        }
    }
    
    // Função para pegar emoji baseado no tipo do item
    function getEmojiByType(type: string): string {
        if (type === "LOTD") return "💍";
        if (type.includes("HSR")) return "🔱";
        if (type === "BEAM") return "✨";
        if (type === "SEREN") return "💎";
        if (type === "COMPS") return "💡";
        return "📦";
    }
    
    if (mode === "total") {
        listHeader.innerHTML = "Drop Totals";
        listHeader.dataset.show = "history";
        
        let totals: any = {};
        filteredData.forEach((item: any) => {
            if (!totals[item.name]) totals[item.name] = { total:0, lotd:0, hsr:0, beam:0, seren:0, comps:0, type: item.type };
            totals[item.name].total += item.quantity;
            if (item.type === "LOTD") totals[item.name].lotd += item.quantity;
            else if (item.type.includes("HSR")) totals[item.name].hsr += item.quantity;
            else if (item.type === "BEAM") totals[item.name].beam += item.quantity;
            else if (item.type === "SEREN") totals[item.name].seren += item.quantity;
            else if (item.type === "COMPS") totals[item.name].comps += item.quantity;
        });
        
        Object.keys(totals).sort().forEach(n => {
            let t = totals[n];
            
            let emoji = getEmojiByType(t.type);
            let isRareComponent = RARE_COMPONENTS.indexOf(n) !== -1;
        
            // ===== CORREÇÃO: Para COMPS raros, usa apenas a bola vermelha =====
            let iconDisplay = "";
            let itemStyle = "";
            
            if (currentFilter === "COMPS" && isRareComponent) {
                // Raro: mostra apenas a bola vermelha, sem emoji de lâmpada
                iconDisplay = "🔴";
                itemStyle = ' style="color: #ff0000 !important; font-weight: bold !important;"';
            } else if (currentFilter === "COMPS" && !isRareComponent) {
                // Comum: mostra apenas o emoji de lâmpada
                iconDisplay = "💡";
            } else {
                // Outros tipos: mostra o emoji correspondente
                iconDisplay = emoji;
            }
            let quantity = 0;
            if (currentFilter === "LOTD") quantity = t.lotd;
            else if (currentFilter === "HSR") quantity = t.hsr;
            else if (currentFilter === "BEAM") quantity = t.beam;
            else if (currentFilter === "SEREN") quantity = t.seren;
            else if (currentFilter === "COMPS") quantity = t.comps;
            else quantity = t.total;
                    
            if (quantity > 0) {
                let displayText = `${iconDisplay} ${n}: ${quantity}`;
                    
                itemList.insertAdjacentHTML("beforeend",
                    `<li class="list-group-item item"${itemStyle}>${displayText}</li>`);
            }
        });
    } else {
        listHeader.innerHTML = "Drop History";
        listHeader.dataset.show = "total";
        
        filteredData.slice().reverse().forEach((item: any) => {
            let icon = item.type === "LOTD" ? "💍" : 
                    item.type.includes("HSR") ? "🔱" : 
                    item.type === "BEAM" ? "✨" : 
                    item.type === "SEREN" ? "💎" : 
                    item.type === "COMPS" ? (item.isRare ? "🔴" : "💡") : "📦";
            
            // ===== ESTILO INLINE PARA COMPONENTES RAROS =====
            let itemStyle = "";
            let itemText = item.item;
            
            if (item.type === "COMPS" && item.isRare) {
                itemStyle = ' style="color: #ff0000 !important; font-weight: bold !important;"';
                debug(`🔴 Exibindo componente raro: ${item.name}`);
            } else {
                debug(`⚪ Componente comum: ${item.name} - isRare: ${item.isRare}`);
            }

            // ===== FORMATAÇÃO DA DATA/HORA =====
            let dataHora = new Date(item.time);
            let dataFormatada = dataHora.toLocaleDateString();
            let horaFormatada = dataHora.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
            
            let filterTag = "";
            let displayText = "";
            
            if (currentFilter === "all") {
                // Filtro ALL: mostra apenas o item
                displayText = `${icon} ${itemText}`;
            } else {
                // Outros filtros: mostra com data e hora
                displayText = `${icon} ${itemText} - 📅 ${dataFormatada} - 🕒 ${horaFormatada}`;
            }
            
            itemList.insertAdjacentHTML("beforeend",
                `<li class="list-group-item item"${itemStyle} title="📅 ${dataFormatada} ${horaFormatada}${filterTag}">
                    ${displayText}
                </li>`);
        });
    }
    
    if (filteredData.length === 0 && data.length > 0) {
        itemList.insertAdjacentHTML("beforeend",
            `<li class="list-group-item item" style="text-align: center; color: #666;">✨ No drops for this filter ✨</li>`);
    }
    
    updateCounters();
    updateFilteredCounters(filteredData);
}

// Nova função para atualizar contadores com filtro
function updateFilteredCounters(filteredData: any[]) {
    // Atualiza o totalFiltered com a quantidade filtrada
    const totalFiltered = document.getElementById("totalFiltered");
    if (totalFiltered) {
        totalFiltered.textContent = String(filteredData.length);
    }
    
    // Atualiza o totalCount com o total geral (sem filtro)
    const data = getSaveData("data") || [];
    const totalCount = document.getElementById("totalCount");
    if (totalCount) {
        totalCount.textContent = String(data.length);
    }
}

// ===== SETUP DOS FILTROS =====
function setupFilters() {
    const filterButtons = document.querySelectorAll('.filter-btn');
    
    filterButtons.forEach(btn => {
        btn.addEventListener('click', function(this: HTMLElement) {
            // Remove active de todos
            filterButtons.forEach(b => b.classList.remove('active'));
            
            // Adiciona active no clicado
            this.classList.add('active');
            
            // Atualiza o filtro atual
            currentFilter = this.dataset.filter || "all";
            
            debug(`🔍 Filtrando por: ${currentFilter}`);
            
            // Atualiza a lista
            showItems();
        });
    });
}

function initFilters() {
    const filterButtons = document.querySelectorAll('.filter-btn');
    
    if (filterButtons.length === 0) {
        debug("⏳ Filtros não encontrados, tentando novamente em 500ms...");
        setTimeout(initFilters, 500);
        return;
    }
    
    debug(`✅ ${filterButtons.length} filtros encontrados, configurando...`);
    setupFilters();
}

// Inicia a procura pelos filtros
setTimeout(initFilters, 1000);

// ===== INICIALIZAÇÃO DO CHAT (IGUAL ZEROGWAFA) =====
window.setTimeout(() => {
    let findChat = setInterval(() => {
        if (!reader.pos) {
            reader.find();
            return;
        }
        clearInterval(findChat);
        debug("✅ Chat encontrado!");
        const loadingElement = document.querySelector(".item.loading");
        if (loadingElement) {
            loadingElement.remove();
        }
        debug("✅ Chat encontrado! Loading removido.");
        
        if (reader.pos?.boxes) {
            reader.pos.boxes.forEach((_: any, i: number) => {
                chatSelector.insertAdjacentHTML("beforeend", `<option value="${i}">Chat ${i}</option>`);
            });
            
            chatSelector.addEventListener("change", function (this: HTMLSelectElement) {
                let idx = Number(this.value);
                if (reader.pos?.boxes[idx]) {
                    reader.pos.mainbox = reader.pos.boxes[idx];
                    showSelectedChat(reader.pos);
                    updateSaveData({ chat: idx });
                }
            });
            
            let savedChat = getSaveData("chat");
            reader.pos.mainbox = savedChat ? reader.pos.boxes[Number(savedChat)] : reader.pos.boxes[0];
            updateSaveData({ chat: savedChat || 0 });
            
            showSelectedChat(reader.pos);
            showItems();
            setInterval(readChatbox, 600);
            debug("🔄 Leitura iniciada");
        }
    }, 1000);
}, 50);

// ===== EVENT LISTENERS =====
exportButton?.addEventListener("click", () => {
    let data = getSaveData("data") || [];
    let mode = getSaveData("mode");
    let csv = mode === "total" ? "Item,Total,LOTD,HSR\n" : "Item,Quantity,Type,Date,Time\n";
    let file = mode === "total" ? "totals.csv" : "history.csv";
    
    if (mode === "total") {
        let totals: any = {};
        data.forEach((i: any) => {
            if (!totals[i.name]) totals[i.name] = { total:0, lotd:0, hsr:0 };
            totals[i.name].total += i.quantity;
            if (i.type === "LOTD") totals[i.name].lotd += i.quantity;
            else if (i.type.includes("HSR")) totals[i.name].hsr += i.quantity;
        });
        Object.keys(totals).sort().forEach(n => csv += `${n},${totals[n].total},${totals[n].lotd},${totals[n].hsr}\n`);
    } else {
        data.forEach((i: any) => {
            let d = new Date(i.time);
            csv += `${i.name},${i.quantity},${i.type},${d.toLocaleDateString()},${d.toLocaleTimeString()}\n`;
        });
    }
    
    let blob = new Blob([csv], { type: "text/csv" });
    let link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = file;
    link.click();
});


listHeader?.addEventListener("click", () => {
    updateSaveData({ mode: listHeader.dataset.show });
    showItems();
});

// ===== FRASES PERSONALIZADAS =====
let phrasesTextarea = document.getElementById("customPhrases") as HTMLTextAreaElement;
let saveBtn = document.getElementById("savePhrases");

if (phrasesTextarea && saveBtn) {
    let saved = localStorage.getItem(`${appName}_phrases`);
    if (saved) {
        try { phrasesTextarea.value = JSON.parse(saved).join('\n'); } 
        catch (e) { debug("Erro frases"); }
    }
    
    saveBtn.addEventListener("click", () => {
        let phrases = phrasesTextarea.value.split('\n').map(p => p.trim()).filter(p => p);
        if (phrases.length) {
            localStorage.setItem(`${appName}_phrases`, JSON.stringify(phrases));
            saveBtn.textContent = "✅ Saved!";
            saveBtn.style.backgroundColor = "#28a745";
            setTimeout(() => {
                saveBtn.textContent = "💾 Save Phrases";
                saveBtn.style.backgroundColor = "";
            }, 1500);
            debug(`✅ ${phrases.length} frases salvas`);
        }
    });
}

// ===== DISCORD WEBHOOK =====
const webhookInput = document.getElementById("discordWebhook") as HTMLInputElement;
const saveWebhookBtn = document.getElementById("saveWebhookBtn");
const webhookStatus = document.getElementById("webhookStatus");


function loadWebhook() {
    const saved = localStorage.getItem(`${appName}_webhook`);
    if (saved && webhookInput) {
        webhookInput.value = saved;
        updateWebhookStatus("✅ Webhook carregado");
    }
}

function saveWebhook() {
    if (!webhookInput) return;
    
    const url = webhookInput.value.trim();
    
    if (!url) {
        updateWebhookStatus("⚠️ Please enter a webhook URL", true);
        return;
    }
    
    if (!url.startsWith("https://discord.com/api/webhooks/")) {
        updateWebhookStatus("❌ Invalid Discord webhook URL", true);
        return;
    }
    
    // Salvar no localStorage
    localStorage.setItem(`${appName}_webhook`, url);
    
    // Feedback visual
    webhookInput.style.backgroundColor = "#28a745";
    updateWebhookStatus("✅ Webhook saved successfully!");
    
    // Testar o webhook (opcional)
    testWebhook(url);
    
    setTimeout(() => {
        if (webhookInput) webhookInput.style.backgroundColor = "";
    }, 1000);
}
function testWebhook(url: string) {
    fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            username: "Lucky Drops",
            content: "🔔 Webhook configured successfully!"
        })
    })
    .then(res => {
        if (res.ok) updateWebhookStatus("✅ Test message sent to Discord!");
        else updateWebhookStatus("❌ Test failed: " + res.status, true);
    })
    .catch(err => updateWebhookStatus("❌ Test error: " + err.message, true));
}
function updateWebhookStatus(msg: string, isError: boolean = false) {
    if (webhookStatus) {
        webhookStatus.textContent = msg;
        webhookStatus.style.color = isError ? "#ff6b6b" : "#0f0";
        setTimeout(() => {
            webhookStatus.textContent = "";
        }, 3000);
    }
    debug(msg);
}


if (webhookInput) {
    loadWebhook();
}

// Evento do botão salvar
if (saveWebhookBtn) {
    saveWebhookBtn.addEventListener("click", saveWebhook);
}

// Também salvar com Enter
if (webhookInput) {
    webhookInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter") saveWebhook();
    });
}


// ===== FUNÇÃO PARA ENVIAR NOTIFICAÇÃO =====
function sendDiscordNotification(dropItem: any) {
    const webhook = localStorage.getItem(`${appName}_webhook`);
    if (!webhook) return;
    
    const emoji =  dropItem.type === "LOTD" ? "💍" : 
        dropItem.type.includes("HSR") ? "🔱" : 
        dropItem.type === "BEAM" ? "✨" : 
        dropItem.type === "SEREN" ? "💎" : 
        dropItem.type === "COMPS" ? "💡" : "📦";
    const message = {
        username: "Lucky Drops Tracker",
        content: `${emoji} **${dropItem.type}** - ${dropItem.item} at ${new Date().toLocaleString()}`
    };
    
    fetch(webhook, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(message)
    })
    .then(res => {
        if (res.ok) debug("✅ Discord notification sent");
        else debug(`❌ Discord error: ${res.status}`);
    })
    .catch(err => debug(`❌ Discord error: ${err.message}`));
}
// ===== CONFIRM PERSONALIZADO =====
function showConfirmModal(message: string, onConfirm: () => void) {
    // Remove modal antigo se existir
    const oldModal = document.getElementById("customConfirmModal");
    if (oldModal) oldModal.remove();
    
    // Cria o modal
    const modal = document.createElement('div');
    modal.id = "customConfirmModal";
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.7);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 50000;
    `;
    
    const content = document.createElement('div');
    content.style.cssText = `
        background: #1a1a1a;
        border: 3px solid #ffd700;
        border-radius: 10px;
        padding: 25px;
        max-width: 400px;
        text-align: center;
        color: white;
        font-family: 'trajan-pro-3';
        box-shadow: 0 0 20px rgba(255,215,0,0.3);
    `;
    
    content.innerHTML = `
        <div style="font-size: 24px; margin-bottom: 15px;">⚠️ WARNING</div>
        <div style="margin-bottom: 25px; font-size: 14px; white-space: pre-line;">${message}</div>
        <div style="display: flex; gap: 10px; justify-content: center;">
            <button class="nisbutton" id="confirmYes" style="background: #28a745; border-color: #ffd700;">✅ YES</button>
            <button class="nisbutton" id="confirmNo" style="background: #dc3545; border-color: #ffd700;">❌ NO</button>
        </div>
    `;
    
    modal.appendChild(content);
    document.body.appendChild(modal);
    
    // Botão YES
    document.getElementById("confirmYes")?.addEventListener("click", () => {
        modal.remove();
        onConfirm();
    });
    
    // Botão NO
    document.getElementById("confirmNo")?.addEventListener("click", () => {
        modal.remove();
        debug("❌ Usuário cancelou");
    });
}

// ===== TOGGLE DEBUG (Ctrl+5) =====
document.addEventListener("keydown", (e) => {
    if (e.ctrlKey && e.key === "5") {
        e.preventDefault();
        debugPanelVisible = !debugPanelVisible;
        if (debugDiv) {
            debugDiv.style.display = debugPanelVisible ? "block" : "none";
        }
    }
});

// Adicionar uma dica visual no canto do debug (opcional)
if (debugDiv) {
    const hint = document.createElement('div');
    hint.textContent = "Ctrl+5 to toggle";
    hint.style.cssText = `
        position: absolute;
        bottom: 2px;
        right: 5px;
        font-size: 8px;
        color: #666;
        font-family: monospace;
    `;
    debugDiv.appendChild(hint);
}



// ===== INIT =====
if (!localStorage.getItem(appName)) {
    localStorage.setItem(appName, JSON.stringify({ chat: 0, data: [], mode: "history" }));
}

// Função para sincronizar todos os contadores
function syncAllCounters() {
    const data = getSaveData("data") || [];
    const totalDrops = data.length;
    
    // Atualiza o total principal (dentro do .total)
    const totalElement = document.getElementById("total");
    if (totalElement) {
        totalElement.textContent = String(totalDrops);
    }
    
    // Atualiza o totalCount na área de filtros
    const totalCountElement = document.getElementById("totalCount");
    if (totalCountElement) {
        totalCountElement.textContent = String(totalDrops);
    }
    
    // Atualiza o totalFiltered (inicialmente igual ao total)
    const totalFilteredElement = document.getElementById("totalFiltered");
    if (totalFilteredElement) {
        totalFilteredElement.textContent = String(totalDrops);
    }
}

// Chama a sincronização inicial
syncAllCounters();

debug(`✅ Inicializado com ${getSaveData("data")?.length || 0} drops`);