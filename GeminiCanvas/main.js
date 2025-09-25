// --- 유틸리티 함수 ---
/**
 * 지정된 태그와 클래스로 DOM 요소를 생성하는 헬퍼 함수
 * @param {string} tag - 생성할 HTML 태그 이름
 * @param {string} classes - 적용할 Tailwind CSS 클래스
 * @param {string} text - 요소에 추가할 텍스트 (옵션)
 * @returns {HTMLElement} 생성된 DOM 요소
 */
const createElement = (tag, classes = '', text = '') => {
    const element = document.createElement(tag);
    if (classes) element.className = classes;
    if (text) element.textContent = text;
    return element;
};

// 등급에 따른 텍스트 색상을 반환하는 함수
const getGradeColor = (grade) => {
    switch (grade) {
        case '전설': return 'text-yellow-400';
        case '영웅': return 'text-purple-400';
        case '희귀': return 'text-blue-400';
        default: return 'text-gray-400';
    }
};

// --- UI 렌더링 함수들 ---

/**
 * 플레이어 상태 바(HP, MP, EXP)를 렌더링하는 함수
 * @param {string} label - 바의 이름 (HP, MP 등)
 * @param {number} current - 현재 값
 * @param {number} max - 최대 값
 * @param {string} colorClass - 바의 색상 클래스
 * @returns {HTMLElement} 생성된 상태 바 요소
 */
const renderStatBar = (label, current, max, colorClass) => {
    const percentage = max > 0 ? (current / max) * 100 : 0;
    const container = createElement('div');
    
    const labelDiv = createElement('div', 'flex justify-between items-center text-sm mb-1');
    labelDiv.appendChild(createElement('span', 'font-semibold', label));
    labelDiv.appendChild(createElement('span', 'text-gray-400', `${current} / ${max}`));
    
    const barBg = createElement('div', 'w-full bg-gray-700 rounded-full h-2.5');
    const barFg = createElement('div', `h-2.5 rounded-full ${colorClass}`);
    barFg.style.width = `${percentage}%`;
    
    barBg.appendChild(barFg);
    container.appendChild(labelDiv);
    container.appendChild(barBg);

    return container;
};

/**
 * HUD의 각 섹션(카드)을 렌더링하는 함수
 * @param {string} title - 섹션 제목
 * @param {HTMLElement[]} children - 섹션에 포함될 자식 요소들
 * @returns {HTMLElement} 생성된 섹션 카드 요소
 */
const renderHUDCard = (title, children) => {
    const card = createElement('div', 'bg-black/30 backdrop-blur-sm p-4 rounded-lg border border-gray-700');
    const cardTitle = createElement('h3', 'text-lg font-bold text-cyan-300 border-b border-gray-600 pb-2 mb-3', title);
    const content = createElement('div', 'space-y-3');
    
    children.forEach(child => content.appendChild(child));
    
    card.appendChild(cardTitle);
    card.appendChild(content);
    return card;
};

/**
 * 전체 HUD UI를 렌더링하는 메인 함수
 * @param {object} data - 게임 데이터
 * @returns {HTMLElement} 생성된 HUD 요소
 */
