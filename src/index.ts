import * as a1lib from "alt1";
import ChatboxReader from "alt1/chatbox";

declare global {
    interface Window { alt1: any; }
}

// Elementos DOM
const itemList = document.querySelector(".itemList") as HTMLElement;
const chatSelector = document.querySelector(".chat") as HTMLSelectElement;
const exportButton = document.querySelector(".export") as HTMLElement;
const clearButton = document.querySelector(".clear") as HTMLElement;
const listHeader = document.querySelector(".header") as HTMLElement;
const itemTotal = document.getElementById("total") as HTMLElement;

const appColor = a1lib.mixColor(0, 255, 255);
const timestampRegex = /\[\d{2}:\d{2}:\d{2}\]/g;
const reader = new ChatboxReader();
const appName = "LuckyDrops";

// Configuração inicial
reader.readargs = {
    colors: [a1lib.mixColor(245, 124, 1), a1lib.mixColor(255, 215, 0)]
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
        console.log(`🔍 Tentando carregar de: ${key}`);
        
        const saved = localStorage.getItem(key);
        console.log(`📦 Dados brutos:`, saved);
        
        if (saved) {
            const phrases = JSON.parse(saved);
            if (Array.isArray(phrases) && phrases.length > 0) {
                console.log(`✅ Frases carregadas (${phrases.length}):`, phrases);
                return phrases;
            }
        }
        console.log("📝 Nenhuma frase salva, usando padrão");
        return DEFAULT_PHRASES;
    } catch (error) {
        console.error("❌ Erro ao carregar frases:", error);
        return DEFAULT_PHRASES;
    }
}

