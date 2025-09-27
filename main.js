        // --- CSV 데이터 파서 ---
        const parseCsvData = (csvText) => {
            const data = {
                genre: '',
                description: '',
                internal_data: { game_options: {} },
                character_stats: {
                    name: '', age: 0, level: 0, class: '', title: '',
                    xp: { current: 0, max: 100 },
                    resources: [],
                    reputation_stats: [],
                    attributes: {},
                    equipment: {}
                },
                inventory: [],
                skills: [],
                information_panel: [],
                image: ''
            };

            if (!csvText) return data;

            const lines = csvText.trim().split('\n').filter(line => line.trim() !== '');

            for (const line of lines) {
                const parts = line.trim().split(';');
                const key = parts[0];
                const values = parts.slice(1);

                switch (key) {
                    case 'gen': data.genre = values[0]; break;
                    case 'dsc': data.description = values[0]; break;
                    case 'trt':
                        const traitType = values[2] === 'pos' ? 'buff' : 'debuff';
                        data.information_panel.push([traitType, values[0], '특성', values[1]]);
                        break;
                    case 'opt':
                        data.internal_data.game_options[values[0]] = (values[1] === '1');
                        break;
                    case 'chr':
                        data.character_stats[values[0]] = isNaN(values[1]) ? values[1] : Number(values[1]);
                        break;
                    case 'xp':
                        data.character_stats.xp = { current: Number(values[0]), max: Number(values[1]) };
                        break;
                    case 'res':
                        data.character_stats.resources.push({ name: values[0], current: Number(values[1]), max: Number(values[2]), color: values[3] });
                        break;
                    case 'rep':
                        if (!data.character_stats.reputation_stats) data.character_stats.reputation_stats = [];
                        data.character_stats.reputation_stats.push({ name: values[0], value: Number(values[1]) });
                        break;
                    case 'atr':
                        data.character_stats.attributes[values[0]] = Number(values[1]);
                        break;
                    case 'eqp':
                        data.character_stats.equipment[values[0]] = values[1] || '';
                        break;
                    case 'inf':
                        data.information_panel.push(values);
                        break;
                    case 'inv':
                        data.inventory.push(values);
                        break;
                    case 'skl':
                        data.skills.push(values);
                        break;
                    case 'img':
                        data.image = values[0];
                        break;
                }
            }
            return data;
        };

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

        // --- 오버레이 패널 관리 ---
        const showOverlayPanel = (type, data, options = {}) => {
            hideOverlayPanel(); 

            const contentContainer = document.getElementById('content-container');
            if (!contentContainer) return;

            const isModal = window.innerWidth < 1024;
            const overlayClasses = isModal
                ? 'overlay-panel fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50'
                : 'overlay-panel absolute inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-8';
            
            const overlay = createElement('div', `${overlayClasses} opacity-0 transform scale-95`);
            overlay.id = 'active-overlay';

            const panel = createElement('div', 'w-full max-w-2xl bg-gray-800 border border-gray-600 rounded-lg shadow-xl p-6');
            
            // --- 공통 패널 헤더 (닫기 버튼 포함) ---
            const createPanelHeader = (title) => {
                const panelHeader = createElement('div', 'flex items-center justify-between border-b border-gray-600 pb-3 mb-4');
                panelHeader.appendChild(createElement('h2', 'text-2xl font-bold text-cyan-300', title));
                
                const closeBtn = createElement('button', 'text-gray-400 hover:text-white transition-colors');
                closeBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>`;
                closeBtn.setAttribute('aria-label', 'Close panel');
                closeBtn.addEventListener('click', hideOverlayPanel);
                panelHeader.appendChild(closeBtn);
                
                return panelHeader;
            };

            let contentRendered = false;

            switch (type) {
                case 'character':
                    panel.innerHTML = ''; 
                    panel.appendChild(createPanelHeader('캐릭터 정보'));

                    const mainGrid = createElement('div', 'grid grid-cols-1 md:grid-cols-5 gap-6 pt-2');
                    const leftCol = createElement('div', 'md:col-span-3 space-y-6');
                    const rightCol = createElement('div', 'md:col-span-2 space-y-6');
                    
                    // --- 좌측 컬럼 ---
                    const profileSection = createElement('div');
                    profileSection.appendChild(createElement('h3', 'text-lg font-semibold text-cyan-400 mb-2', '프로필'));
                    const profileList = createElement('ul', 'space-y-1.5 text-sm');
                    const createProfileItem = (label, value) => {
                        const item = createElement('li', 'flex justify-between items-center');
                        item.innerHTML = `<span class="font-semibold text-gray-400">${label}</span> <span class="font-mono text-gray-200">${value}</span>`;
                        return item;
                    };

                    if (options.use_level) {
                        profileList.appendChild(createProfileItem('레벨', data.level));
                        profileList.appendChild(createProfileItem('경험치', `${data.xp.current} / ${data.xp.max} XP`));
                    }
                    profileList.appendChild(createProfileItem('나이', data.age));
                    profileList.appendChild(createProfileItem('클래스', data.class));
                    profileList.appendChild(createProfileItem('칭호', data.title));
                    if (options.rep && data.reputation_stats) {
                        data.reputation_stats.forEach(stat => {
                            profileList.appendChild(createProfileItem(stat.name, stat.value));
                        });
                    }
                    profileSection.appendChild(profileList);
                    leftCol.appendChild(profileSection);

                    const attrSection = createElement('div');
                    attrSection.appendChild(createElement('h3', 'text-lg font-semibold text-cyan-400 mb-2', '능력치'));
                    const attrGrid = createElement('div', 'grid grid-cols-3 gap-x-4 gap-y-2');
                    Object.entries(data.attributes).forEach(([key, value]) => {
                        const attrItem = createElement('div', 'bg-black/20 p-2 rounded-md text-center');
                        attrItem.appendChild(createElement('p', 'text-xs text-gray-400', key));
                        attrItem.appendChild(createElement('p', 'text-lg font-bold font-mono', value));
                        attrGrid.appendChild(attrItem);
                    });
                    attrSection.appendChild(attrGrid);
                    leftCol.appendChild(attrSection);
                    
                    // --- 우측 컬럼 ---
                    if (options.use_equipment) {
                        const equipSection = createElement('div');
                        equipSection.appendChild(createElement('h3', 'text-lg font-semibold text-cyan-400 mb-2', '장비'));
                        const equipList = createElement('ul', 'space-y-2');
                        Object.entries(data.equipment).forEach(([key, value]) => {
                            const item = createElement('li', 'flex items-center justify-between bg-black/20 p-2 rounded-md');
                            item.appendChild(createElement('span', 'text-sm font-semibold text-gray-400', key));
                            item.appendChild(createElement('span', 'text-sm font-mono text-right', value || '없음'));
                            equipList.appendChild(item);
                        });
                        equipSection.appendChild(equipList);
                        rightCol.appendChild(equipSection);
                    }
                    
                    mainGrid.append(leftCol, rightCol);
                    panel.appendChild(mainGrid);

                    contentRendered = true;
                    break;
                case 'inventory':
                    panel.appendChild(createPanelHeader('소지품'));
                    const invList = createElement('ul', 'space-y-3 max-h-[80vh] overflow-y-auto');
                    data.forEach(item => {
                        const li = createElement('li', 'p-3 bg-black/30 rounded-md border border-gray-700');
                        const header = createElement('div', 'flex justify-between items-center');
                        // 화폐 타입일 경우와 아닐 경우를 분기하여 수량 표시를 더 안정적으로 처리
                        const nameText = (item[1] === '화폐') 
                            ? `${item[0]} (x${item[2]})`
                            : `${item[0]} (x${item[2] || 1})`;
                        header.appendChild(createElement('span', 'font-bold', nameText));
                        header.appendChild(createElement('span', `font-semibold ${getGradeColor(item[1])}`, item[1]));
                        const desc = createElement('p', 'text-sm text-gray-400 mt-1', item[3]);
                        li.append(header, desc);
                        invList.appendChild(li);
                    });
                    panel.appendChild(invList);
                    contentRendered = true;
                    break;
                case 'skills':
                    panel.appendChild(createPanelHeader('스킬'));
                    const skillList = createElement('ul', 'space-y-3 max-h-[80vh] overflow-y-auto');
                    // CSV: [name, level, current_xp, max_xp, cost, description]
                    data.forEach(skill => {
                        const li = createElement('li', 'p-3 bg-black/30 rounded-md border border-gray-700');
                        const header = createElement('div', 'flex justify-between items-center');
                        header.appendChild(createElement('span', 'font-bold', `${skill[0]} (Lv.${skill[1]})`));
                        header.appendChild(createElement('span', 'text-blue-400', skill[4]));
                        
                        const desc = createElement('p', 'text-sm text-gray-400 mt-1', skill[5]);
                        
                        const xpContainer = createElement('div', 'mt-2');
                        const xpPercentage = skill[3] > 0 ? (skill[2] / skill[3]) * 100 : 0;
                        const xpBarBg = createElement('div', 'w-full bg-gray-700 rounded-full h-1.5');
                        const xpBarFg = createElement('div', `h-1.5 rounded-full bg-purple-500`);
                        xpBarFg.style.width = `${xpPercentage}%`;
                        xpBarBg.appendChild(xpBarFg);
                        xpContainer.appendChild(xpBarBg);

                        li.append(header, desc, xpContainer);
                        skillList.appendChild(li);
                    });
                    panel.appendChild(skillList);
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
                setTimeout(() => {
                    if (overlay.parentNode) {
                        overlay.remove();
                    }
                }, 200); // CSS transition duration과 일치해야 함
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
                const gameData = parseCsvData(dataSource.textContent);
                
                initializeLayout();
                renderHUD(gameData);
                renderContent(gameData);
            } catch (error) {
                console.error("오류 발생:", error);
                document.body.innerHTML = `<div class="text-red-400 p-8">데이터 처리 중 오류가 발생했습니다: ${error.message}</div>`;
            }
        });
