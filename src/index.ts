import * as a1lib from "alt1";
import ChatboxReader from "alt1/chatbox";

import "./appconfig.json";
import "./icon.png";

declare global {
    interface Window {
        alt1: any;
    }
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

// ===== CONFIGURAÇÃO DAS CORES COM TOLERÂNCIA =====
reader.readargs = {
    colors: [
        // LOTD (laranja) - 3 variações
        { r: [230, 245], g: [100, 115], b: [0, 5] },    // 235,104,2 e 240,112,0
        // Usando range para capturar todas as variações de laranja do LOTD
        
        // Feixe (dourado) - 2 variações
        { r: [190, 240], g: [120, 150], b: [0, 5] },    // 236,146,1 e 199,124,3
        
        // Hazelmere (laranja avermelhado) - 2 variações
        { r: [240, 250], g: [70, 115], b: [0, 10] },    // 248,77,5 e 245,111,1
        
        // Seren (ciano) - 2 variações
        { r: [0, 5], g: [235, 245], b: [235, 245] }     // 2,242,241 e 2,236,236
    ]
};
// ===== FIM DA CONFIGURAÇÃO DAS CORES =====

// ===== FRASES PADRÃO (ÚNICAS, SEM REPETIÇÃO) =====
const DEFAULT_PHRASES = [
    // LOTD (2 variações)
    "Your Luck of the Dwarves ring shines brightly. You receive: (\\d+) x (.+)",
    "Your Luck of the Dwarves shines brightly and you receive: (\\d+) x (.+)",
    
    // FEIXE (1 frase)
    "A golden beam shines over one of your items. You receive: (\\d+) x (.+)",
    
    // HAZELMERE (2 frases)
    "Your Hazelmere's signet ring shines brightly. You receive: (\\d+) x (.+)",
    "The power of Hazelmere blesses your drop and doubles it before your very eyes: (\\d+) x (.+)",
    
    // SEREN (1 frase - sem a parte do banco)
    "The Seren spirit gifts you: (\\d+) x (.+)"
];

// Verificar se está no Alt1
if (window.alt1) {
    window.alt1.identifyAppUrl("./appconfig.json");
} else {
    let addappurl = `alt1://addapp/${new URL("./appconfig.json", document.location.href).href}`;
    itemList.innerHTML = `<li>Alt1 not detected, click <a href='${addappurl}'>here</a> to add this app to Alt1</li>`;
}

// ===== INICIALIZAÇÃO DO CHAT COM LOGS =====
console.log("🚀 Iniciando Lucky Drops Tracker...");
console.log("📡 Configuração do reader:", reader.readargs);

window.setTimeout(function () {
    console.log("🔍 Procurando chats...");
    let tentativas = 0;
    
    let findChat = setInterval(function () {
        tentativas++;
        console.log(`⏳ Tentativa ${tentativas} de encontrar chat...`);
        
        if (reader.pos === null) {
            console.log("📡 reader.pos é null, executando reader.find()");
            reader.find();
        } else {
            console.log("✅ Chat encontrado! reader.pos:", reader.pos);
            clearInterval(findChat);
            
            // Remover mensagem de loading
            const loadingEl = document.querySelector(".item.loading");
            if (loadingEl) {
                console.log("🗑️ Removendo mensagem de loading");
                loadingEl.remove();
            }
            
            if (reader.pos?.boxes) {
                console.log(`📋 Total de chats detectados: ${reader.pos.boxes.length}`);
                
                // Popular dropdown
                reader.pos.boxes.forEach((box: any, i: number) => {
                    console.log(`📌 Chat ${i}:`, box);
                    chatSelector.insertAdjacentHTML("beforeend", `<option value="${i}">Chat ${i}</option>`);
                });

                // Evento de mudança de chat
                chatSelector.addEventListener("change", function (this: HTMLSelectElement) {
                    console.log(`🖱️ Chat selecionado: ${this.value}`);
                    reader.pos.mainbox = reader.pos.boxes[Number(this.value)];
                    showSelectedChat(reader.pos);
                    updateSaveData({ chat: Number(this.value) });
                    this.value = "";
                });

                // Carregar chat salvo
                const savedChat = getSaveData("chat");
                console.log(`💾 Chat salvo anteriormente: ${savedChat}`);
                
                if (savedChat && reader.pos.boxes[Number(savedChat)]) {
                    reader.pos.mainbox = reader.pos.boxes[Number(savedChat)];
                    console.log(`✅ Chat salvo carregado: ${savedChat}`);
                } else {
                    reader.pos.mainbox = reader.pos.boxes[0];
                    updateSaveData({ chat: 0 });
                    console.log(`✅ Chat 0 selecionado como padrão`);
                }
                
                console.log("🟦 Mostrando overlay...");
                showSelectedChat(reader.pos);
                
                console.log("📊 Atualizando lista de itens...");
                showItems();
                
                console.log("🔄 Iniciando leitura do chat a cada 600ms");
                setInterval(function () {
                    console.log("📖 Lendo chat...");
                    readChatbox();
                }, 600);
            } else {
                console.log("❌ reader.pos.boxes não encontrado!");
            }
        }
    }, 1000);
}, 50);


// Função principal de leitura do chat
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
    
    // Carregar frases personalizadas do localStorage
    let phrases: string[] = [];
    const saved = localStorage.getItem(`${appName}_phrases`);
    if (saved) {
        try {
            phrases = JSON.parse(saved);
        } catch (e) {
            phrases = [];
        }
    }
    
    // Se não tiver frases salvas, usar padrão
    if (phrases.length === 0) {
        phrases = [
            "Your Luck of the Dwarves ring shines brightly. You receive: (\\d+) x (.+)",
            "Your Hazelmere's signet ring shines brightly. You receive: (\\d+) x (.+)",
            "The power of Hazelmere blesses your drop and doubles it before your very eyes: (\\d+) x (.+)"
        ];
    }
    
    chatLines.forEach(line => {
        const chatLine = line.trim();
        if (isInHistory(chatLine)) return;
        
        // Testar cada frase salva
        for (const phrase of phrases) {
            // Escapar a frase para regex
            const escaped = phrase
                .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
                .replace(/\\\(\\d\+\\\\\)/g, '(\\d+)')
                .replace(/\\\(\.\+\\\\\)/g, '(.+)');
            
            const regex = new RegExp(`\\[\\d{2}:\\d{2}:\\d{2}\\] ${escaped}`);
            const match = chatLine.match(regex);
            
            if (match) {
                const quantity = parseInt(match[1]);
                const itemName = match[2].trim();
                
                // Determinar o tipo baseado na frase
                let dropType = "CUSTOM";
                if (phrase.includes("Luck of the Dwarves")) dropType = "LOTD";
                else if (phrase.includes("Hazelmere")) {
                    dropType = phrase.includes("doubles") ? "HSR_DOUBLE" : "HSR";
                }
                
                const dropItem = {
                    item: `${quantity} x ${itemName}`,
                    quantity: quantity,
                    name: itemName,
                    type: dropType,
                    time: new Date(),
                    chatLine: chatLine
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
// Funções auxiliares
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

function showSelectedChat(chat: any) {
    if (!chat?.mainbox?.rect) return;
    try {
        window.alt1.overLayRect(appColor, chat.mainbox.rect.x, chat.mainbox.rect.y, 
            chat.mainbox.rect.width, chat.mainbox.rect.height, 2000, 5);
    } catch (e) {
        console.log("Overlay not available");
    }
}

function showItems() {
    if (!itemList) return;
    
    // Remove itens antigos (exceto header e total)
    itemList.querySelectorAll("li.item:not(.header):not(.total)").forEach(el => el.remove());
    
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
            if (item.type === "LOTD") totals[item.name].lotd += item.quantity;
            else if (item.type.includes("HSR")) totals[item.name].hsr += item.quantity;
        });
        
        Object.keys(totals).sort().forEach(name => {
            const t = totals[name];
            itemList.insertAdjacentHTML("beforeend",
                `<li class="list-group-item item">${name}: ${t.total} (💎: ${t.lotd} | 👑: ${t.hsr})</li>`
            );
        });
    } else {
        listHeader.innerHTML = "Drop History";
        listHeader.dataset.show = "total";
        
        data.slice().reverse().forEach((item: any) => {
            const icon = item.type === "LOTD" ? "💎" : item.type.includes("HSR") ? "👑" : "📦";
            itemList.insertAdjacentHTML("beforeend",
                `<li class="list-group-item item" title="${new Date(item.time).toLocaleString()} - ${item.type}">${icon} ${item.item}</li>`
            );
        });
    }
}

// Funções de salvamento
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

// Event Listeners
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
            if (!totals[item.name]) totals[item.name] = { total: 0, lotd: 0, hsr: 0 };
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

// Inicialização de dados
if (!localStorage.getItem(appName)) {
    localStorage.setItem(appName, JSON.stringify({ chat: 0, data: [], mode: "history" }));
}
// ===== CUSTOM PHRASES (estilo ZeroGwafa) =====
const phrasesTextarea = document.getElementById("customPhrases") as HTMLTextAreaElement;
const savePhrasesBtn = document.getElementById("savePhrases");

// Carregar frases salvas
function loadSavedPhrases() {
    const saved = localStorage.getItem(`${appName}_phrases`);
    if (saved && phrasesTextarea) {
        try {
            phrasesTextarea.value = JSON.parse(saved).join('\n');
            console.log("✅ Frases carregadas do localStorage");
        } catch (e) {
            console.log("⚠️ Erro ao carregar frases");
        }
    }
}

// Salvar frases
if (savePhrasesBtn && phrasesTextarea) {
    // Carregar ao iniciar
    loadSavedPhrases();
    
    // Evento de clique
    savePhrasesBtn.addEventListener("click", function() {
        const phrases = phrasesTextarea.value
            .split('\n')
            .map(p => p.trim())
            .filter(p => p.length > 0);
        
        if (phrases.length > 0) {
            localStorage.setItem(`${appName}_phrases`, JSON.stringify(phrases));
            
            // Feedback visual
            const originalText = savePhrasesBtn.textContent;
            savePhrasesBtn.textContent = "✅ Saved!";
            savePhrasesBtn.style.backgroundColor = "#28a745";
            
            setTimeout(() => {
                savePhrasesBtn.textContent = originalText;
                savePhrasesBtn.style.backgroundColor = "";
            }, 1500);
            
            console.log(`✅ ${phrases.length} frases salvas`);
        } else {
            alert("Please enter at least one phrase");
        }
    });
}
// Versão
const versionSpan = document.getElementById("version-number");
if (versionSpan) {
    versionSpan.textContent = "1.0.20.48";
}