const renderHUD = (data) => {
    const hudContainer = document.getElementById('hud-container');
    hudContainer.innerHTML = ''; // 기존 HUD 내용 초기화

    const { player, inventory, skills, quests } = data;

    // 1. 캐릭터 정보 카드
    const playerInfoCard = renderHUDCard('👤 캐릭터', [
        (() => {
            const container = createElement('div', 'text-center');
            container.appendChild(createElement('h2', 'text-2xl font-bold', player.name));
            container.appendChild(createElement('p', 'text-cyan-400', player.title));
            container.appendChild(createElement('p', 'text-sm text-gray-400 mt-1', `Lv.${player.level}`));
            return container;
        })(),
        renderStatBar('HP', player.hp, player.maxHp, 'bg-red-500'),
        renderStatBar('MP', player.mp, player.maxMp, 'bg-blue-500'),
        renderStatBar('EXP', player.exp, player.maxExp, 'bg-yellow-500'),
    ]);
    
    // 2. 소지품 카드
    const inventoryCard = renderHUDCard('🎒 소지품', inventory.map(item => {
        const itemDiv = createElement('div', 'flex justify-between items-center text-sm');
        const nameSpan = createElement('span', '', `${item.name} (${item.quantity})`);
        const gradeSpan = createElement('span', `font-semibold ${getGradeColor(item.grade)}`, item.grade);
        itemDiv.append(nameSpan, gradeSpan);
        return itemDiv;
    }));

    // 3. 스킬 카드
    const skillsCard = renderHUDCard('✨ 스킬', skills.map(skill => {
        const skillDiv = createElement('div', 'flex justify-between items-center text-sm');
        skillDiv.appendChild(createElement('span', '', `Lv.${skill.level} ${skill.name}`));
        skillDiv.appendChild(createElement('span', 'text-blue-400', `MP ${skill.cost}`));
        return skillDiv;
    }));
    
    // 4. 퀘스트 카드
    const questsCard = renderHUDCard('📜 퀘스트', quests.map(quest => {
        const questDiv = createElement('div', 'text-sm');
        questDiv.appendChild(createElement('p', 'font-semibold', quest.name));
        questDiv.appendChild(createElement('p', 'text-gray-400 pl-2', `- ${quest.progress}`));
        return questDiv;
    }));

    hudContainer.append(playerInfoCard, inventoryCard, skillsCard, questsCard);
};

/**
 * 우측 콘텐츠 영역(이미지, 서사)을 렌더링하는 함수
 * @param {object} data - 게임 데이터
 */
const renderContent = (data) => {
    const contentContainer = document.getElementById('content-container');
    contentContainer.innerHTML = ''; // 기존 콘텐츠 초기화

    const { image, narration } = data.story;

    const imageElement = createElement('img', 'w-full h-auto object-cover rounded-lg shadow-lg');
    imageElement.src = image;
    imageElement.alt = "게임 장면";

    const narrationElement = createElement('p', 'mt-6 text-lg text-gray-300 leading-relaxed bg-black/50 p-6 rounded-lg backdrop-blur-sm border border-gray-700', narration);
    
    contentContainer.append(imageElement, narrationElement);
};

/**
 * 애플리케이션의 기본 레이아웃을 초기화하는 함수
 */
const initializeLayout = () => {
    const appRoot = document.getElementById('app-root');
    appRoot.innerHTML = ''; // 초기화

    const mainContainer = createElement('div', 'flex h-screen');
    
    // 좌측 HUD (고정폭)
    const hud = createElement('aside', 'w-96 flex-shrink-0 bg-black/30 p-4 space-y-4 overflow-y-auto border-r border-gray-700');
    hud.id = 'hud-container';
    
    // 우측 콘텐츠 (가변폭)
    const content = createElement('main', 'flex-grow p-6 overflow-y-auto');
    content.id = 'content-container';

    mainContainer.append(hud, content);
    appRoot.appendChild(mainContainer);
};

/**
 * LLM 데이터 소스를 읽어와 전체 UI를 업데이트하는 메인 함수
 */
function updateUIFromLLM() {
    try {
        const dataSource = document.getElementById('llm-data-source');
        const gameData = JSON.parse(dataSource.textContent);
        renderHUD(gameData);
        renderContent(gameData);
    } catch (error) {
        console.error("LLM 데이터 파싱 또는 UI 렌더링 중 오류 발생:", error);
        const contentContainer = document.getElementById('content-container');
        if (contentContainer) {
            contentContainer.innerHTML = `<div class="text-red-400">데이터 처리 중 오류가 발생했습니다.</div>`;
        }
    }
}

// --- 애플리케이션 시작 ---
// DOMContentLoaded 이벤트는 HTML 문서가 완전히 로드되고 파싱되었을 때 발생합니다.
// 이렇게 하면 스크립트가 DOM 요소를 안전하게 조작할 수 있습니다.
document.addEventListener('DOMContentLoaded', () => {
    initializeLayout();
    updateUIFromLLM();
});
