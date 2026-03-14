# 🍀 Lucky Drops Tracker

[🇧🇷 Português](#português) | [🇬🇧 English](#english)

---

## <a name="english"></a>🇬🇧 English

### 📋 About
A RuneScape drop tracker for Alt1 Toolkit that automatically detects and records special drops from various sources:
- 💍 **LOTD** (Luck of the Dwarves)
- 🔱 **HSR** (Hazelmere's Signet Ring)
- ✨ **Golden Beam** (Seren Spirit/Bonus Drops)
- 💎 **Seren Spirit**

### ✨ Features
- ✅ **Automatic detection** - Reads your chat in real-time
- 📊 **Drop history** - View all your recorded drops
- 📈 **Item totals** - See quantities by item type
- 📤 **CSV Export** - Export your data for spreadsheets
- 🔔 **Discord integration** - Get notifications when you get a drop
- 📝 **Custom phrases** - Add your own chat patterns
- 🎨 **Color coded** - Different colors for different drop types

### 🔧 Installation

**Option 1 - Direct Alt1 Link:**
`alt1://addapp/https://ruhtradev.github.io/LuckyDrops/appconfig.json`

**Option 2 - Alt1 Browser:**
1. Open Alt1 browser
2. Navigate to: `https://ruhtradev.github.io/LuckyDrops/`
3. Click "Add App"

### 🎯 How to Use

#### 1. **Initial Setup**
- Open the app with RuneScape visible
- Make sure your chat is visible on screen
- Ensure **timestamps are ON** in RuneScape chat settings
- Set interface **transparency to 0%**

#### 2. **Select the Right Chat**
- Click the ⚙️ **Settings** button
- Use the **"Select Chat"** dropdown to choose the chat window where drops appear
- A cyan rectangle will briefly highlight the selected chat

#### 3. **Track Your Drops**
- The app will automatically start reading your chat
- When a drop is detected, it will appear in the list
- Recent drops show at the top
- Hover over any drop to see the exact time

#### 4. **View Totals**
- Click the header **"Drop History"** to switch between:
  - **History view** - Chronological list of drops
  - **Totals view** - Quantities grouped by item

#### 5. **Export Data**
- Go to Settings → **CSV Export**
- Exports based on current view:
  - **History view** → Detailed list with dates
  - **Totals view** → Quantities by item

### ⚙️ Settings Explained

#### 📝 **Custom Phrases**
Add your own chat patterns to detect different drops:
Your Luck of the Dwarves shines brightly and you receive: (\d+) x (.+)
A golden beam shines over one of your items. You receive: (\d+) x (.+)

- `(\d+)` = quantity (any number)
- `(.+)` = item name (any text)

#### 🔔 **Discord Webhook**
1. Create a webhook in your Discord server (Channel Settings → Integrations)
2. Copy the webhook URL
3. Paste in the Discord Webhook field and click **Save**
4. You'll receive notifications when drops are detected

#### ⚠️ **Reset Drops**
- Clears **only** your drop history
- Keeps your custom phrases and webhook settings
- Cannot be undone

### 🎨 Color Legend
| Drop Type | Color | Example |
|-----------|-------|---------|
| LOTD | 🟠 Orange | `Your Luck of the Dwarves...` |
| HSR | 🟡 Gold | `Your Hazelmere's signet ring...` |
| Golden Beam | ✨ Yellow | `A golden beam shines...` |
| Seren | 🔵 Cyan | `The Seren spirit gifts you...` |

### 📝 Example Drops
[14:30:45] Your Luck of the Dwarves shines brightly and you receive: 500 x Dragonstone bolt tips
[14:32:12] A golden beam shines over one of your items. You receive: 100 x Uncut diamond
[14:35:30] The Seren spirit gifts you: 250 x Onyx bolts

### 🔧 Troubleshooting

**App not detecting drops?**
- Check that timestamps are ON in RuneScape
- Make sure the correct chat is selected
- Verify interface transparency is 0%
- Try selecting a different chat window

**Drops not saving?**
- Check your custom phrases match the chat format
- Use `(\d+)` for numbers and `(.+)` for item names
- Try resetting drops and testing with default phrases

**Discord not notifying?**
- Verify webhook URL is correct
- Check Discord channel permissions
- Test webhook with the "Save" button

---

## <a name="português"></a>🇧🇷 Português

### 📋 Sobre
Um rastreador de drops para RuneScape que detecta automaticamente drops especiais de várias fontes:
- 💍 **LOTD** (Sorte dos Anões)
- 🔱 **HSR** (Anel de Sinete de Hazelmere)
- ✨ **Feixe Dourado**
- 💎 **Espírito de Seren**

### ✨ Funcionalidades
- ✅ **Detecção automática** - Lê seu chat em tempo real
- 📊 **Histórico de drops** - Veja todos os seus drops registrados
- 📈 **Totais por item** - Quantidades agrupadas por tipo
- 📤 **Exportar CSV** - Exporte seus dados para planilhas
- 🔔 **Integração com Discord** - Receba notificações quando pegar um drop
- 📝 **Frases personalizadas** - Adicione seus próprios padrões de chat
- 🎨 **Cores diferenciadas** - Cores diferentes para cada tipo de drop

### 🔧 Instalação

**Opção 1 - Link Direto Alt1:**
`alt1://addapp/https://ruhtradev.github.io/LuckyDrops/appconfig.json`

**Opção 2 - Navegador Alt1:**
1. Abra o navegador Alt1
2. Acesse: `https://ruhtradev.github.io/LuckyDrops/`
3. Clique em "Add App"

### 🎯 Como Usar

#### 1. **Configuração Inicial**
- Abra o app com o RuneScape visível
- Certifique-se que o chat está visível
- **Timestamps devem estar ATIVADOS** nas configurações do RuneScape
- **Transparência da interface funciona melhor em 0%**

#### 2. **Selecione o Chat Correto**
- Clique no botão ⚙️ **Configurações**
- Use o menu **"Select Chat"** para escolher a janela de chat
- Um retângulo ciano vai destacar brevemente o chat selecionado

#### 3. **Acompanhe Seus Drops**
- O app vai começar a ler seu chat automaticamente
- Quando um drop for detectado, aparecerá na lista
- Drops recentes aparecem no topo
- Passe o mouse sobre qualquer drop para ver o horário exato

#### 4. **Veja os Totais**
- Clique no cabeçalho **"Drop History"** para alternar entre:
  - **Visão Histórico** - Lista cronológica de drops
  - **Visão Totais** - Quantidades agrupadas por item

#### 5. **Exportar Dados**
- Vá em Configurações → **CSV Export**
- Exporta baseado na visualização atual:
  - **Visão Histórico** → Lista detalhada com datas
  - **Visão Totais** → Quantidades por item

### ⚙️ Configurações

#### 📝 **Frases Personalizadas**
Adicione seus próprios padrões de chat para detectar diferentes drops:
Your Luck of the Dwarves shines brightly and you receive: (\d+) x (.+)
A golden beam shines over one of your items. You receive: (\d+) x (.+)

text
- `(\d+)` = quantidade (qualquer número)
- `(.+)` = nome do item (qualquer texto)

#### 🔔 **Webhook do Discord**
1. Crie um webhook no seu servidor Discord (Configurações do Canal → Integrações)
2. Copie a URL do webhook
3. Cole no campo do Discord Webhook e clique em **Save**
4. Você receberá notificações quando drops forem detectados

#### ⚠️ **Resetar Drops**
- Limpa **apenas** seu histórico de drops
- Mantém suas frases personalizadas e configurações do webhook
- Não pode ser desfeito

### 🎨 Legenda de Cores
| Tipo de Drop | Cor | Exemplo |
|--------------|-----|---------|
| LOTD | 🟠 Laranja | `Your Luck of the Dwarves...` |
| HSR | 🟡 Dourado | `Your Hazelmere's signet ring...` |
| Feixe Dourado | ✨ Amarelo | `A golden beam shines...` |
| Seren | 🔵 Ciano | `The Seren spirit gifts you...` |

### 📝 Exemplos de Drops
[14:30:45] Your Luck of the Dwarves shines brightly and you receive: 500 x Dragonstone bolt tips
[14:32:12] A golden beam shines over one of your items. You receive: 100 x Uncut diamond
[14:35:30] The Seren spirit gifts you: 250 x Onyx bolts

### 🔧 Solução de Problemas

**App não detecta drops?**
- Verifique se os timestamps estão ATIVADOS no RuneScape
- Certifique-se que o chat correto está selecionado
- Confirme que a transparência da interface está em 0%
- Tente selecionar outra janela de chat

**Drops não são salvos?**
- Verifique se suas frases personalizadas correspondem ao formato do chat
- Use `(\d+)` para números e `(.+)` para nomes de itens
- Tente resetar os drops e testar com as frases padrão

**Discord não notifica?**
- Verifique se a URL do webhook está correta
- Confirme as permissões do canal no Discord
- Teste o webhook com o botão "Save"

### 📦 Version
**Current version:** 1.2.20.16

### 👏 Credits
Based on [SerenTracker](https://github.com/ZeroGwafa/SerenTracker) and [ComponentCounter](https://github.com/ZeroGwafa/ComponentCounter) by **ZeroGwafa**

## 👤 Autor / Author
**RuhtraDev**

## 📄 Licença / License
MIT