function saveCustomPhrases(phrases: string[]) {
    try {
        localStorage.setItem(`${appName}_phrases`, JSON.stringify(phrases));
        console.log("✅ Frases salvas:", phrases);
        
        // Verificação automática
        const saved = localStorage.getItem(`${appName}_phrases`);
        if (saved) {
            const loaded = JSON.parse(saved);
            console.log("📋 Verificação OK:", loaded.length, "frases");
        }
    } catch (error) {
        console.error("❌ Erro:", error);
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

// ===== CHAT FUNCTIONS =====
function showSelectedChat(chat: any) {
    if (!chat?.mainbox?.rect) return;
    try {
        if (window.alt1) {
            window.alt1.overLayRect(appColor, chat.mainbox.rect.x, chat.mainbox.rect.y,
                chat.mainbox.rect.width, chat.mainbox.rect.height, 2000, 5);
        }
    } catch (e) { console.log("Overlay not available"); }
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
    if (phrase.includes("Hazelmere")) return phrase.includes("doubles") ? "HSR_DOUBLE" : "HSR";
    return "CUSTOM";
}

function readChatbox() {
    const opts = reader.read() || [];
    let chatStr = "";
    
    if (opts.length > 0) {
        for (let i = 0; i < opts.length; i++) {
            if (!opts[i].text.match(timestampRegex) && i === 0) continue;
            if (opts[i].text.match(timestampRegex)) {
                if (i > 0) chatStr += "\n";
                chatStr += opts[i].text + " ";
            } else {
                chatStr += opts[i].text;
            }
        }
    }
    
    if (!chatStr.trim()) return;
    
    const chatLines = chatStr.trim().split("\n");
    const phrases = loadCustomPhrases();
    
    chatLines.forEach(line => {
        const chatLine = line.trim();
        if (isInHistory(chatLine)) return;
        
        for (const phrase of phrases) {
            const escaped = phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
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
                    quantity, name: itemName, type: dropType,
                    time: new Date(), chatLine
                };
                
                console.log(`${dropType} drop:`, dropItem);
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
    itemList.querySelectorAll("li.item:not(.header):not(.total):not(.loading)").forEach(el => el.remove());
    
    const data = getSaveData("data") || [];
    itemTotal.innerHTML = String(data.length);
    
    if (getSaveData("mode") === "total") {
        listHeader.innerHTML = "Drop Totals";
        listHeader.dataset.show = "history";
        
        const totals: any = {};
        data.forEach((item: any) => {
            if (!totals[item.name]) totals[item.name] = { total: 0, lotd: 0, hsr: 0 };
            totals[item.name].total += item.quantity;
            if (item.type === "LOTD") totals[item.name].lotd += item.quantity;
            else if (item.type.includes("HSR")) totals[item.name].hsr += item.quantity;
        });
        
        Object.keys(totals).sort().forEach(name => {
            const t = totals[name];
            itemList.insertAdjacentHTML("beforeend",
                `<li class="list-group-item item">${name}: ${t.total} (LOTD: ${t.lotd} | HSR: ${t.hsr})</li>`);
        });
    } else {
        listHeader.innerHTML = "Drop History";
        listHeader.dataset.show = "total";
        
        data.slice().reverse().forEach((item: any) => {
            const icon = item.type === "LOTD" ? "💎" : item.type.includes("HSR") ? "👑" : "📦";
            itemList.insertAdjacentHTML("beforeend",
                `<li class="list-group-item item" title="${new Date(item.time).toLocaleString()} - ${item.type}">${icon} ${item.item}</li>`);
        });
    }
}

// ===== EVENT LISTENERS =====
if (window.alt1) {
    window.alt1.identifyAppUrl("./appconfig.json");
} else {
    itemList.innerHTML = '<li>Alt1 not detected. <a href="https://alt1.org">Get Alt1</a></li>';
}

window.setTimeout(() => {
    let findChat = setInterval(() => {
        if (!reader.pos) { reader.find(); return; }
        clearInterval(findChat);
        
        if (reader.pos?.boxes) {
            reader.pos.boxes.forEach((_: any, i: number) => {
                chatSelector.insertAdjacentHTML("beforeend", `<option value="${i}">Chat ${i}</option>`);
            });
            
            chatSelector.addEventListener("change", (e) => {
                const select = e.target as HTMLSelectElement;
                if (reader.pos?.boxes[Number(select.value)]) {
                    reader.pos.mainbox = reader.pos.boxes[Number(select.value)];
                    showSelectedChat(reader.pos);
                    updateSaveData({ chat: Number(select.value) });
                }
            });
            
            const savedChat = getSaveData("chat");
            if (savedChat !== false && reader.pos.boxes[Number(savedChat)]) {
                reader.pos.mainbox = reader.pos.boxes[Number(savedChat)];
            } else if (reader.pos.boxes[0]) {
                reader.pos.mainbox = reader.pos.boxes[0];
                updateSaveData({ chat: 0 });
            }
            
            if (reader.pos) showSelectedChat(reader.pos);
            showItems();
            setInterval(readChatbox, 600);
        }
    }, 1000);
}, 50);

exportButton?.addEventListener("click", () => {
    const data = getSaveData("data") || [];
    const mode = getSaveData("mode");
    let csv = mode === "total" ? "Item,Total,LOTD,HSR\n" : "Item,Quantity,Type,Date,Time\n";
    let filename = mode === "total" ? "totals.csv" : "history.csv";
    
    if (mode === "total") {
        const totals: any = {};
        data.forEach((item: any) => {
            if (!totals[item.name]) totals[item.name] = { total: 0, lotd: 0, hsr: 0 };
            totals[item.name].total += item.quantity;
            if (item.type === "LOTD") totals[item.name].lotd += item.quantity;
            else if (item.type.includes("HSR")) totals[item.name].hsr += item.quantity;
        });
        Object.keys(totals).sort().forEach(n => csv += `${n},${totals[n].total},${totals[n].lotd},${totals[n].hsr}\n`);
    } else {
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
    
    if (!phrasesTextarea) {
        console.error("❌ Textarea 'customPhrases' não encontrado");
        return;
    }
    
    if (!savePhrasesBtn) {
        console.error("❌ Botão 'savePhrases' não encontrado");
        return;
    }
    
    console.log("✅ Elementos encontrados");
    
    // Carregar frases salvas
    try {
        const savedPhrases = loadCustomPhrases();
        phrasesTextarea.value = savedPhrases.join('\n');
        console.log(`✅ ${savedPhrases.length} frases carregadas`);
    } catch (error) {
        console.error("❌ Erro ao carregar:", error);
        phrasesTextarea.value = DEFAULT_PHRASES.join('\n');
    }
    
    // IMPORTANTE: Não remover o botão! Apenas adicionar evento diretamente
    savePhrasesBtn.onclick = function(event) {
        event.preventDefault();
        console.log("🖱️ Botão SAVE clicado!");
        
        const rawText = phrasesTextarea.value;
        const phrases = rawText.split('\n')
            .map(line => line.trim())
            .filter(line => line.length > 0);
        
        console.log(`📝 Frases processadas: ${phrases.length}`);
        
        if (phrases.length === 0) {
            alert("⚠️ Please enter at least one phrase!");
            return;
        }
        
        // Salvar usando a função
        saveCustomPhrases(phrases);
        
        // Feedback visual simples
        const originalText = savePhrasesBtn.textContent;
        savePhrasesBtn.textContent = "✅ Saved!";
        savePhrasesBtn.style.backgroundColor = "#28a745";
        
        setTimeout(() => {
            savePhrasesBtn.textContent = originalText;
            savePhrasesBtn.style.backgroundColor = "";
        }, 1500);
    };
    
    console.log("✅ Sistema de frases pronto!");
}

// Inicializar quando a página carregar
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPhrasesSystem);
} else {
    initPhrasesSystem();
}


// ===== DISCORD WEBHOOK =====
const webhookInput = document.getElementById("discordWebhook") as HTMLInputElement;
if (webhookInput) {
    webhookInput.value = getSaveData("discordWebhook") || "";
    webhookInput.addEventListener("change", () => updateSaveData({ discordWebhook: webhookInput.value }));
}

// ===== VERSION =====
const VERSION = "2.0.0";
const versionSpan = document.getElementById("version-number");
if (versionSpan) versionSpan.textContent = VERSION;

// ===== INIT =====
if (!localStorage.getItem(appName)) {
    localStorage.setItem(appName, JSON.stringify({ chat: 0, data: [], mode: "history" }));
}