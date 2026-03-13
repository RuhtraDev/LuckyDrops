import * as a1lib from "alt1";
import ChatboxReader from "alt1/chatbox";


import "./appconfig.json";
import "./icon.png";

// ===== DECLARAÇÃO GLOBAL DO ALT1 =====
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

// Configurar cores do chat
reader.readargs = {
    colors: [
        a1lib.mixColor(245, 124, 1),  // Laranja para LOTD
        a1lib.mixColor(255, 215, 0)   // Dourado para HSR
    ]
};

// Verificar se está no Alt1
if (window.alt1) {
    window.alt1.identifyAppUrl("./appconfig.json");
} else {
    let addappurl = `alt1://addapp/${new URL("./appconfig.json", document.location.href).href}`;
    itemList.innerHTML = `<li>Alt1 not detected, click <a href='${addappurl}'>here</a> to add this app to Alt1</li>`;
}

// Inicialização do chat
window.setTimeout(function () {
    let findChat = setInterval(function () {
        if (reader.pos === null) {
            reader.find();
        } else {
            clearInterval(findChat);
            
            // Remover mensagem de loading
            const loadingEl = document.querySelector(".item.loading");
            if (loadingEl) loadingEl.remove();
            
            // Popular dropdown de chats
            reader.pos.boxes.forEach((box: any, i: number) => {
                chatSelector.insertAdjacentHTML("beforeend", `<option value="${i}">Chat ${i}</option>`);
            });

            // Evento de mudança de chat
            chatSelector.addEventListener("change", function (this: HTMLSelectElement) {
                reader.pos.mainbox = reader.pos.boxes[Number(this.value)];
                showSelectedChat(reader.pos);
                updateSaveData({ chat: Number(this.value) });
                this.value = "";
            });

            // Carregar chat salvo ou usar o primeiro
            const savedChat = getSaveData("chat");
            if (savedChat && reader.pos.boxes[Number(savedChat)]) {
                reader.pos.mainbox = reader.pos.boxes[Number(savedChat)];
            } else {
                reader.pos.mainbox = reader.pos.boxes[0];
                updateSaveData({ chat: 0 });
            }
            
            showSelectedChat(reader.pos);
            showItems();
            setInterval(readChatbox, 600);
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
    
    chatLines.forEach(line => {
        const chatLine = line.trim();
        if (isInHistory(chatLine)) return;
        
        // Detectar LOTD
        let match = chatLine.match(/\[\d{2}:\d{2}:\d{2}\] Your Luck of the Dwarves(?: ring)? shines brightly(?: and you receive)?:? (\d+) x (.+)/);
        let dropType = "LOTD";
        
        if (!match) {
            match = chatLine.match(/\[\d{2}:\d{2}:\d{2}\] Your Hazelmere's signet ring shines brightly\. You receive: (\d+) x (.+)/);
            dropType = "HSR";
        }
        
        if (!match) {
            match = chatLine.match(/\[\d{2}:\d{2}:\d{2}\] The power of Hazelmere blesses your drop and doubles it before your very eyes: (\d+) x (.+)/);
            dropType = "HSR_DOUBLE";
        }
        
        if (match) {
            const quantity = parseInt(match[1]);
            const itemName = match[2].trim();
            
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

// Versão
const versionSpan = document.getElementById("version-number");
if (versionSpan) {
    versionSpan.textContent = "1.0.20.48";
}