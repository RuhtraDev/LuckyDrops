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
const VERSION = "1.0.23.10";
const timestampRegex = /\[\d{2}:\d{2}:\d{2}\]/g;

// ===== VISUAL DEBUG =====
const DEBUG_MODE = false;  // Change to view log

let debugDiv: HTMLDivElement | null = null;

if (DEBUG_MODE) {
    debugDiv = document.createElement('div');
    debugDiv.style.cssText = `
        position: fixed; top: 200px; right: 50px; width: 300px; height: 500px;
        background: rgba(0,0,0,0.9); color: #0f0; font-family: monospace;
        font-size: 10px; padding: 5px; overflow-y: auto; z-index: 10000;
        border: 2px solid #ffd700; border-radius: 5px;
    `;
    document.body.appendChild(debugDiv);
}

function debug(msg: string) {
    console.log(msg);
    if (DEBUG_MODE && debugDiv) {
        const line = document.createElement('div');
        line.textContent = `[${new Date().toLocaleTimeString()}] ${msg}`;
        debugDiv.appendChild(line);
        debugDiv.scrollTop = debugDiv.scrollHeight;
    }
}

// ===== DOM ELEMENTS =====
const itemList = document.querySelector(".itemList") as HTMLElement;
const chatSelector = document.querySelector(".chat") as HTMLSelectElement;
const exportButton = document.querySelector(".export") as HTMLElement;
const clearButton = document.querySelector(".clear") as HTMLElement;
const listHeader = document.querySelector(".header") as HTMLElement;
const itemTotal = document.getElementById("total") as HTMLElement;

const appColor = a1lib.mixColor(0, 255, 255);
const reader = new ChatboxReader();
const appName = "LuckyDrops";




// ===== COLOR CONFIG =====
reader.readargs = {
    colors: [
        a1lib.mixColor(255, 112, 0),  // LOTD & HSR
        a1lib.mixColor(245, 151, 0),  // Feixe
        a1lib.mixColor(0, 255, 255),  // Seren
        
    ]
};

// ===== UPDATE COUNT IN MODAL =====
function updateCounters() {
    const data = getSaveData("data") || [];
    
    let lotd = 0, hsr = 0, feixe = 0, seren = 0;
    
    data.forEach((item: any) => {
        if (item.type === "LOTD") lotd++;
        else if (item.type.includes("HSR")) hsr++;
        else if (item.type === "FEIXE") feixe++;
        else if (item.type === "SEREN") seren++;
    });
    
    const lotdEl = document.getElementById("lotdCount");
    const hsrEl = document.getElementById("hazelmereCount");
    const feixeEl = document.getElementById("feixeCount");
    const serenEl = document.getElementById("serenCount");
    
    if (lotdEl) lotdEl.textContent = String(lotd);
    if (hsrEl) hsrEl.textContent = String(hsr);
    if (feixeEl) feixeEl.textContent = String(feixe);
    if (serenEl) serenEl.textContent = String(seren);
}

