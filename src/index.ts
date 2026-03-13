import * as a1lib from "alt1";
import ChatboxReader from "alt1/chatbox";

declare global {
    interface Window { alt1: any; }
}

// ===== ELEMENTOS DOM =====
const itemList = document.querySelector(".itemList") as HTMLElement;
const chatSelector = document.querySelector(".chat") as HTMLSelectElement;
const exportButton = document.querySelector(".export") as HTMLElement;
const clearButton = document.querySelector(".clear") as HTMLElement;
const listHeader = document.querySelector(".header") as HTMLElement;
const itemTotal = document.getElementById("total") as HTMLElement;

// ===== CONSTANTES =====
const appColor = a1lib.mixColor(0, 255, 255);
const timestampRegex = /\[\d{2}:\d{2}:\d{2}\]/g;
const reader = new ChatboxReader();
const appName = "LuckyDrops";
const VERSION = "1.0.19.46";

// Configuração inicial do leitor de chat
reader.readargs = {
    colors: [
        a1lib.mixColor(245, 124, 1),  // Laranja - LOTD
        a1lib.mixColor(255, 215, 0)   // Dourado - HSR
    ]
};

// Frases padrão
const DEFAULT_PHRASES = [
    "Your Luck of the Dwarves shines brightly and you receive: (\\d+) x (.+)",
    "Your Hazelmere's signet ring shines brightly. You receive: (\\d+) x (.+)",
    "The power of Hazelmere blesses your drop and doubles it before your very eyes: (\\d+) x (.+)"
];

// ===== FUNÇÕES DE ARMAZENAMENTO =====
function loadCustomPhrases(): string[] {
    try {
        const key = `${appName}_phrases`;
        console.log(`🔍 Carregando frases de: ${key}`);
        
        const saved = localStorage.getItem(key);
        if (saved) {
            const phrases = JSON.parse(saved);
            if (Array.isArray(phrases) && phrases.length > 0) {
                console.log(`✅ ${phrases.length} frases carregadas`);
                return phrases;
            }
        }
        console.log("📝 Usando frases padrão");
        return DEFAULT_PHRASES;
    } catch (error) {
        console.error("❌ Erro ao carregar frases:", error);
        return DEFAULT_PHRASES;
    }
}

function saveCustomPhrases(phrases: string[]) {
    try {
        localStorage.setItem(`${appName}_phrases`, JSON.stringify(phrases));
        console.log(`✅ ${phrases.length} frases salvas`);
    } catch (error) {
        console.error("❌ Erro ao salvar frases:", error);
        alert("Error saving phrases!");
    }
}

function updateSaveData(...datasets: any[]) {
    const current = JSON.parse(localStorage.getItem(appName) || "{}");
    datasets.forEach(data => {
        const key = Object.keys(data)[0];
        const value = data[key];
        
        if (key === "data") {
            if (!current[key]) current[key] = [];
            if (!Array.isArray(value)) current[key].push(value);
            else current[key] = value;
        } else {
            current[key] = value;
        }
    });
    localStorage.setItem(appName, JSON.stringify(current));
}

function getSaveData(key: string) {
    const data = JSON.parse(localStorage.getItem(appName) || "null");
    return data?.[key] ?? false;
}

// ===== FUNÇÕES DO CHAT =====
function showSelectedChat(chat: any) {
    if (!chat?.mainbox?.rect) return;
    try {
        if (window.alt1) {
            window.alt1.overLayRect(
                appColor,
                chat.mainbox.rect.x,
                chat.mainbox.rect.y,
                chat.mainbox.rect.width,
                chat.mainbox.rect.height,
                2000,
                5
            );
        }
    } catch (e) { 
        console.log("Overlay not available"); 
    }
}

function updateChatHistory(chatLine: string) {
    const history = sessionStorage.getItem(`${appName}chatHistory`) || "";
    const lines = history ? history.split("\n") : [];
    lines.push(chatLine);
    while (lines.length > 100) lines.shift();
    sessionStorage.setItem(`${appName}chatHistory`, lines.join("\n"));
}

function isInHistory(chatLine: string): boolean {
    const history = sessionStorage.getItem(`${appName}chatHistory`);
    if (!history) return false;
    return history.split("\n").some(line => line.trim() === chatLine);
}

function getTypeFromPhrase(phrase: string): string {
    if (phrase.includes("Luck of the Dwarves")) return "LOTD";
    if (phrase.includes("Hazelmere")) {
        return phrase.includes("doubles") ? "HSR_DOUBLE" : "HSR";
    }
    return "CUSTOM";
}

