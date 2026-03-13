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

// Regex para capturar drops
const ringRegexes = {
    lotd: /\[\d{2}:\d{2}:\d{2}\] Your Luck of the Dwarves ring shines brightly\. You receive: (\d+) x (.+)/,
    hazelmereNormal: /\[\d{2}:\d{2}:\d{2}\] Your Hazelmere's signet ring shines brightly\. You receive: (\d+) x (.+)/,
    hazelmereDouble: /\[\d{2}:\d{2}:\d{2}\] The power of Hazelmere blesses your drop and doubles it before your very eyes: (\d+) x (.+)/
};

// Configurar cores do chat
reader.readargs = {
    colors: [
        a1lib.mixColor(245, 124, 1),
        a1lib.mixColor(255, 215, 0),
    ],
};

// Verificar se está no Alt1
if (window.alt1) {
    window.alt1.identifyAppUrl("./appconfig.json");
} else {
    let addappurl = `alt1://addapp/${new URL("./appconfig.json", document.location.href).href}`;
    itemList.innerHTML = `<li>Alt1 not detected, click <a href='${addappurl}'>here</a> to add this app to Alt1</li>`;
}

// Funções auxiliares
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

function updateSaveData(...datasets: any[]) {
    const current = JSON.parse(localStorage.getItem(appName) || "{}");
    datasets.forEach(data => {
        const key = Object.keys(data)[0];
        const value = data[key];
        if (key === "data") {
            if (!current[key]) current[key] = [];
            if (!Array.isArray(value)) {
                current[key].push(value);
            } else {
                current[key] = value;
            }
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

function showItems() {
    if (!itemList || !listHeader || !itemTotal) return;
    itemList.querySelectorAll("li.item").forEach(el => el.remove());
    const data = getSaveData("data") || [];
    itemTotal.innerHTML = String(data.length);
    
    if (getSaveData("mode") === "total") {
        listHeader.dataset.show = "history";
        listHeader.title = "Click to show History";
        listHeader.innerHTML = "Ring Drop Totals";
        
        const totals: { [key: string]: { total: number; lotd: number; hazelmere: number } } = {};
        data.forEach((item: any) => {
            if (!totals[item.name]) {
                totals[item.name] = { total: 0, lotd: 0, hazelmere: 0 };
            }
            totals[item.name].total += item.quantity;
            if (item.type.includes("LOTD")) {
                totals[item.name].lotd += item.quantity;
            } else {
                totals[item.name].hazelmere += item.quantity;
            }
        });
        
        Object.keys(totals).sort().forEach(item => {
            const t = totals[item];
            itemList.insertAdjacentHTML(
                "beforeend",
                `<li class="list-group-item item">${item}: ${t.total} (LOTD: ${t.lotd} | Hazel: ${t.hazelmere})</li>`
            );
        });
    } else {
        listHeader.dataset.show = "total";
        listHeader.title = "Click to show Totals";
        listHeader.innerHTML = "Ring Drop History";
        
        if (data.length > 0) {
            data.slice().reverse().forEach((item: any) => {
                const ringIcon = item.type.includes("LOTD") ? "💎" : "👑";
                itemList.insertAdjacentHTML(
                    "beforeend",
                    `<li class="list-group-item item" title="${new Date(item.time).toLocaleString()} - ${item.type}">
                        ${ringIcon} ${item.item}
                    </li>`
                );
            });
        }
    }
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
    
    if (chatStr.trim() === "") return;
    const chatLines = chatStr.trim().split("\n");
    
    chatLines.forEach(line => {
        const chatLine = line.trim();
        if (isInHistory(chatLine)) return;
        
        let match = chatLine.match(ringRegexes.lotd);
        let ringType = "LOTD";
        
        if (!match) {
            match = chatLine.match(ringRegexes.hazelmereNormal);
            ringType = "Hazelmere";
        }
        
        if (!match) {
            match = chatLine.match(ringRegexes.hazelmereDouble);
            ringType = "Hazelmere (Double)";
        }
        
        if (match) {
            const quantity = parseInt(match[1]);
            const itemName = match[2].trim();
            
            const dropItem = {
                item: `${quantity} x ${itemName}`,
                quantity: quantity,
                name: itemName,
                type: ringType,
                time: new Date(),
                chatLine: chatLine
            };
            
            console.log(`${ringType} drop detectado:`, dropItem);
            updateSaveData({ data: dropItem });
            updateChatHistory(chatLine);
            checkAnnounce(dropItem);
            showItems();
        }
    });
}

function checkAnnounce(dropItem: any) {
    const webhook = getSaveData("discordWebhook");
    if (webhook) {
        const emoji = dropItem.type.includes("LOTD") ? "💎" : "👑";
        fetch(webhook, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                username: "Lucky Drops",
                content: `${emoji} ${new Date().toLocaleString()}: ${dropItem.type} - ${dropItem.item}`
            })
        }).catch(err => console.error("Discord webhook error:", err));
    }
}

// Inicialização
window.setTimeout(function () {
    let findChat = setInterval(function () {
        if (reader.pos === null) {
            reader.find();
        } else {
            clearInterval(findChat);
            
            if (reader.pos && reader.pos.boxes) {
                reader.pos.boxes.forEach((box: any, i: number) => {
                    chatSelector.insertAdjacentHTML("beforeend", `<option value="${i}">Chat ${i}</option>`);
                });

                chatSelector.addEventListener("change", function (e) {
                    const select = e.target as HTMLSelectElement;
                    if (reader.pos && reader.pos.boxes[Number(select.value)]) {
                        reader.pos.mainbox = reader.pos.boxes[Number(select.value)];
                        showSelectedChat(reader.pos);
                        updateSaveData({ chat: Number(select.value) });
                    }
                    select.value = "";
                });

                const savedChat = getSaveData("chat");
                if (savedChat !== false && reader.pos.boxes[Number(savedChat)]) {
                    reader.pos.mainbox = reader.pos.boxes[Number(savedChat)];
                } else {
                    if (reader.pos.boxes[0]) {
                        reader.pos.mainbox = reader.pos.boxes[0];
                    }
                    updateSaveData({ chat: 0 });
                }

                if (reader.pos) {
                    showSelectedChat(reader.pos);
                }
                showItems();
                setInterval(readChatbox, 600);
            }
        }
    }, 1000);
}, 50);

// Event Listeners
exportButton.addEventListener("click", function () {
    const data = getSaveData("data") || [];
    const mode = getSaveData("mode");
    let csv = "";
    let filename = "";
    
    if (mode === "total") {
        csv = "Item,Total Quantity,LOTD Quantity,Hazelmere Quantity\n";
        const totals: { [key: string]: any } = {};
        
        data.forEach((item: any) => {
            if (!totals[item.name]) {
                totals[item.name] = { total: 0, lotd: 0, hazelmere: 0 };
            }
            totals[item.name].total += item.quantity;
            if (item.type.includes("LOTD")) {
                totals[item.name].lotd += item.quantity;
            } else {
                totals[item.name].hazelmere += item.quantity;
            }
        });
        
        Object.keys(totals).sort().forEach(item => {
            csv += `${item},${totals[item].total},${totals[item].lotd},${totals[item].hazelmere}\n`;
        });
        
        filename = "LuckyDrops_Totals.csv";
    } else {
        csv = "Item,Quantity,Ring Type,Date,Time\n";
        data.forEach((item: any) => {
            const date = new Date(item.time);
            csv += `${item.name},${item.quantity},${item.type},${date.toLocaleDateString()},${date.toLocaleTimeString()}\n`;
        });
        filename = "LuckyDrops_History.csv";
    }
    
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
});

clearButton.addEventListener("click", function () {
    if (confirm("Are you sure you want to reset all data?")) {
        localStorage.removeItem(appName);
        sessionStorage.removeItem(`${appName}chatHistory`);
        location.reload();
    }
});

listHeader.addEventListener("click", function () {
    const newMode = this.dataset.show === "total" ? "history" : "total";
    updateSaveData({ mode: newMode });
    showItems();
});

// Inicialização de dados
(function init() {
    if (!localStorage.getItem(appName)) {
        localStorage.setItem(appName, JSON.stringify({
            chat: 0,
            data: [],
            mode: "history"
        }));
    }
})();