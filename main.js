import { parseCsvData } from './parser.js';
import { showOverlayPanel } from './modal.js';

// --- 유틸리티 함수 ---
const createElement = (tag, classes = '', text = '') => {
    const element = document.createElement(tag);
    if (classes) element.className = classes;
    if (text) element.textContent = text;
    return element;
};

const getTypeColor = (type) => {
    const colors = { 'buff': 'text-green-400', 'debuff': 'text-red-400', 'pos': 'text-green-400', 'neg': 'text-red-400' };
    return colors[type] || 'text-white';
}

// --- 1턴: 운명의 부름 (캐릭터 선택) UI 렌더링 함수 ---
const renderDestinyChoice = (choice, allAttributes) => {
    const card = createElement('div', 'bg-gray-800/50 p-6 rounded-lg border border-gray-700 flex flex-col h-full');
    
    const name = createElement('h3', 'text-2xl font-bold text-yellow-300 mb-2', choice.name);
    const desc = createElement('p', 'text-gray-300 mb-4 flex-grow', choice.desc);

    const statsTitle = createElement('h4', 'font-semibold text-lg mb-2', '능력치');
    const statsGrid = createElement('div', 'grid grid-cols-2 gap-x-4 gap-y-1 text-sm');
    
    allAttributes.forEach(attr => {
        const isStrength = choice.strengths.includes(attr.name);
        const isNormal = choice.normals.includes(attr.name);
        const isWeakness = choice.weaknesses.includes(attr.name);
        
        let statColor = 'text-gray-400';
        let sign = '-';
        if (isStrength) { statColor = 'text-green-400'; sign = '▲'; }
        if (isWeakness) { statColor = 'text-red-400'; sign = '▼'; }
        if (isNormal) { statColor = 'text-white'; sign = '●'; }

        const statEl = createElement('div', `${statColor} flex items-center`)
        statEl.innerHTML = `<span class="w-12">${attr.name}</span> <span>${sign}</span>`;
        statsGrid.appendChild(statEl);
    });

    card.append(name, desc, statsTitle, statsGrid);
    return card;
};

const renderDestinyUI = (data) => {
    const { session_settings } = data;
    const appRoot = document.getElementById('app-root');
    appRoot.innerHTML = ''; // 기존 레이아웃 초기화

    const container = createElement('div', 'h-screen w-screen flex flex-col items-center justify-center p-8 bg-gray-900');
    const title = createElement('h1', 'text-4xl font-bold text-gray-200 mb-2', data.genre);
    const subtitle = createElement('p', 'text-lg text-gray-400 mb-8', data.description);
    
    const choiceGrid = createElement('div', 'grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl w-full');
    session_settings.destiny_choices.forEach(choice => {
        choiceGrid.appendChild(renderDestinyChoice(choice, session_settings.stat_definitions));
    });

    container.append(title, subtitle, choiceGrid);
    appRoot.appendChild(container);
};


// --- 2턴 이후: 메인 HUD UI 렌더링 함수 ---
const renderStatBar = (label, current, max, colorClass) => {
    const percentage = max > 0 ? (current / max) * 100 : 0;
    const container = createElement('div', 'w-full');
    const labelDiv = createElement('div', 'flex justify-between items-baseline text-xs mb-1');
    labelDiv.innerHTML = `<span class="font-semibold">${label}</span> <span class="font-mono">${current}/${max}</span>`;
    const barBg = createElement('div', 'w-full bg-gray-700 rounded-full h-2.5');
    const barFg = createElement('div', 'h-2.5 rounded-full');
    barFg.style.width = `${percentage}%`;
    barFg.style.backgroundColor = colorClass; // hex 색상 직접 적용
    barBg.appendChild(barFg);
    container.append(labelDiv, barBg);
    return container;
};

const renderTopBar = (data) => {
    const topBar = createElement('div', 'absolute top-0 left-0 right-0 h-16 bg-black/50 px-6 flex items-center justify-between z-10 border-b border-gray-700/50');
    // TODO: 시간, 장소 등 정보 표시
    return topBar;
};

