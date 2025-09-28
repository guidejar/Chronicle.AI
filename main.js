        // 모듈 임포트
        import { parseCsvData } from './parser.js';
        import { showOverlayPanel, hideOverlayPanel } from './modal.js';

        const createElement = (tag, classes = '', text = '') => {
            const element = document.createElement(tag);
            if (classes) element.className = classes;
            if (text) element.textContent = text;
            return element;
        };

        const getGradeColor = (grade) => {
            const colors = { '전설': 'text-yellow-400', '화폐': 'text-yellow-400', '상급': 'text-purple-400', '중급': 'text-blue-400', '하급': 'text-gray-400' };
            return colors[grade] || 'text-gray-400';
        };

        const getTypeColor = (type) => {
            const colors = { 'buff': 'text-green-400', 'debuff': 'text-red-400' };
            return colors[type] || 'text-white';
        }


        // --- HUD 렌더링 함수들 ---
        const renderStatBar = (label, current, max, colorClass) => {
            const percentage = max > 0 ? (current / max) * 100 : 0;
            const container = createElement('div');
            const labelDiv = createElement('div', 'flex justify-between items-baseline text-xs mb-1');
            labelDiv.innerHTML = `<span class="font-semibold">${label}</span> <span class="font-mono">${current}/${max}</span>`;
            const barBg = createElement('div', 'w-full bg-gray-700 rounded-full h-2');
            const barFg = createElement('div', `h-2 rounded-full ${colorClass}`);
            barFg.style.width = `${percentage}%`;
            barBg.appendChild(barFg);
            container.append(labelDiv, barBg);
            return container;
        };

        const renderCharacterUI = (data) => {
            const { character_stats: stats, internal_data: { game_options: options } } = data;
            const card = createElement('div', 'bg-black/30 p-4 rounded-lg border border-gray-700');
            
            const header = createElement('div', 'text-center mb-3 relative p-2 -m-2 rounded-lg cursor-pointer hover:bg-white/5 transition-colors');
            header.setAttribute('aria-label', '상세 정보 보기');
            header.addEventListener('click', () => showOverlayPanel('character', stats, options));

            const nameContainer = createElement('div', 'flex justify-center items-baseline gap-2');
            nameContainer.appendChild(createElement('h2', 'text-xl font-bold', stats.name));
            if (options.use_level) {
                nameContainer.appendChild(createElement('span', 'text-sm font-mono text-gray-400', `Lv. ${stats.level}`));
            }
            header.appendChild(nameContainer);

            const detailIcon = createElement('div', 'absolute top-1 right-1 text-gray-400');
            detailIcon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clip-rule="evenodd" /></svg>`;
            header.appendChild(detailIcon);

            const bars = createElement('div', 'space-y-2');
            if (stats.resources) {
                stats.resources.forEach(resource => {
                    bars.appendChild(renderStatBar(resource.name, resource.current, resource.max, resource.color));
                });
            }
            
            card.append(header, bars);
            return card;
        };

        const renderActionButtons = (inventory, skills) => {
            const container = createElement('div', 'grid grid-cols-2 gap-2');
            
            const inventoryBtn = createElement('button', 'w-full text-sm py-2 bg-gray-700 hover:bg-gray-600 rounded-md transition-colors', '🎒 아이템');
            inventoryBtn.addEventListener('click', () => showOverlayPanel('inventory', inventory));

            const skillsBtn = createElement('button', 'w-full text-sm py-2 bg-gray-700 hover:bg-gray-600 rounded-md transition-colors', '✨ 스킬');
            skillsBtn.addEventListener('click', () => showOverlayPanel('skills', skills));

            container.append(inventoryBtn, skillsBtn);
            return container;
        };
        
        const renderInfoPanel = (items) => {
            const card = createElement('div', 'bg-black/30 p-4 rounded-lg border border-gray-700 flex-grow flex flex-col');
            const content = createElement('div', 'space-y-3 text-sm overflow-y-auto');
            
            // CSV: [type, emoji_and_name, details, description]
            items.forEach(item => {
                const itemDiv = createElement('div');
                const header = createElement('div', 'flex justify-between items-baseline');
                
                const nameSpan = createElement('span', `font-bold ${getTypeColor(item[0])}`, item[1]);
                header.appendChild(nameSpan);
                header.appendChild(createElement('span', 'text-gray-400 font-mono', item[2]));

                const desc = createElement('p', 'text-gray-300 pl-2', item[3]);
                itemDiv.append(header, desc);
                content.appendChild(itemDiv);
            });

            card.appendChild(content);
            return card;
        };

        const renderHUD = (data) => {
            const hudContainer = document.getElementById('hud-container');
            if (!hudContainer) return;
            hudContainer.innerHTML = '';
            
            hudContainer.appendChild(renderCharacterUI(data));
            hudContainer.appendChild(renderActionButtons(data.inventory, data.skills));
            hudContainer.appendChild(renderInfoPanel(data.information_panel));
        };

        const renderContent = (data) => {
            const contentContainer = document.getElementById('content-container');
            if (!contentContainer || !data.image) return;
            contentContainer.innerHTML = '';

            const image = createElement('img', 'absolute inset-0 w-full h-full object-cover');
            image.src = data.image;
            image.alt = "게임 장면";
            
            contentContainer.appendChild(image);
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

        const initializeLayout = () => {
            // app-root 생성
            let appRoot = document.getElementById('app-root');
            if (!appRoot) {
                appRoot = createElement('div');
                appRoot.id = 'app-root';
                document.body.appendChild(appRoot);
            }

            if (appRoot.childElementCount > 0) return;

            const mainContainer = createElement('div', 'flex h-screen');
            const hud = createElement('aside', 'w-80 flex-shrink-0 bg-black/30 p-4 flex flex-col gap-4 border-r border-gray-700 z-10');
            hud.id = 'hud-container';

            const content = createElement('main', 'flex-grow relative');
            content.id = 'content-container';

            mainContainer.append(hud, content);
            appRoot.appendChild(mainContainer);
        };

        document.addEventListener('DOMContentLoaded', () => {
            try {
                initializeStyles();

                const dataSource = document.getElementById('llm-data-source');
                const gameData = parseCsvData(dataSource.textContent);

                initializeLayout();
                renderHUD(gameData);
                renderContent(gameData);
            } catch (error) {
                console.error("오류 발생:", error);
                document.body.innerHTML = `<div class="text-red-400 p-8">데이터 처리 중 오류가 발생했습니다: ${error.message}</div>`;
            }
        });
