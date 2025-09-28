// CSV 데이터 파서 모듈
export const parseCsvData = (csvText) => {
    const data = {
        genre: '',
        description: '',
        character_stats: {
            name: '', age: 0, level: 0, class: '', title: '',
            xp: { current: 0, max: 100 },
            resources: [],
            reputation_stats: [],
            attributes: {},
            equipment: {},
            traits: [],
        },
        inventory: [],
        skills: [],
        information_panel: [],
        image: ''
    };

    if (!csvText) return data;

    const lines = csvText.trim().split('\n').filter(line => line.trim() !== '');

    for (const line of lines) {
        const parts = line.trim().split('|');
        const key = parts[0];
        const values = parts.slice(1);

        switch (key) {
            case 'gen': data.genre = values[0]; break;
            case 'dsc': data.description = values[0]; break;
            case 'trt':
                data.character_stats.traits.push({ name: values[0], desc: values[1], type: values[2] });
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