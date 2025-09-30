// 모달 및 오버레이 패널 관리 모듈
const createElement = (tag, classes = '', text = '') => {
    const element = document.createElement(tag);
    if (classes) element.className = classes;
    if (text) element.textContent = text;
    return element;
};

const getGradeColor = (grade) => {
    const colors = { '전설': 'text-yellow-400', '화폐': 'text-yellow-300', '상급': 'text-purple-400', '중급': 'text-blue-400', '보통': 'text-gray-400' };
    return colors[grade] || 'text-gray-400';
};

const getTypeColor = (type) => {
    const colors = { 'pos': 'text-green-400', 'neg': 'text-red-400', 'buff': 'text-green-400', 'debuff': 'text-red-400' };
    return colors[type] || 'text-white';
};

export const showOverlayPanel = (type, data) => {
    console.log('showOverlayPanel 호출됨:', type, data);
    hideOverlayPanel();

    const contentContainer = document.getElementById('content-container') || document.body;

    const isModal = window.innerWidth < 1024 || contentContainer === document.body;
    const overlayClasses = isModal
        ? 'overlay-panel fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50'
        : 'overlay-panel absolute inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-8';

    const overlay = createElement('div', `${overlayClasses} opacity-0 transform scale-95`);
    overlay.id = 'active-overlay';

    const panel = createElement('div', 'w-full max-w-xl h-[90vh] bg-gray-800 border border-gray-600 rounded-lg shadow-xl p-4 flex flex-col');

    const createPanelHeader = (title, includeFilter = false, onFilterToggle = null) => {
        const header = createElement('div', 'flex-shrink-0 flex items-center justify-between border-b border-gray-600 pb-2 mb-3');
        const titleWrapper = createElement('div', 'flex items-center');
        titleWrapper.appendChild(createElement('h2', 'text-2xl font-bold text-cyan-300', title));

        if (includeFilter) {
            const filterBtn = createElement('button', 'ml-3 text-xl p-1 rounded-md hover:bg-yellow-500/20 transition-colors', '🪙');
            filterBtn.onclick = onFilterToggle;
            titleWrapper.appendChild(filterBtn);
        }

        const closeBtn = createElement('button', 'text-gray-400 hover:text-white transition-colors');
        closeBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>`;
        closeBtn.onclick = hideOverlayPanel;

        header.append(titleWrapper, closeBtn);
        return header;
    };

    let contentRendered = false;

    switch (type) {
        case 'character':
            panel.appendChild(createPanelHeader(data.name));
            const mainGrid = createElement('div', 'grid grid-cols-2 gap-4 mt-2 flex-grow min-h-0');
            const leftCol = createElement('div', 'flex flex-col gap-4 overflow-y-auto');
            const profileList = createElement('ul', 'space-y-1.5 text-sm bg-black/20 p-3 rounded-md');
            const createProfileItem = (label, value) => {
                if (!value) return null;
                const item = createElement('li', 'flex justify-between items-start border-b border-gray-700/50 py-1.5');
                item.innerHTML = `<span class="font-semibold text-gray-400 flex-shrink-0 pr-2">${label}</span> <span class="text-right text-gray-200">${value}</span>`;
                return item;
            };
            ['class', 'title', 'gender', 'age'].forEach(key => {
                const label = { age: '나이', class: '클래스', title: '칭호', gender: '성별' }[key] || key;
                const item = createProfileItem(label, data[key]);
                if(item) profileList.appendChild(item);
            });
            if (data.background) {
                const bgItem = createElement('li', 'flex flex-col pt-2');
                bgItem.innerHTML = `<span class="font-semibold text-gray-400 mb-1">배경</span> <p class="text-sm text-gray-300 leading-relaxed">${data.background}</p>`;
                profileList.appendChild(bgItem);
            }
            leftCol.appendChild(profileList);
            if (data.traits && data.traits.length > 0) {
                const traitList = createElement('ul', 'space-y-2');
                data.traits.forEach(trait => {
                    const item = createElement('li', 'bg-black/20 p-3 rounded-md');
                    item.append(
                        createElement('span', `font-bold text-base ${getTypeColor(trait.type)}`, trait.name),
                        createElement('p', 'text-sm text-gray-400 mt-1', trait.desc)
                    );
                    traitList.appendChild(item);
                });
                leftCol.appendChild(traitList);
            }
            const rightCol = createElement('div', 'flex flex-col gap-4 overflow-y-auto');
            const attrGrid = createElement('div', 'grid grid-cols-2 gap-2');
            const attrMap = { 'str': '힘', 'dex': '민첩', 'int': '지성', 'wis': '지혜', 'cha': '카리스마', 'vit': '활력' };
            Object.entries(attrMap).forEach(([key, label]) => {
                const attrItem = createElement('div', 'bg-black/20 p-2 rounded-md text-center');
                attrItem.append(
                    createElement('p', 'text-sm text-gray-400', label),
                    createElement('p', 'text-lg font-bold font-mono', data[key] || 0)
                );
                attrGrid.appendChild(attrItem);
            });
            rightCol.appendChild(attrGrid);
            if (data.equipment && Object.keys(data.equipment).length > 0) {
                const equipList = createElement('ul', 'space-y-1.5 text-sm bg-black/20 p-3 rounded-md');
                Object.entries(data.equipment).forEach(([key, value]) => {
                    const item = createProfileItem(key, value);
                    if(item) equipList.appendChild(item);
                });
                rightCol.appendChild(equipList);
            }
            if (data.reputation && data.reputation.length > 0) {
                const repList = createElement('ul', 'space-y-1.5 text-sm bg-black/20 p-3 rounded-md');
                data.reputation.forEach(rep => {
                    const item = createProfileItem(rep.name, rep.value);
                    if(item) repList.appendChild(item);
                });
                rightCol.appendChild(repList);
            }
            mainGrid.append(leftCol, rightCol);
            panel.appendChild(mainGrid);
            contentRendered = true;
            break;
        case 'inventory':
            let showingOnlyCurrency = false;
            const allDisplayItems = [];
            data.items.forEach(item => allDisplayItems.push({ ...item, isCurrency: false }));
            data.currencies.forEach(c => {
                allDisplayItems.push({
                    name: c.name, grade: '화폐', count: c.amount, unit: c.unit, desc: ``, isCurrency: true,
                });
            });

            const invListContainer = createElement('div', 'flex-grow overflow-y-auto');
            const renderList = (itemsToRender) => {
                invListContainer.innerHTML = '';
                const invList = createElement('ul', 'space-y-3');
                if (itemsToRender.length === 0) {
                    invList.innerHTML = `<li class="text-gray-400 text-center p-4">표시할 항목이 없습니다.</li>`;
                } else {
                    itemsToRender.forEach(item => {
                        const li = createElement('li', 'p-3 bg-black/30 rounded-md border border-gray-700');
                        const header = createElement('div', 'flex justify-between items-baseline');

                        const quantityText = item.isCurrency ? `(${item.count}${item.unit})` : `(${item.count})`;
                        header.append(
                            createElement('span', 'font-bold', `${item.name} ${quantityText}`),
                            createElement('span', `text-sm font-semibold ${getGradeColor(item.grade)}`, item.grade)
                        );
                        li.appendChild(header);

                        if(item.desc) {
                            const descP = createElement('p', 'text-sm text-gray-400 mt-1.5', item.desc);
                            li.appendChild(descP);
                        }
                        invList.appendChild(li);
                    });
                }
                invListContainer.appendChild(invList);
            };

            const onFilterToggle = (e) => {
                showingOnlyCurrency = !showingOnlyCurrency;
                const btn = e.currentTarget;
                if (showingOnlyCurrency) {
                    renderList(allDisplayItems.filter(item => item.isCurrency));
                    btn.classList.add('bg-yellow-500/30');
                } else {
                    renderList(allDisplayItems);
                    btn.classList.remove('bg-yellow-500/30');
                }
            };

            panel.appendChild(createPanelHeader('아이템', true, onFilterToggle));
            panel.appendChild(invListContainer);
            renderList(allDisplayItems);
            contentRendered = true;
            break;
        case 'skills':
            panel.appendChild(createPanelHeader('스킬'));
            const skillList = createElement('ul', 'space-y-3 max-h-[80vh] overflow-y-auto');
            data.forEach(skill => {
                const li = createElement('li', 'p-3 bg-black/30 rounded-md border border-gray-700');
                const header = createElement('div', 'flex justify-between items-center');
                header.append(
                    createElement('span', 'font-bold', `${skill.name} (Lv.${skill.level})`),
                    createElement('span', 'text-blue-400', skill.cost)
                );
                li.append(header, createElement('p', 'text-sm text-gray-400 mt-1', skill.desc));
                skillList.appendChild(li);
            });
            panel.appendChild(skillList);
            contentRendered = true;
            break;
    }

    if (contentRendered) {
        overlay.appendChild(panel);
        if (isModal || contentContainer === document.body) {
            document.body.appendChild(overlay);
        } else {
            contentContainer.appendChild(overlay);
        }

        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) hideOverlayPanel();
        });

        requestAnimationFrame(() => {
            overlay.classList.remove('opacity-0', 'scale-95');
        });
    }
};

export const hideOverlayPanel = () => {
    const overlay = document.getElementById('active-overlay');
    if (overlay) {
        overlay.classList.add('opacity-0', 'scale-95');
        setTimeout(() => {
            if (overlay.parentNode) {
                overlay.remove();
            }
        }, 200);
    }
};