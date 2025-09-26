// --- 유틸리티 함수 ---
/**
 * 지정된 태그와 클래스, 텍스트로 DOM 요소를 생성하는 헬퍼 함수
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

// 힌트 타입에 따라 아이콘을 반환하는 함수
const getHintIcon = (type) => {
    switch (type) {
        case 'player': return '👤';
        case 'item': return '🎒';
        case 'location': return '🗺️';
        case 'objective': return '🎯';
        default: return '💡';
    }
};


// --- UI 렌더링 함수들 ---

/**
 * 좌측 힌트 패널을 렌더링하는 함수
 * @param {object} data - 게임 데이터
 */
const renderHintPanel = (data) => {
    const hintContainer = document.getElementById('hint-panel-container');
    hintContainer.innerHTML = ''; // 기존 내용 초기화

    const { hints, story } = data;

    // 1. 서사(Narration) 카드
    const narrationCard = createElement('div', 'bg-black/30 p-4 rounded-lg border border-gray-700');
    narrationCard.appendChild(createElement('h3', 'text-lg font-bold text-cyan-300 border-b border-gray-600 pb-2 mb-3', '📜 현재 상황'));
    narrationCard.appendChild(createElement('p', 'text-gray-300 leading-relaxed', story.narration));
    
    // 2. 힌트 카드
    const hintCard = createElement('div', 'bg-black/30 p-4 rounded-lg border border-gray-700');
    hintCard.appendChild(createElement('h3', 'text-lg font-bold text-cyan-300 border-b border-gray-600 pb-2 mb-3', '💡 주요 정보'));
    const hintList = createElement('ul', 'space-y-2');
    
    hints.forEach(hint => {
        const listItem = createElement('li', 'flex items-start');
        const icon = createElement('span', 'mr-2', getHintIcon(hint.type));
        const content = createElement('span', 'text-gray-300', hint.content);
        listItem.append(icon, content);
        hintList.appendChild(listItem);
    });
    
    hintCard.appendChild(hintList);
    hintContainer.append(narrationCard, hintCard);
};

/**
 * 우측 이미지 패널을 렌더링하는 함수
 * @param {object} data - 게임 데이터
 */
const renderImagePanel = (data) => {
    const imageContainer = document.getElementById('image-panel-container');
    imageContainer.innerHTML = ''; // 기존 내용 초기화

    const { image } = data.story;

    const imageElement = createElement('img', 'w-full h-full object-contain mx-auto');
    imageElement.src = image;
    imageElement.alt = "게임 장면";

    imageContainer.appendChild(imageElement);
};

/**
 * 애플리케이션의 기본 레이아웃을 초기화하는 함수
 */
const initializeLayout = () => {
    const appRoot = document.getElementById('app-root');
    appRoot.innerHTML = ''; // 초기화

    const mainContainer = createElement('div', 'flex h-screen');
    
    // 좌측 힌트 패널 (고정폭)
    const hintPanel = createElement('aside', 'w-96 flex-shrink-0 bg-black/30 p-4 space-y-4 overflow-y-auto border-r border-gray-700');
    hintPanel.id = 'hint-panel-container';
    
    // 우측 이미지 패널 (가변폭)
    const imagePanel = createElement('main', 'flex-grow p-6 flex items-center justify-center overflow-y-auto');
    imagePanel.id = 'image-panel-container';

    mainContainer.append(hintPanel, imagePanel);
    appRoot.appendChild(mainContainer);
};

/**
 * LLM 데이터 소스를 읽어와 전체 UI를 업데이트하는 메인 함수
 */
function updateUIFromLLM() {
    try {
        const dataSource = document.getElementById('llm-data-source');
        const gameData = JSON.parse(dataSource.textContent);
        renderHintPanel(gameData);
        renderImagePanel(gameData);
    } catch (error) {
        console.error("LLM 데이터 파싱 또는 UI 렌더링 중 오류 발생:", error);
        const appRoot = document.getElementById('app-root');
        appRoot.innerHTML = `<div class="text-red-400 p-8">데이터 처리 중 오류가 발생했습니다.</div>`;
    }
}

// --- 애플리케이션 시작 ---
document.addEventListener('DOMContentLoaded', () => {
    initializeLayout();
    updateUIFromLLM();
});
