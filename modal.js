// 모달 및 오버레이 패널 관리 모듈
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
};

export const showOverlayPanel = (type, data) => {
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

            // 좌측 컬럼
            const profileSection = createElement('div');
            profileSection.appendChild(createElement('h3', 'text-lg font-semibold text-cyan-400 mb-2', '프로필'));
            const profileList = createElement('ul', 'space-y-1.5 text-sm');
            const createProfileItem = (label, value) => {
                const item = createElement('li', 'flex justify-between items-center');
                item.innerHTML = `<span class="font-semibold text-gray-400">${label}</span> <span class="font-mono text-gray-200">${value}</span>`;
                return item;
            };

            if (data.level) {
                profileList.appendChild(createProfileItem('레벨', data.level));
                profileList.appendChild(createProfileItem('경험치', `${data.xp.current} / ${data.xp.max} XP`));
            }
            profileList.appendChild(createProfileItem('나이', data.age));
            profileList.appendChild(createProfileItem('클래스', data.class));
            profileList.appendChild(createProfileItem('칭호', data.title));
            if (data.reputation_stats && data.reputation_stats.length > 0) {
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

            const traitSection = createElement('div');
            traitSection.appendChild(createElement('h3', 'text-lg font-semibold text-cyan-400 mb-2', '특성'));
            const traitList = createElement('ul', 'space-y-2');
            data.traits.forEach(trait => {
                const item = createElement('li', 'bg-black/20 p-2 rounded-md');
                const traitType = trait.type === 'pos' ? 'buff' : 'debuff';
                const nameSpan = createElement('span', `font-bold ${getTypeColor(traitType)}`, trait.name);
                const descP = createElement('p', 'text-sm text-gray-400 mt-1', trait.desc);
                item.append(nameSpan, descP);
                traitList.appendChild(item);
            });
            traitSection.appendChild(traitList);
            leftCol.appendChild(traitSection);

            // 우측 컬럼
            if (data.equipment && Object.keys(data.equipment).length > 0) {
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