const renderCharacterPanel = (data) => {
    const { character_stats: stats, inventory, skills } = data;
    const panel = createElement('div', 'absolute bottom-0 left-0 right-0 h-48 bg-black/50 p-4 z-10 border-t border-gray-700/50 grid grid-cols-12 gap-6');

    // Character Info (4 cols)
    const charContainer = createElement('div', 'col-span-4 bg-black/30 p-4 rounded-lg border border-gray-700 flex items-center gap-4');
    const charAvatar = createElement('div', 'w-24 h-24 bg-gray-700 rounded-lg flex-shrink-0'); // Placeholder
    const charDetails = createElement('div', 'flex-grow');
    const name = createElement('h2', 'text-2xl font-bold', stats.name);
    const title = createElement('p', 'text-yellow-400', stats.title);
    charDetails.append(name, title);
    charContainer.append(charAvatar, charDetails);

    // Resources (3 cols)
    const resContainer = createElement('div', 'col-span-3 bg-black/30 p-4 rounded-lg border border-gray-700 flex flex-col justify-center gap-2');
    if (stats.resources) {
        stats.resources.forEach(res => {
            resContainer.appendChild(renderStatBar(res.name, res.current, res.max, res.color));
        });
    }

    // Info Panel (3 cols)
    const infoContainer = createElement('div', 'col-span-3 bg-black/30 p-4 rounded-lg border border-gray-700 overflow-y-auto');
    if(data.information_panel) {
        data.information_panel.forEach(item => {
            const itemDiv = createElement('div', 'text-sm');
            const header = createElement('div', 'flex justify-between items-baseline');
            const nameSpan = createElement('span', `font-bold ${getTypeColor(item[0])}`, item[1]);
            header.appendChild(nameSpan);
            header.appendChild(createElement('span', 'text-gray-400 font-mono text-xs', item[2]));
            const desc = createElement('p', 'text-gray-300 pl-2 text-xs', item[3]);
            itemDiv.append(header, desc);
            infoContainer.appendChild(itemDiv);
        });
    }

    // Action Buttons (2 cols)
    const actionContainer = createElement('div', 'col-span-2 bg-black/30 p-4 rounded-lg border border-gray-700 flex flex-col gap-2 justify-center');
    const characterBtn = createElement('button', 'w-full py-2 bg-gray-700 hover:bg-gray-600 rounded-md transition-colors', '👤 캐릭터');
    characterBtn.addEventListener('click', () => showOverlayPanel('character', stats));
    const inventoryBtn = createElement('button', 'w-full py-2 bg-gray-700 hover:bg-gray-600 rounded-md transition-colors', '🎒 아이템');
    inventoryBtn.addEventListener('click', () => showOverlayPanel('inventory', inventory));
    const skillsBtn = createElement('button', 'w-full py-2 bg-gray-700 hover:bg-gray-600 rounded-md transition-colors', '✨ 스킬');
    skillsBtn.addEventListener('click', () => showOverlayPanel('skills', skills));
    actionContainer.append(characterBtn, inventoryBtn, skillsBtn);

    panel.append(charContainer, resContainer, infoContainer, actionContainer);
    return panel;
};

const renderMainContent = (data) => {
    const contentContainer = createElement('main', 'h-screen w-screen relative');
    if (data.image) {
        const image = createElement('img', 'absolute inset-0 w-full h-full object-cover z-0');
        image.src = data.image;
        image.alt = "게임 장면";
        contentContainer.appendChild(image);
    }
    return contentContainer;
};

const initializeMainUI = (data) => {
    const appRoot = document.getElementById('app-root');
    appRoot.innerHTML = ''; // 기존 레이아웃 초기화

    const mainContent = renderMainContent(data);
    const topBar = renderTopBar(data);
    const characterPanel = renderCharacterPanel(data);

    mainContent.append(topBar, characterPanel);
    appRoot.appendChild(mainContent);
};

// --- 애플리케이션 초기화 ---
const initializeStyles = () => {
    const style = document.createElement('style');
    style.textContent = `
        ::-webkit-scrollbar { width: 8px; }
        ::-webkit-scrollbar-track { background: #1f2d3d; }
        ::-webkit-scrollbar-thumb { background: #4b5563; border-radius: 4px; }
        ::-webkit-scrollbar-thumb:hover { background: #6b7280; }
        .overlay-panel { transition: opacity 0.2s ease-in-out, transform 0.2s ease-in-out; }
    `;
    document.head.appendChild(style);
};

document.addEventListener('DOMContentLoaded', () => {
    try {
        initializeStyles();

        const dataSource = document.getElementById('game-state-data');
        if (!dataSource) throw new Error('game-state-data element not found.');
        
        const gameData = parseCsvData(dataSource.textContent);

        let appRoot = document.getElementById('app-root');
        if (!appRoot) {
            appRoot = createElement('div');
            appRoot.id = 'app-root';
            document.body.appendChild(appRoot);
        }

        if (gameData.session_settings && gameData.session_settings.destiny_choices.length > 0) {
            renderDestinyUI(gameData);
        } else {
            initializeMainUI(gameData);
        }

    } catch (error) {
        console.error("Error during initialization:", error);
        document.body.innerHTML = `<div class="text-red-400 p-8">An error occurred while rendering data: ${error.message}</div>`;
    }
});
