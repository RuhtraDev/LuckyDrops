# 🍀 Lucky Drops Tracker

[🇧🇷 Português](#portugues) | [🇬🇧 English](#english)

---

## <a name="english"></a>🇬🇧 English

### 📋 About
A comprehensive RuneScape drop tracker for Alt1 Toolkit that automatically detects and records special drops from various sources:

| Source | Icon | Description |
|--------|------|-------------|
| **LOTD** | 💍 | Luck of the Dwarves ring drops |
| **HSR** | 🔱 | Hazelmere's Signet Ring (normal & double) |
| **Golden Beam** | ✨ | High-value drops (configurable threshold) |
| **Seren Spirit** | 💎 | Seren spirit gifts |
| **Scavenging** | 💡 | Invention components from Scavenging perk or Blessing Gods |
| **Custom** | 📝 | Any user-defined chat patterns |

### ✨ Features

**Core Features**
- ✅ **Real-time detection** - Reads your chat every 600ms
- 📊 **Drop history** - Chronological list with timestamps
- 📈 **Item totals** - Quantities grouped by item type
- 🎨 **Color-coded drops** - Visual identification by drop type
- 🔴 **Rare components** - Special highlighting for rare Invention components
- 📤 **CSV Export** - Export data to spreadsheets

**Advanced Features**
- 🔔 **Discord Webhook** - Instant notifications for all drops
- 📝 **Custom phrases** - Add your own chat patterns
- 🔍 **Drop filters** - Filter by type (LOTD, HSR, BEAM, SEREN, COMPS)
- 🧹 **Duplicate prevention** - Smart cache prevents double counting
- 🔧 **Chat selector** - Multiple chat window support

### 🎨 Visual Features
| Feature | Description |
|---------|-------------|
| **Timestamps** | Hover to see exact time, visible on filtered views |
| **Rare components** | 🔴 Red text for rare Invention components |
| **Color legend** | Orange (LOTD), Gold (HSR), Yellow (Beam), Cyan (Seren), White (Components) |
| **Smart layout** | Fixed header, scrollable list, responsive design |

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
- Ensure your loot chat is visible on screen
- **Enable timestamps** in RuneScape chat settings
- Set interface **transparency to 0%** for best results

#### 2. **Select the Right Chat**
- Click ⚙️ **Settings** button
- Use **"Select Chat"** dropdown to choose the correct chat window
- A cyan rectangle will briefly highlight the selected chat

#### 3. **Track Your Drops**
- App reads chat automatically every 600ms
- Drops appear immediately in the list
- Recent drops at the top
- **Mouse over** any drop to see the full timestamp
- **Filter drops** using the buttons at the top

#### 4. **View Totals**
- Click header **"Drop History"** to switch views:
  - **History view** → Chronological list with timestamps
  - **Totals view** → Quantities grouped by item

#### 5. **Export Data**
- Settings → **CSV Export**
- Exports based on current view:
  - **History** → Detailed list with dates/times
  - **Totals** → Quantities by item

### ⚙️ Settings Explained

#### 📝 **Custom Phrases**
Add your own chat patterns to detect any drop:
Your Luck of the Dwarves shines brightly and you receive: (\d+) x (.+)
A golden beam shines over one of your items. You receive: (\d+) x (.+)
The Seren spirit gifts you: (\d+) x (.+)
Materials gained: (\d+) x (.+)

- `(\d+)` = quantity (any number)
- `(.+)` = item name (any text)

#### 🔔 **Discord Webhook**
1. Create webhook in Discord (Channel Settings → Integrations)
2. Copy webhook URL
3. Paste in Discord Webhook field and click **Save**
4. Receive instant notifications for all drops

#### ⚠️ **Reset Drops**
- Clears **only** your drop history
- Preserves custom phrases and webhook settings
- Cannot be undone

### 🎨 Color Legend

| Type | Color | Icon |
|------|-------|------|
| LOTD | 🟠 Orange | 💍 |
| HSR | 🟡 Gold | 🔱 |
| Golden Beam | ✨ Yellow | ✨ |
| Seren Spirit | 🔵 Cyan | 💎 |
| Components | ⚪ White | 💡 |
| Rare Components | 🔴 Red | 🔴 |

### 📝 Example Drops

**LOTD:**
[14:30:45] Your Luck of the Dwarves shines brightly and you receive: 500 x Dragonstone bolt tips

**Golden Beam:**
[14:32:12] A golden beam shines over one of your items. You receive: 100 x Uncut diamond

**Seren Spirit:**
[14:35:30] The Seren spirit gifts you: 250 x Onyx bolts

**Components:**
[14:40:15] Your Scavenging perk adds: 4 x Ilujankan components

### 🛠️ Troubleshooting

**App not detecting drops?**
- ✅ Check timestamps are ON in RuneScape
- ✅ Verify correct chat is selected
- ✅ Set interface transparency to 0%
- ✅ Try selecting a different chat window

**Drops not saving?**
- ✅ Verify custom phrases match chat format
- ✅ Use `(\d+)` for numbers and `(.+)` for item names
- ✅ Reset drops and test with default phrases

**Discord not notifying?**
- ✅ Verify webhook URL is correct
- ✅ Check Discord channel permissions
- ✅ Test webhook with the "Save" button

---

## <a name="portugues"></a>🇧🇷 Português

### 📋 Sobre
Um rastreador completo de drops para RuneScape que detecta automaticamente drops especiais de várias fontes:

| Fonte | Ícone | Descrição |
|-------|-------|-----------|
| **LOTD** | 💍 | Drops do anel Sorte dos Anões |
| **HSR** | 🔱 | Anel de Sinete de Hazelmere (normal e duplicado) |
| **Feixe Dourado** | ✨ | Drops de alto valor (limite configurável no RS) |
| **Espírito de Seren** | 💎 | Presentes do Espírito de Seren |
| **Scavenging** | 💡 | Componentes de Invenção do Benefício Vasculhar e da Benção dos Deuses |
| **Personalizado** | 📝 | Qualquer padrão de chat definido pelo usuário |

### ✨ Funcionalidades

**Funcionalidades Principais**
- ✅ **Detecção em tempo real** - Lê o chat a cada 600ms
- 📊 **Histórico de drops** - Lista cronológica com horários
- 📈 **Totais por item** - Quantidades agrupadas por tipo
- 🎨 **Cores por tipo** - Identificação visual imediata
- 🔴 **Componentes raros** - Destaque especial em vermelho
- 📤 **Exportar CSV** - Exporte dados para planilhas

**Funcionalidades Avançadas**
- 🔔 **Webhook Discord** - Notificações instantâneas
- 📝 **Frases personalizadas** - Adicione seus próprios padrões
- 🔍 **Filtros por tipo** - Filtre por LOTD, HSR, BEAM, SEREN, COMPS
- 🧹 **Prevenção de duplicatas** - Cache inteligente
- 🔧 **Seletor de chat** - Suporte a múltiplas janelas de chat

### 🎨 Características Visuais
| Recurso | Descrição |
|---------|-----------|
| **Timestamps** | Mouse over mostra horário exato, visível em filtros |
| **Componentes raros** | 🔴 Texto vermelho para componentes raros |
| **Legenda de cores** | Laranja (LOTD), Dourado (HSR), Amarelo (Feixe), Ciano (Seren), Branco (Componentes) |
| **Layout inteligente** | Cabeçalho fixo, lista rolável, design responsivo |

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
- Certifique-se que o chat de loot está visível
- **Ative os timestamps** nas configurações do chat
- Ajuste a **transparência da interface para 0%** para melhores resultados

#### 2. **Selecione o Chat Correto**
- Clique em ⚙️ **Configurações**
- Use o menu **"Select Chat"** para escolher a janela correta
- Um retângulo ciano destacará o chat selecionado

#### 3. **Acompanhe Seus Drops**
- O app lê o chat automaticamente a cada 600ms
- Drops aparecem imediatamente na lista
- Drops recentes no topo
- **Mouse over** em qualquer drop para ver o horário completo
- **Filtre os drops** usando os botões no topo

#### 4. **Veja os Totais**
- Clique no cabeçalho **"Drop History"** para alternar:
  - **Visão Histórico** → Lista cronológica com horários
  - **Visão Totais** → Quantidades agrupadas por item

#### 5. **Exportar Dados**
- Configurações → **CSV Export**
- Exporta baseado na visualização atual:
  - **Histórico** → Lista detalhada com datas/horários
  - **Totais** → Quantidades por item

### ⚙️ Configurações

#### 📝 **Frases Personalizadas**
Adicione seus próprios padrões para detectar qualquer drop:
Your Luck of the Dwarves shines brightly and you receive: (\d+) x (.+)
A golden beam shines over one of your items. You receive: (\d+) x (.+)
The Seren spirit gifts you: (\d+) x (.+)
Materials gained: (\d+) x (.+)

- `(\d+)` = quantidade (qualquer número)
- `(.+)` = nome do item (qualquer texto)

#### 🔔 **Webhook Discord**
1. Crie um webhook no Discord (Configurações do Canal → Integrações)
2. Copie a URL do webhook
3. Cole no campo Discord Webhook e clique em **Save**
4. Receba notificações instantâneas de todos os drops

#### ⚠️ **Resetar Drops**
- Limpa **apenas** seu histórico de drops
- Mantém frases personalizadas e webhook
- Não pode ser desfeito

### 🎨 Legenda de Cores

| Tipo | Cor | Ícone |
|------|-----|-------|
| LOTD | 🟠 Laranja | 💍 |
| HSR | 🟡 Dourado | 🔱 |
| Feixe Dourado | ✨ Amarelo | ✨ |
| Espírito de Seren | 🔵 Ciano | 💎 |
| Componentes | ⚪ Branco | 💡 |
| Componentes Raros | 🔴 Vermelho | 🔴 |

### 📝 Exemplos de Drops

**LOTD:**
[14:30:45] Your Luck of the Dwarves shines brightly and you receive: 500 x Dragonstone bolt tips

**Feixe Dourado:**
[14:32:12] A golden beam shines over one of your items. You receive: 100 x Uncut diamond

**Espírito de Seren:**
[14:35:30] The Seren spirit gifts you: 250 x Onyx bolts

**Componentes:**
[14:40:15] Your Scavenging perk adds: 4 x Ilujankan components

### 🛠️ Solução de Problemas

**App não detecta drops?**
- ✅ Verifique se o horário do jogo está ATIVO no chat
- ✅ Confirme que o chat correto está selecionado
- ✅ Ajuste a transparência da interface para 0%
- ✅ Tente selecionar outra janela de chat

**Drops não são salvos?**
- ✅ Verifique se as frases personalizadas correspondem ao formato
- ✅ Use `(\d+)` para números e `(.+)` para nomes de itens
- ✅ Reset os drops e teste com frases padrão

**Discord não notifica?**
- ✅ Confirme se a URL do webhook está correta
- ✅ Verifique as permissões do canal no Discord
- ✅ Teste o webhook com o botão "Save"

---

### 📦 Versão
**Current version:** 2.0.17.15

### 👏 Créditos
Baseado em [SerenTracker](https://github.com/ZeroGwafa/SerenTracker) e [ComponentCounter](https://github.com/ZeroGwafa/ComponentCounter) por **ZeroGwafa**

### 👤 Autor
**RuhtraDev**

### 📄 Licença
MIT