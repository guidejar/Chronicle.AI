// CSV 데이터 파서 모듈
export const parseCsvData = (csvText) => {
    const data = {
        genre: '',
        description: '',
        session_settings: {
            systems: {},
            stat_definitions: [], // <--- 통일된 스탯 정의
            destiny_choices: [],
        },
        character_stats: {
            name: '', age: 0, level: 0, class: '', title: '',
            xp: { current: 0, max: 100 },
            resources: [],
            reputation_stats: [],
            attributes: {},
            equipment: {},
            traits: [],
            currency_active: '',
            currencies: [],
        },
        inventory: [],
        skills: [],
        information_panel: [],
        image: '',
        random: 0,
        tension: 0
    };

    if (!csvText) return data;

    const lines = csvText.trim().split('\n').filter(line => line.trim() !== '');

    for (const line of lines) {
        const parts = line.trim().split('|');
        let key = parts[0];
        // @ 기호 제거 처리
        if (key.startsWith('@')) {
            key = key.substring(1);
        }
        const values = parts.slice(1);

        // disable 처리: 어떤 필드든 'disable'이 포함되어 있으면 해당 라인 스킵
        if (values.includes('disable')) {
            continue;
        }

        switch (key) {
            // --- 1턴 (세션 설정) ---
            case 'gen': data.genre = values[0]; break;
            case 'dsc': data.description = values[0]; break;
                            case 'destiny_atr': // 1턴 임시 스탯 -> 통일된 stat_definitions 사용
                data.session_settings.stat_definitions.push({ name: values[0], desc: values[1] });
                break;
            case 'destiny':
                data.session_settings.destiny_choices.push({
                    name: values[0],
                    desc: values[1],
                    strengths: values[2].split(','),
                    normals: values[3].split(','),
                    weaknesses: values[4].split(','),
                });
                break;

            // --- 2턴 이후 (일반 진행) ---
            case 'stat': // 2턴 이후 영구 스탯 -> 통일된 stat_definitions 사용
                 data.session_settings.stat_definitions.push({ name: values[0], desc: values[1] });
                 break;
            case 'trt':
                data.character_stats.traits.push({ name: '', desc: values[0], type: values[1] });
                break;
            case 'chr':
                data.character_stats[values[0]] = isNaN(values[1]) ? values[1] : Number(values[1]);
                break;
            case 'xp':
                data.character_stats.xp = { current: Number(values[0]), max: Number(values[1]) };
                break;
            case 'gauge':
                let color = values[3];
                if (color && !color.startsWith('#')) {
                    color = '#' + color;  // # 자동 추가
                }
                data.character_stats.resources.push({ name: values[0], current: Number(values[1]), max: Number(values[2]), color: color });
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
            case 'random':
                data.random = Number(values[0]);
                break;
            case 'tension':
                data.tension = Number(values[0]);
                break;
            case 'cur_active':
                data.character_stats.currency_active = values[0];
                break;
            case 'cur':
                data.character_stats.currencies.push({ name: values[0], amount: Number(values[1]), unit: values[2], desc: values[3] });
                break;
        }
    }
    return data;
};