function readChatbox() {
    const opts = reader.read() || [];
    if (opts.length === 0) return;
    
    let chatStr = "";
    for (let i = 0; i < opts.length; i++) {
        if (!opts[i].text.match(timestampRegex) && i === 0) continue;
        
        if (opts[i].text.match(timestampRegex)) {
            if (i > 0) chatStr += "\n";
            chatStr += opts[i].text + " ";
        } else {
            chatStr += opts[i].text;
        }
    }
    
    if (!chatStr.trim()) return;
    
    const chatLines = chatStr.trim().split("\n");
    const phrases = loadCustomPhrases();
    
    chatLines.forEach(line => {
        const chatLine = line.trim();
        if (isInHistory(chatLine)) return;
        
        for (const phrase of phrases) {
            const escaped = phrase
                .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
                .replace(/\\\(\\d\+\\\\\)/g, '(\\d+)')
                .replace(/\\\(\.\+\\\\\)/g, '(.+)');
            
            const regex = new RegExp(`\\[\\d{2}:\\d{2}:\\d{2}\\] ${escaped}`);
            const match = chatLine.match(regex);
            
            if (match) {
                const quantity = parseInt(match[1]);
                const itemName = match[2].trim();
                const dropType = getTypeFromPhrase(phrase);
                
                const dropItem = {
                    item: `${quantity} x ${itemName}`,
                    quantity,
                    name: itemName,
                    type: dropType,
                    time: new Date(),
                    chatLine
                };
                
                console.log(`${dropType} drop: ${quantity} x ${itemName}`);
                updateSaveData({ data: dropItem });
                updateChatHistory(chatLine);
                showItems();
                break;
            }
        }
    });
}

function showItems() {
    if (!itemList) return;
    
    // Remove itens antigos (exceto header, total e loading)
    itemList.querySelectorAll("li.item:not(.header):not(.total):not(.loading)").forEach(el => el.remove());
    
    const data = getSaveData("data") || [];
    if (itemTotal) itemTotal.innerHTML = String(data.length);
    
    const mode = getSaveData("mode");
    
    if (mode === "total") {
        listHeader.innerHTML = "Drop Totals";
        listHeader.dataset.show = "history";
        
        const totals: any = {};
        data.forEach((item: any) => {
            if (!totals[item.name]) {
                totals[item.name] = { total: 0, lotd: 0, hsr: 0 };
            }
            
            totals[item.name].total += item.quantity;
            if (item.type === "LOTD") {
                totals[item.name].lotd += item.quantity;
            } else if (item.type.includes("HSR")) {
                totals[item.name].hsr += item.quantity;
            }
        });
        
        Object.keys(totals).sort().forEach(name => {
            const t = totals[name];
            itemList.insertAdjacentHTML("beforeend",
                `<li class="list-group-item item">${name}: ${t.total} (LOTD: ${t.lotd} | HSR: ${t.hsr})</li>`
            );
        });
    } else {
        listHeader.innerHTML = "Drop History";
        listHeader.dataset.show = "total";
        
        data.slice().reverse().forEach((item: any) => {
            let icon = "📦";
            if (item.type === "LOTD") icon = "💎";
            else if (item.type.includes("HSR")) icon = "👑";
            
            itemList.insertAdjacentHTML("beforeend",
                `<li class="list-group-item item" title="${new Date(item.time).toLocaleString()} - ${item.type}">${icon} ${item.item}</li>`
            );
        });
    }
}

// ===== INICIALIZAÇÃO DO ALT1 =====
if (window.alt1) {
    window.alt1.identifyAppUrl("./appconfig.json");
    console.log("✅ Alt1 detectado");
} else {
    itemList.innerHTML = '<li class="list-group-item item">Alt1 not detected. <a href="https://alt1.org">Get Alt1</a></li>';
    console.log("⚠️ Alt1 não detectado");
}

// ===== INICIALIZAÇÃO DO CHAT =====
window.setTimeout(() => {
    console.log("🔍 Iniciando busca por chats...");
    
    let findChat = setInterval(() => {
        if (!reader.pos) {
            reader.find();
            return;
        }
        
        clearInterval(findChat);
        console.log("✅ Chat encontrado!");
        
        // Remover mensagem de loading
        const loadingEl = document.querySelector(".item.loading");
        if (loadingEl) loadingEl.remove();
        
        if (reader.pos?.boxes && reader.pos.boxes.length > 0) {
            console.log(`📋 ${reader.pos.boxes.length} chats detectados`);
            
            // Popular dropdown
            reader.pos.boxes.forEach((_: any, i: number) => {
                chatSelector.insertAdjacentHTML("beforeend", `<option value="${i}">Chat ${i}</option>`);
            });
            
            // Evento de mudança de chat
            chatSelector.addEventListener("change", (e) => {
                const select = e.target as HTMLSelectElement;
                const index = Number(select.value);
                
                if (reader.pos?.boxes[index]) {
                    reader.pos.mainbox = reader.pos.boxes[index];
                    showSelectedChat(reader.pos);
                    updateSaveData({ chat: index });
                    console.log(`📌 Chat ${index} selecionado`);
                }
            });
            
            // Carregar chat salvo
            const savedChat = getSaveData("chat");
            if (savedChat !== false && reader.pos.boxes[Number(savedChat)]) {
                reader.pos.mainbox = reader.pos.boxes[Number(savedChat)];
                console.log(`💾 Chat salvo carregado: ${savedChat}`);
            } else if (reader.pos.boxes[0]) {
                reader.pos.mainbox = reader.pos.boxes[0];
                updateSaveData({ chat: 0 });
                console.log(`📌 Chat 0 selecionado como padrão`);
            }
            
            // Mostrar overlay
            if (reader.pos) showSelectedChat(reader.pos);
            
            // Mostrar itens e iniciar leitura
            showItems();
            setInterval(readChatbox, 600);
            console.log("🔄 Leitura do chat iniciada");
        }
    }, 1000);
}, 50);

