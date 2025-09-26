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

/**
 * 장르 정보 섹션을 렌더링하는 함수
 * @param {object} genreData - 장르 데이터
 * @returns {HTMLElement} 생성된 장르 섹션 요소
 */
const renderGenreSection = (genreData) => {
    const section = createElement('div');
    const title = createElement('h2', 'text-2xl font-bold text-cyan-300 border-b-2 border-cyan-500 pb-2 mb-3', `📜 장르 설정`);
    const genreName = createElement('p', 'text-xl font-semibold', genreData.title);
    const genreDesc = createElement('p', 'text-gray-400 mt-1', genreData.description);
    
    section.append(title, genreName, genreDesc);
    return section;
};

/**
 * 주인공 정보 섹션을 렌더링하는 함수
 * @param {object} profileData - 주인공 프로필 데이터
 * @returns {HTMLElement} 생성된 주인공 정보 섹션 요소
 */
const renderProfileSection = (profileData) => {
    const section = createElement('div');
    const title = createElement('h2', 'text-2xl font-bold text-cyan-300 border-b-2 border-cyan-500 pb-2 mb-4 mt-6', `👤 주인공 정보`);
    
    const name = createElement('p', 'text-xl font-semibold', profileData.name);
    const background = createElement('p', 'text-gray-400 mt-1 mb-4', profileData.background);

    // 강점 카드
    const strengthCard = createElement('div', 'bg-blue-900/30 p-4 rounded-lg border border-blue-500');
    const strengthTitle = createElement('h3', 'font-bold text-blue-300', `👍 강점: ${profileData.strength.name}`);
    const strengthDesc = createElement('p', 'text-gray-300 text-sm mt-1', profileData.strength.description);
    strengthCard.append(strengthTitle, strengthDesc);

    // 약점 카드
    const weaknessCard = createElement('div', 'bg-red-900/30 p-4 rounded-lg border border-red-500 mt-3');
    const weaknessTitle = createElement('h3', 'font-bold text-red-300', `👎 약점: ${profileData.weakness.name}`);
    const weaknessDesc = createElement('p', 'text-gray-300 text-sm mt-1', profileData.weakness.description);
    weaknessCard.append(weaknessTitle, weaknessDesc);

    section.append(title, name, background, strengthCard, weaknessCard);
    return section;
};

/**
 * LLM 데이터 소스를 읽어와 설정 UI를 생성하는 메인 함수
 */
const initializeSetupUI = () => {
    try {
        const appRoot = document.getElementById('app-root');
        const dataSource = document.getElementById('llm-data-source');
        const setupData = JSON.parse(dataSource.textContent);

        appRoot.innerHTML = ''; // 기존 내용 초기화

        const mainCard = createElement('div', 'w-full max-w-2xl bg-gray-800/80 backdrop-blur-sm p-8 rounded-xl border border-gray-700 card-glow');
        
        const genreSection = renderGenreSection(setupData.genre);
        const profileSection = renderProfileSection(setupData.profile);
        
        const divider = createElement('hr', 'border-gray-600 my-6');

        mainCard.append(genreSection, divider, profileSection);
        appRoot.appendChild(mainCard);

    } catch (error) {
        console.error("설정 데이터 파싱 또는 UI 렌더링 중 오류 발생:", error);
        const appRoot = document.getElementById('app-root');
        appRoot.textContent = '오류: 게임 설정을 불러올 수 없습니다.';
    }
};

// --- 애플리케이션 시작 ---
document.addEventListener('DOMContentLoaded', () => {
    initializeSetupUI();
});
