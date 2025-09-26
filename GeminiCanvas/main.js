        // --- 유틸리티 함수 ---
        const createElement = (tag, classes = '', text = '') => {
            const element = document.createElement(tag);
            if (classes) element.className = classes;
            if (text) element.textContent = text;
            return element;
        };

        const getGradeColor = (grade) => {
            const colors = { '전설': 'text-yellow-400', '상급': 'text-purple-400', '중급': 'text-blue-400', '하급': 'text-gray-400' };
            return colors[grade] || 'text-gray-400';
        };

        const getTypeColor = (type) => {
            const colors = { 'buff': 'text-green-400', 'debuff': 'text-red-400' };
            return colors[type] || 'text-white';
        }

        // --- 오버레이 패널 관리 ---
        const showOverlayPanel = (type, data) => {
            hideOverlayPanel(); 

            const contentContainer = document.getElementById('content-container');
            if (!contentContainer) return;

            const isModal = window.innerWidth < 1024;
            const overlayClasses = isModal
                ? 'overlay-panel fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50'
                : 'overlay-panel absolute inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-8';
            
            const overlay = createElement('div', `${overlayClasses} opacity-0 transform scale-95`);
            overlay.id = 'active-overlay';

            const panel = createElement('div', 'w-full max-w-md bg-gray-800 border border-gray-600 rounded-lg shadow-xl p-6');
            const list = createElement('ul', 'space-y-3 max-h-[80vh] overflow-y-auto');

            let contentRendered = false;

            switch (type) {
                case 'character':
                    const createProfileItem = (label, value) => {
                        const item = createElement('li', 'flex justify-between items-center text-sm');
                        item.innerHTML = `<span class="capitalize font-semibold text-gray-400">${label}</span> <span class="font-mono text-gray-200">${value}</span>`;
                        return item;
                    };

                    // 프로필 섹션
                    const profileTitle = createElement('h2', 'text-2xl font-bold text-cyan-300 border-b border-gray-600 pb-3 mb-4', '프로필');
                    const profileList = createElement('ul', 'space-y-2');
                    profileList.appendChild(createProfileItem('클래스', data.class));
                    profileList.appendChild(createProfileItem('칭호', data.title));
                    profileList.appendChild(createProfileItem('명성', data.reputation));
                    profileList.appendChild(createProfileItem('악명', data.notoriety));
                    panel.append(profileTitle, profileList);
                    
                    // 능력치 섹션
                    const attrTitle = createElement('h2', 'text-2xl font-bold text-cyan-300 border-b border-gray-600 pb-3 mb-4 mt-6', '능력치');
                    Object.entries(data.attributes).forEach(([key, value]) => {
                        const item = createElement('li', 'flex justify-between items-center');
                        item.innerHTML = `<span class="capitalize font-semibold">${key}</span> <span class="text-xl font-mono text-white">${value}</span>`;
                        list.appendChild(item);
                    });
                    panel.append(attrTitle, list);

                    // 장비 섹션
                    const equipTitle = createElement('h2', 'text-2xl font-bold text-cyan-300 border-b border-gray-600 pb-3 mb-4 mt-6', '장비');
                    const equipList = createElement('ul', 'space-y-2');
                     Object.entries(data.equipment).forEach(([key, value]) => {
                        const item = createElement('li', 'flex justify-between items-center text-sm');
                        item.innerHTML = `<span class="capitalize font-semibold text-gray-400">${key}</span> <span class="font-mono text-gray-200">${value || '없음'}</span>`;
                        equipList.appendChild(item);
                    });
                    panel.append(equipTitle, equipList);

                    contentRendered = true;
                    break;
                case 'inventory':
                    const invTitle = createElement('h2', 'text-2xl font-bold text-cyan-300 border-b border-gray-600 pb-3 mb-4', '소지품');
                    data.forEach(item => {
                        const li = createElement('li', 'p-3 bg-black/30 rounded-md border border-gray-700');
                        const header = createElement('div', 'flex justify-between items-center');
                        header.appendChild(createElement('span', 'font-bold', `${item[0]} (x${item[2]})`));
                        header.appendChild(createElement('span', `font-semibold ${getGradeColor(item[1])}`, item[1]));
                        const desc = createElement('p', 'text-sm text-gray-400 mt-1', item[3]);
                        li.append(header, desc);
                        list.appendChild(li);
                    });
                    panel.append(invTitle, list);
                    contentRendered = true;
                    break;
                case 'skills':
                    const skillTitle = createElement('h2', 'text-2xl font-bold text-cyan-300 border-b border-gray-600 pb-3 mb-4', '스킬');
                    data.forEach(skill => {
                        const li = createElement('li', 'p-3 bg-black/30 rounded-md border border-gray-700');
                        const header = createElement('div', 'flex justify-between items-center');
                        header.appendChild(createElement('span', 'font-bold', skill[0]));
                        header.appendChild(createElement('span', 'text-blue-400', skill[1]));
                        const desc = createElement('p', 'text-sm text-gray-400 mt-1', skill[2]);
                        li.append(header, desc);
                        list.appendChild(li);
                    });
                    panel.append(skillTitle, list);
                    contentRendered = true;
                    break;
            }

            if (contentRendered) {
                overlay.appendChild(panel);
                if (isModal) document.body.appendChild(overlay);
                else contentContainer.appendChild(overlay);
                
                overlay.addEventListener('click', (e) => {
                    if (e.target === overlay) hideOverlayPanel();
                });

                requestAnimationFrame(() => {
                    overlay.classList.remove('opacity-0', 'scale-95');
                });
            }
        };

        const hideOverlayPanel = () => {
            const overlay = document.getElementById('active-overlay');
            if (overlay) {
                overlay.classList.add('opacity-0', 'scale-95');
                overlay.addEventListener('transitionend', () => overlay.remove(), { once: true });
            }
        };


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

        const renderCharacterUI = (stats) => {
            const card = createElement('div', 'bg-black/30 p-4 rounded-lg border border-gray-700');
            
            const header = createElement('div', 'text-center mb-3 relative p-2 -m-2 rounded-lg cursor-pointer hover:bg-white/5 transition-colors');
            header.setAttribute('aria-label', '상세 정보 보기');
            header.addEventListener('click', () => showOverlayPanel('character', stats));

            header.appendChild(createElement('h2', 'text-xl font-bold', stats.name));

            const detailIcon = createElement('div', 'absolute top-1 right-1 text-gray-400');
            detailIcon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clip-rule="evenodd" /></svg>`;
            header.appendChild(detailIcon);

            const bars = createElement('div', 'space-y-2');
            bars.appendChild(renderStatBar('HP', stats.hp, stats.maxHp, 'bg-red-500'));
            bars.appendChild(renderStatBar('MP', stats.mp, stats.maxMp, 'bg-blue-500'));
            
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
            
            hudContainer.appendChild(renderCharacterUI(data.character_stats));
            hudContainer.appendChild(renderActionButtons(data.inventory, data.skills));
            hudContainer.appendChild(renderInfoPanel(data.information_panel));
        };

        const renderContent = (data) => {
            const contentContainer = document.getElementById('content-container');
            if (!contentContainer || !data.story) return;
            contentContainer.innerHTML = '';

            const image = createElement('img', 'absolute inset-0 w-full h-full object-cover');
            image.src = data.story.image;
            image.alt = "게임 장면";
            
            contentContainer.appendChild(image);
        };

        // --- 애플리케이션 초기화 ---
        const initializeLayout = () => {
            const appRoot = document.getElementById('app-root');
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
                const dataSource = document.getElementById('llm-data-source');
                const gameData = JSON.parse(dataSource.textContent);
                
                initializeLayout();
                renderHUD(gameData);
                renderContent(gameData);
            } catch (error) {
                console.error("오류 발생:", error);
                document.body.innerHTML = `<div class="text-red-400 p-8">데이터 처리 중 오류가 발생했습니다.</div>`;
            }
        });