// ===== EVENT LISTENERS =====
exportButton?.addEventListener("click", () => {
    const data = getSaveData("data") || [];
    const mode = getSaveData("mode");
    let csv = "";
    let filename = "";
    
    if (mode === "total") {
        csv = "Item,Total,LOTD,HSR\n";
        filename = "luckydrops_totals.csv";
        
        const totals: any = {};
        data.forEach((item: any) => {
            if (!totals[item.name]) {
                totals[item.name] = { total: 0, lotd: 0, hsr: 0 };
            }
            totals[item.name].total += item.quantity;
            if (item.type === "LOTD") totals[item.name].lotd += item.quantity;
            else if (item.type.includes("HSR")) totals[item.name].hsr += item.quantity;
        });
        
        Object.keys(totals).sort().forEach(name => {
            csv += `${name},${totals[name].total},${totals[name].lotd},${totals[name].hsr}\n`;
        });
    } else {
        csv = "Item,Quantity,Type,Date,Time\n";
        filename = "luckydrops_history.csv";
        
        data.forEach((item: any) => {
            const d = new Date(item.time);
            csv += `${item.name},${item.quantity},${item.type},${d.toLocaleDateString()},${d.toLocaleTimeString()}\n`;
        });
    }
    
    const blob = new Blob([csv], { type: "text/csv" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
});

clearButton?.addEventListener("click", () => {
    if (confirm("Reset all data?")) {
        localStorage.removeItem(appName);
        sessionStorage.removeItem(`${appName}chatHistory`);
        location.reload();
    }
});

listHeader?.addEventListener("click", () => {
    updateSaveData({ mode: listHeader.dataset.show });
    showItems();
});

// ===== CUSTOM PHRASES UI =====
function initPhrasesSystem() {
    console.log("🔧 Inicializando sistema de frases...");
    
    const phrasesTextarea = document.getElementById("customPhrases") as HTMLTextAreaElement;
    const savePhrasesBtn = document.getElementById("savePhrases");
    
    if (!phrasesTextarea || !savePhrasesBtn) {
        console.error("❌ Elementos de frase não encontrados");
        return;
    }
    
    // Carregar frases salvas
    phrasesTextarea.value = loadCustomPhrases().join('\n');
    
    // Evento de salvamento
    savePhrasesBtn.onclick = (event) => {
        event.preventDefault();
        
        const rawText = phrasesTextarea.value;
        const phrases = rawText.split('\n')
            .map(line => line.trim())
            .filter(line => line.length > 0);
        
        if (phrases.length === 0) {
            alert("⚠️ Please enter at least one phrase!");
            return;
        }
        
        saveCustomPhrases(phrases);
        
        // Feedback visual
        const originalText = savePhrasesBtn.textContent;
        savePhrasesBtn.textContent = "✅ Saved!";
        savePhrasesBtn.style.backgroundColor = "#28a745";
        
        setTimeout(() => {
            savePhrasesBtn.textContent = originalText;
            savePhrasesBtn.style.backgroundColor = "";
        }, 1500);
    };
    
    console.log("✅ Sistema de frases pronto");
}

// Inicializar sistema de frases
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPhrasesSystem);
} else {
    initPhrasesSystem();
}

// ===== DISCORD WEBHOOK =====
const webhookInput = document.getElementById("discordWebhook") as HTMLInputElement;
if (webhookInput) {
    webhookInput.value = getSaveData("discordWebhook") || "";
    webhookInput.addEventListener("change", () => {
        updateSaveData({ discordWebhook: webhookInput.value });
    });
}

// ===== VERSÃO =====
const versionSpan = document.getElementById("version-number");
if (versionSpan) {
    versionSpan.textContent = VERSION;
    console.log(`📌 Versão: ${VERSION}`);
}

// ===== INICIALIZAÇÃO DE DADOS =====
if (!localStorage.getItem(appName)) {
    localStorage.setItem(appName, JSON.stringify({
        chat: 0,
        data: [],
        mode: "history"
    }));
    console.log("📦 Dados iniciais criados");
}