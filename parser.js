// CSV 데이터 파서 모듈
export const parseCsvData = (csvText) => {
    const data = {
        genre: '',
        description: '',
        destiny_characters: {}, // 1턴 데이터
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
            active_currency: '',
            currencies: [],
        },
        inventory: [],
        skills: [],
        information_panel: [],
        image: '',
        random: 0,
        tension: 0,
        hud: null
    };

    if (!csvText) return data;

    const lines = csvText.trim().split('\n').filter(line => line.trim() !== '');
    let eqpSchema = [], chrSchema = [];

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
            case 'destiny_bio':
                const name = values[0];
                if (!data.destiny_characters[name]) {
                    data.destiny_characters[name] = {
                        name, desc: values[1], stats: {}, skills: [], traits: [],
                        equipment: {}, inventory: [], currencies: [], reputation: [], resources: []
                    };
                }
                break;
            case 'destiny':
                const charName = values[0];
                // TASK 완료 표시는 무시
                if (charName.startsWith('TASK') && charName.includes('완료')) break;
                const subKey = values[1].substring(1); // @ 제거
                const subValues = values.slice(2);
                const charData = data.destiny_characters[charName];
                if (!charData) break;

                switch (subKey) {
                    case 'chr':
                        subValues.forEach((val, index) => {
                            if (chrSchema[index]) {
                                const schemaKey = {
                                    '이름':'name', '레벨':'level', '나이':'age',
                                    '힘':'str', '민첩':'dex', '지성':'int',
                                    '지혜':'wis', '카리스마':'cha', '활력':'vit',
                                    '배경':'background', '클래스':'class', '칭호':'title', '성별':'gender'
                                }[chrSchema[index]] || chrSchema[index].toLowerCase();
                                charData.stats[schemaKey] = ['age', 'level', 'str', 'dex', 'int', 'wis', 'cha', 'vit'].includes(schemaKey) ? Number(val) : val;
                            }
                        });
                        break;
                    case 'skl': charData.skills.push({ name: subValues[0], desc: subValues[4] }); break;
                    case 'trt': charData.traits.push({ name: subValues[0], desc: subValues[1], type: subValues[2] }); break;
                    case 'eqp':
                        subValues.forEach((val, i) => {
                            if(eqpSchema[i] && val.toLowerCase()!=='null') charData.equipment[eqpSchema[i]] = val
                        });
                        break;
                    case 'inv': charData.inventory.push({ name: subValues[0], count: subValues[2] }); break;
                    case 'cur': charData.currencies.push({ name: subValues[0], amount: subValues[1], unit: subValues[2] }); break;
                    case 'cur_active': charData.active_currency = subValues[0]; break;
                    case 'rep': charData.reputation.push({ name: subValues[0], value: subValues[1]}); break;
                    case 'gauge': charData.resources.push({ name: subValues[0], current: Number(subValues[1]), max: Number(subValues[2]), color: subValues[3]}); break;
                }
                break;

            // --- 2턴 이후 (일반 진행) ---
            case 'stat': // 2턴 이후 영구 스탯 -> 통일된 stat_definitions 사용
                 data.session_settings.stat_definitions.push({ name: values[0], desc: values[1] });
                 break;
            case 'trt':
                data.character_stats.traits.push({ name: '', desc: values[0], type: values[1] });
                break;
            case 'schema_eqp':
                eqpSchema = values;
                break;
            case 'schema_chr':
                chrSchema = values;
                break;
            case 'chr':
                values.forEach((val, index) => {
                    if (chrSchema[index]) {
                        const schemaKey = {
                            '이름': 'name', '레벨': 'level', '나이': 'age',
                            '힘': 'str', '민첩': 'dex', '지성': 'int',
                            '지혜': 'wis', '카리스마': 'cha', '활력': 'vit',
                            '배경': '배경', '클래스': 'class', '칭호': 'title', '성별': '성별'
                        }[chrSchema[index]] || chrSchema[index];
                        data.character_stats[schemaKey] =
                            ['age', 'level', 'str', 'dex', 'int', 'wis', 'cha', 'vit'].includes(schemaKey)
                            ? Number(val) : val;
                    }
                });
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
                values.forEach((val, index) => {
                    if (eqpSchema[index] && val.toLowerCase() !== 'null') {
                        data.character_stats.equipment[eqpSchema[index]] = val;
                    }
                });
                break;
            case 'inf':
                data.information_panel.push(values);
                break;
            case 'inv':
                data.inventory.push({ name: values[0], grade: values[1], count: values[2], desc: values[3] });
                break;
            case 'skl':
                data.skills.push({ name: values[0], level: Number(values[1]), exp: Number(values[2]), max_exp: Number(values[3]), cost: values[4], desc: values[5] });
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
                data.character_stats.active_currency = values[0];
                break;
            case 'cur':
                data.character_stats.currencies.push({ name: values[0], amount: Number(values[1]), unit: values[2], desc: values[3] });
                break;
            case 'hud':
                data.hud = { turn: values[0], time: values[1], date: values[2], location: values[3] };
                break;
            case 'destiny_bio':
                // 캐릭터 선택용 데이터 (현재는 사용하지 않음)
                break;
        }
    }
    return data;
};
