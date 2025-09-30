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
    const colors = { 'pos': 'text-green-400', 'neg': 'text-red-400', 'buff': 'text-green-400', 'debuff': 'text-red-400' };
    return colors[type] || 'text-white';
}

// --- 1턴: 운명의 부름 (캐릭터 선택 UI) ---
const initializeDestinyUI = (data) => {
    const appRoot = document.getElementById('app-root');
    appRoot.innerHTML = '';

    const container = createElement('div', 'min-h-screen w-screen flex flex-col items-center justify-center p-4 sm:p-8');
    const imageBaseUrl = 'https://raw.githubusercontent.com/guidejar/Chronicle.AI/main/Artset/Rembrandt/';
    container.style.backgroundImage = `linear-gradient(rgba(17, 24, 39, 0.9), rgba(17, 24, 39, 0.9)), url(${imageBaseUrl}01_throne_room_of_shadows.png)`;
    container.style.backgroundSize = 'cover';
    container.style.backgroundPosition = 'center';

    const title = createElement('h1', 'text-4xl font-bold text-gray-200 mb-2', '운명의 부름');
    const subtitle = createElement('p', 'text-lg text-gray-400 mb-8', '당신의 여정을 함께할 영웅을 선택하십시오.');

    const choiceGrid = createElement('div', 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl w-full');

    Object.values(data.destiny_characters).forEach(char => {
        const card = createElement('div', 'bg-gray-800/50 p-5 rounded-lg border border-gray-700 flex flex-col backdrop-blur-sm cursor-pointer hover:bg-gray-800/80 hover:border-cyan-400 transition-all duration-200');

        const stats = char.stats;
        const statMap = { 'str': '힘', 'dex': '민첩', 'int': '지성', 'wis': '지혜', 'cha': '카리스마', 'vit': '활력' };

        const topStats = Object.entries(stats)
            .filter(([key]) => statMap[key])
            .sort(([, a], [, b]) => b - a)
            .slice(0, 2);

        card.innerHTML = `
            <div class="flex justify-between items-baseline border-b border-gray-700 pb-2">
                <h3 class="text-xl font-bold text-yellow-300">${char.name}</h3>
                <p class="text-sm text-gray-400">${stats.age || '?'}세, ${stats.gender || '?'}</p>
            </div>
            <p class="text-gray-400 text-sm my-4 flex-grow">${char.desc}</p>
            <div class="grid grid-cols-2 gap-4 mt-auto">
                ${topStats.map(([key, value]) => `
                    <div class="bg-black/20 p-3 rounded-md text-center">
                        <p class="text-sm text-cyan-400">${statMap[key]}</p>
                        <p class="text-2xl font-bold font-mono">${value}</p>
                    </div>
                `).join('')}
            </div>
        `;

        card.onclick = () => {
             const modalData = {
                ...char.stats,
                traits: char.traits,
                equipment: char.equipment,
                reputation: char.reputation,
            };
            console.log('캐릭터 클릭됨:', char.name, modalData);
            showOverlayPanel('character', modalData)
        };

        choiceGrid.appendChild(card);
    });

    container.append(title, subtitle, choiceGrid);
    appRoot.appendChild(container);
};


// --- 2턴 이후: 메인 HUD UI ---
const renderCharacterInfo = (stats) => {
    const container = createElement('div');

    const header = createElement('div', 'py-1 px-2 -mx-2 rounded-lg');
    const headerFlex = createElement('div', 'flex justify-between items-baseline');
    headerFlex.appendChild(createElement('h2', 'text-base font-bold', stats.name || '알 수 없음'));
    if(stats.level) {
        headerFlex.appendChild(createElement('span', 'text-xs font-mono text-gray-400', `Lv. ${stats.level}`));
    }
    header.appendChild(headerFlex);
    
    const gauges = createElement('div', 'space-y-2 mt-2');
    if (stats.resources) {
        stats.resources.forEach(res => {
            const gaugeContainer = createElement('div');
            const labelDiv = createElement('div', 'flex justify-between items-baseline text-xs mb-1');
            labelDiv.innerHTML = `<span class="font-semibold">${res.name}</span> <span class="font-mono">${res.current}/${res.max}</span>`;
            
            const barBg = createElement('div', 'w-full bg-gray-700 rounded-full h-1');
            const barFg = createElement('div', 'h-1 rounded-full');
            barFg.style.width = `${res.max > 0 ? (res.current / res.max) * 100 : 0}%`;
            barFg.style.backgroundColor = res.color;
            
            barBg.appendChild(barFg);
            gaugeContainer.append(labelDiv, barBg);
            gauges.appendChild(gaugeContainer);
        });
    }

    container.append(header, gauges);
    return container;
};

const renderMenuButtons = (data) => {
    const container = createElement('div', 'grid grid-cols-3 gap-2 flex-shrink-0');
    const characterBtn = createElement('button', 'w-full text-sm py-2 bg-gray-700/80 hover:bg-gray-600/80 rounded-md transition-colors', '캐릭터');
    characterBtn.onclick = () => showOverlayPanel('character', data.character_stats);
    
    const skillsBtn = createElement('button', 'w-full text-sm py-2 bg-gray-700/80 hover:bg-gray-600/80 rounded-md transition-colors', '스킬');
    skillsBtn.onclick = () => showOverlayPanel('skills', data.skills);

    const inventoryBtn = createElement('button', 'w-full text-sm py-2 bg-gray-700/80 hover:bg-gray-600/80 rounded-md transition-colors', '아이템');
    inventoryBtn.onclick = () => showOverlayPanel('inventory', { items: data.inventory, currencies: data.character_stats.currencies });
    
    container.append(characterBtn, skillsBtn, inventoryBtn);
    return container;
};

const renderTimeAndPlace = (hud, character_stats) => {
    const container = createElement('div');

    const topRow = createElement('div', 'flex justify-between items-baseline text-sm');
    const bottomRow = createElement('div', 'flex justify-between items-baseline mt-1');

    // Currency 표시
    const activeCurrencyName = character_stats.active_currency;
    const currencyData = character_stats.currencies.find(c => c.name === activeCurrencyName);
    let currencyText = '0 금화';
    if (currencyData) {
        currencyText = `${currencyData.name} ${currencyData.amount}${currencyData.unit}`;
    }

    topRow.append(
        createElement('span', 'font-semibold text-yellow-300', currencyText),
        createElement('span', 'text-gray-400', hud.date)
    );
    bottomRow.append(
        createElement('p', 'font-semibold text-gray-200 text-sm', hud.location),
        createElement('p', 'font-mono text-gray-300 text-base', hud.time)
    );

    container.append(topRow, bottomRow);
    return container;
};

const renderInfoLog = (infoPanel) => {
    const container = createElement('div', 'flex flex-col flex-grow min-h-0 border-t border-gray-700/50 pt-4');
    const content = createElement('div', 'text-sm overflow-y-auto pr-1');

    const logCount = infoPanel ? infoPanel.length : 0;
    content.className += logCount > 4 ? ' space-y-1.5' : ' space-y-3';

    if (infoPanel) {
        infoPanel.forEach(item => {
            const log = createElement('div', 'bg-black/20 p-2.5 rounded-md');
            const header = createElement('div', 'flex justify-between items-baseline');

            // @inf|타입|제목|오른쪽|설명
            const title = item[1];
            const topRight = item[2];
            const description = item[3];

            header.innerHTML = `<span class="font-bold text-white">${title}</span><span class="text-gray-400 font-mono text-xs">${topRight}</span>`;
            const desc = createElement('p', 'text-gray-300 pl-2 text-xs mt-1', description);

            log.append(header, desc);
            content.appendChild(log);
        });
    }

    container.appendChild(content);
    return container;
};

const renderMainContent = (data) => {
    const container = document.getElementById('content-container');
    if (!container) return;
    container.innerHTML = '';
    
    // 이미지 파일 경로 설정 (GitHub Raw URL)
    const imageBaseUrl = 'https://raw.githubusercontent.com/guidejar/Chronicle.AI/main/Artset/Rembrandt/';
    const imageMap = [
        '01_throne_room_of_shadows.png', '02_misty_castle_gate.png', '03_tavern_of_whispers.png', 
        '04_clash_of_steel.png', '05_council_by_the_fire.png', '06_aftermath_of_battle.png',
        '07_hooded_wanderer_from_behind.png', '08_robed_sage_in_library.png', '09_praying_priest.png',
        '10_the_broken_blade.png', '11_sand_through_fingers.png', '12_distorted_reflection.png',
        '13_ruined_tower_by_moonlight.png', '14_underground_dungeon.png', '15_uncharted_map_on_table.png',
        '16_dusk_field.png', '17_bustling_market_corner.png', '18_harbor_at_night.png'
    ];
    
    const imageName = imageMap[data.random - 1] || imageMap[0];

    const image = createElement('img', 'absolute inset-0 w-full h-full object-cover');
    image.src = imageBaseUrl + imageName;
    image.alt = "게임 장면";
    container.appendChild(image);
};


const initializeLayout = () => {
    const appRoot = document.getElementById('app-root');
    appRoot.innerHTML = '';

    const mainContainer = createElement('div', 'flex h-screen w-screen');
    const hud = createElement('aside', 'w-80 flex-shrink-0 bg-black/40 p-4 flex flex-col gap-4 z-10 backdrop-blur-sm');
    hud.id = 'hud-container';

    const content = createElement('main', 'flex-grow relative bg-gray-900');
    content.id = 'content-container';

    mainContainer.append(hud, content);
    appRoot.appendChild(mainContainer);
};

const initializeHudUI = (data) => {
    initializeLayout();
    const hudContainer = document.getElementById('hud-container');
    if (!hudContainer) return;

    hudContainer.appendChild(renderCharacterInfo(data.character_stats));
    hudContainer.appendChild(renderMenuButtons(data));
    if (data.hud) {
        hudContainer.appendChild(renderTimeAndPlace(data.hud, data.character_stats));
    }
    hudContainer.appendChild(renderInfoLog(data.information_panel));
    
    renderMainContent(data);
};

// --- 애플리케이션 초기화 ---
document.addEventListener('DOMContentLoaded', () => {
    try {
        const style = document.createElement('style');
        style.textContent = `
            ::-webkit-scrollbar { width: 8px; }
            ::-webkit-scrollbar-track { background: #1f2d3d; }
            ::-webkit-scrollbar-thumb { background: #4b5563; border-radius: 4px; }
            ::-webkit-scrollbar-thumb:hover { background: #6b7280; }
            .overlay-panel { transition: opacity 0.2s ease-in-out, transform 0.2s ease-in-out; }
        `;
        document.head.appendChild(style);

        const dataSource = document.getElementById('game-state-data');
        if (!dataSource) throw new Error('game-state-data element not found.');
        
        const gameData = parseCsvData(dataSource.textContent);

        // 1턴(캐릭터 선택)인지, 2턴 이후(HUD)인지 판별
        console.log('파싱된 게임 데이터:', gameData);
        if (gameData.destiny_characters && Object.keys(gameData.destiny_characters).length > 0) {
            console.log('운명의 부름 UI 초기화');
            initializeDestinyUI(gameData);
        } else {
            console.log('HUD UI 초기화');
            initializeHudUI(gameData);
        }

    } catch (error) {
        console.error("Error during initialization:", error);
        document.body.innerHTML = `<div class="text-red-400 p-8">An error occurred while rendering data: ${error.message}</div>`;
    }
});