// ===== DEFAULT PHRASES =====
const DEFAULT_PHRASES = [
    // LOTD
    "Your Luck of the Dwarves ring shines brightly. You receive: (\\d+) x (.*)",
    "Your Luck of the Dwarves shines brightly and you receive: (\\d+) x (.*)",
    
    // FEIXE (SÓ UMA VEZ!)
    "A golden beam shines over one of your items. You receive: (\\d+) x (.*)",
    
    // HAZELMERE
    "Your Hazelmere's signet ring shines brightly. You receive: (\\d+) x (.*)",
    "The power of Hazelmere blesses your drop and doubles it before your very eyes: (\\d+) x (.*)",
    
    // SEREN
    "The Seren spirit gifts you: (\\d+) x (.*)"
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

// ===== MAIN FUNCTION =====
function readChatbox() {
    let opts = reader.read() || [];
    if (opts.length === 0) return;
    
    debug(`📖 Lendo chat... ${opts.length} linhas`);
    
    let chatStr = "";
    for (let i = 0; i < opts.length; i++) {
        if (!opts[i].text?.match(timestampRegex) && i === 0) continue;
        if (opts[i].text?.match(timestampRegex)) {
            if (i > 0) chatStr += "\n";
            chatStr += opts[i].text + " ";
        } else {
            chatStr += opts[i].text;
        }
    }
    
    if (!chatStr.trim()) {
        debug("⚠️ No line with timestamp");
        return;
    }
    
    let chatLines = chatStr.trim().split("\n");
    debug(`📝 ${chatLines.length} processeds lines`);
    
    // ===== PROCESS EACH LINE =====
    for (let line of chatLines) {
        let chatLine = line.trim();
        debug(`📄 Linha: "${chatLine.substring(0, 100)}${chatLine.length > 100 ? '...' : ''}"`);
        
        if (isInHistory(chatLine)) {
            debug(`⏭️ Já processada`);
            continue;
        }
        
        let salvo = false;
        
        // ===== 1. DETECTAR POR PALAVRAS-CHAVE (MAIS FLEXÍVEL) =====
        
        // LOTD
        if (!salvo && chatLine.includes("Luck") && chatLine.includes("Dwarves")) {
            debug("💍 LOTD detectado por palavra-chave");
            let match = chatLine.match(/receive:? (\d+) x (.*)/i);
            if (match) {
                let qty = parseInt(match[1]);
                let item = match[2].trim();
                
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
                debug(`💾 LOTD SALVO! ${qty} x ${item}`);
                salvo = true;
            }
        }
        
        // FEIXE
        if (!salvo && chatLine.includes("golden") && chatLine.includes("beam")) {
            debug("✨ FEIXE detectado por palavra-chave");
            let match = chatLine.match(/receive:? (\d+) x (.*)/i);
            if (match) {
                let qty = parseInt(match[1]);
                let item = match[2].trim();
                
                let dropItem = {
                    item: `${qty} x ${item}`,
                    quantity: qty,
                    name: item,
                    type: "FEIXE",
                    time: new Date(),
                    chatLine
                };
                
                updateSaveData({ data: dropItem });
                updateChatHistory(chatLine);
                showItems();
                sendDiscordNotification(dropItem);
                debug(`💾 FEIXE SALVO! ${qty} x ${item}`);
                salvo = true;
            }
        }
        
        // SEREN
        if (!salvo && chatLine.includes("Seren") && chatLine.includes("spirit")) {
            debug("💎 SEREN detectado por palavra-chave");
            let match = chatLine.match(/gifts you:? (\d+) x (.*)/i);
            if (match) {
                let qty = parseInt(match[1]);
                let item = match[2].trim();
                item = item.replace(/\.?\s*The gift is sent to your bank\.?$/i, '');
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
                debug(`💾 SEREN SALVO! ${qty} x ${item}`);
                salvo = true;
            }
        }
        
        // HAZELMERE
        if (!salvo && chatLine.includes("Hazelmere")) {
            debug("🔱 HAZELMERE detectado por palavra-chave");
            let match = chatLine.match(/receive:? (\d+) x (.*)/i);
            if (match) {
                let qty = parseInt(match[1]);
                let item = match[2].trim();
                let type = chatLine.includes("doubles") ? "HSR_DOUBLE" : "HSR";
                
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
                debug(`💾 HAZELMERE SALVO! ${qty} x ${item}`);
                salvo = true;
            }
        }
        
        // ===== 2. SE NÃO DETECTOU POR PALAVRA, TENTA FRASES PERSONALIZADAS =====
        if (!salvo) {
            let phrases = JSON.parse(localStorage.getItem(`${appName}_phrases`) || "null") || DEFAULT_PHRASES;
            
            for (let phrase of phrases) {
                // Cria regex da frase
                let pattern = phrase
                    .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
                    .replace(/\\\(\\d\+\\\\\)/g, '(\\d+)')
                    .replace(/\\\(\.\+\\\\\)/g, '(.*)');
                
                let regex = new RegExp(`\\[\\d{2}:\\d{2}:\\d{2}\\] ${pattern}`);
                let match = chatLine.match(regex);
                
                if (match) {
                    let type = "CUSTOM";
                    if (phrase.includes("Luck")) type = "LOTD";
                    else if (phrase.includes("Hazelmere")) type = phrase.includes("doubles") ? "HSR_DOUBLE" : "HSR";
                    else if (phrase.includes("golden")) type = "FEIXE";
                    else if (phrase.includes("Seren")) type = "SEREN";
                    
                    let qty = parseInt(match[1]);
                    let item = match[2].trim();
                    
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
    itemList.querySelectorAll("li.item:not(.header):not(.total)").forEach(el => el.remove());
    
    let data = getSaveData("data") || [];
    itemTotal.innerHTML = String(data.length);
    let mode = getSaveData("mode");
    
    if (mode === "total") {
        listHeader.innerHTML = "Drop Totals";
        listHeader.dataset.show = "history";
        
        let totals: any = {};
        data.forEach((item: any) => {
            if (!totals[item.name]) totals[item.name] = { total:0, lotd:0, hsr:0 };
            totals[item.name].total += item.quantity;
            if (item.type === "LOTD") totals[item.name].lotd += item.quantity;
            else if (item.type.includes("HSR")) totals[item.name].hsr += item.quantity;
        });
        
        Object.keys(totals).sort().forEach(n => {
            let t = totals[n];
            itemList.insertAdjacentHTML("beforeend",
                `<li class="list-group-item item">${n}: ${t.total} (💍:${t.lotd} | 🔱:${t.hsr})</li>`);
        });
    } else {
        listHeader.innerHTML = "Drop History";
        listHeader.dataset.show = "total";
        
        data.slice().reverse().forEach((item: any) => {
            let icon = item.type === "LOTD" ? "💍" : item.type.includes("HSR") ? "🔱" : "✨";
            itemList.insertAdjacentHTML("beforeend",
                `<li class="list-group-item item" title="${new Date(item.time).toLocaleString()}">${icon} ${item.item}</li>`);
        });
    }
    updateCounters();
}



// ===== INICIALIZAÇÃO DO CHAT (IGUAL ZEROGWAFA) =====
window.setTimeout(() => {
    let findChat = setInterval(() => {
        if (!reader.pos) {
            reader.find();
            return;
        }
        clearInterval(findChat);
        debug("✅ Chat encontrado!");
        document.querySelector(".item.loading")?.remove();
        
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
        dropItem.type === "FEIXE" ? "✨" : 
        dropItem.type === "SEREN" ? "💎" : "📦";
    
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

// ===== RESET MANUAL =====
let resetBtn = document.createElement('button');
resetBtn.className = 'nisbutton w-100';
resetBtn.textContent = '🔄 Reset Reader';
resetBtn.style.marginTop = '10px';
document.querySelector('.modal-body')?.appendChild(resetBtn);
resetBtn.addEventListener('click', () => {
    reader.pos = null;
    reader.find();
    debug("🔄 Reader resetado");
});


// ===== VERSÃO =====
let versionSpan = document.getElementById("version-number");
if (versionSpan) versionSpan.textContent = VERSION;

// ===== INIT =====
if (!localStorage.getItem(appName)) {
    localStorage.setItem(appName, JSON.stringify({ chat: 0, data: [], mode: "history" }));
}
debug("✅ Inicializado");