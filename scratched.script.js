let workspace = null;
let currentLang = 'ru';

function getToolboxXml(lang) {
    const translations = {
        ru: { logic: 'Логика', loops: 'Циклы', math: 'Математика', text: 'Текст', lists: 'Списки', variables: 'Переменные', functions: 'Функции', output: 'Вывод' },
        en: { logic: 'Logic', loops: 'Loops', math: 'Math', text: 'Text', lists: 'Lists', variables: 'Variables', functions: 'Functions', output: 'Output' },
        tr: { logic: 'Mantik', loops: 'Donguler', math: 'Matematik', text: 'Metin', lists: 'Listeler', variables: 'Degiskenler', functions: 'Fonksiyonlar', output: 'Cikti' },
        de: { logic: 'Logik', loops: 'Schleifen', math: 'Mathe', text: 'Text', lists: 'Listen', variables: 'Variablen', functions: 'Funktionen', output: 'Ausgabe' },
        fr: { logic: 'Logique', loops: 'Boucles', math: 'Maths', text: 'Texte', lists: 'Listes', variables: 'Variables', functions: 'Fonctions', output: 'Sortie' },
        es: { logic: 'Logica', loops: 'Bucles', math: 'Matematicas', text: 'Texto', lists: 'Listas', variables: 'Variables', functions: 'Funciones', output: 'Salida' },
        'zh-hans': { logic: '逻辑', loops: '循环', math: '数学', text: '文本', lists: '列表', variables: '变量', functions: '函数', output: '输出' },
        ja: { logic: '论理', loops: 'ループ', math: '数学', text: 'テキスト', lists: 'リスト', variables: '変数', functions: '関数', output: '出力' },
        ko: { logic: '논리', loops: '반복', math: '수학', text: '텍스트', lists: '리스트', variables: '변수', functions: '함수', output: '출력' },
        ar: { logic: 'منطق', loops: 'حلقات', math: 'رياضيات', text: 'نص', lists: 'قوائم', variables: 'متغيرات', functions: 'دوال', output: 'مخرجات' }
    };
    
    const t = translations[lang] || translations.en;
    
    return `
        <xml xmlns="http://www.w3.org/1999/xhtml" id="toolbox" style="display: none">
            <category name="${t.logic}" colour="#5C6BC0">
                <block type="controls_if"></block>
                <block type="logic_compare"></block>
                <block type="logic_operation"></block>
                <block type="logic_boolean"></block>
                <block type="logic_negate"></block>
            </category>
            <category name="${t.loops}" colour="#42A5F5">
                <block type="controls_repeat_ext">
                    <value name="TIMES">
                        <shadow type="math_number">
                            <field name="NUM">10</field>
                        </shadow>
                    </value>
                </block>
                <block type="controls_whileUntil"></block>
                <block type="controls_for"></block>
            </category>
            <category name="${t.math}" colour="#66BB6A">
                <block type="math_number"></block>
                <block type="math_arithmetic"></block>
                <block type="math_single"></block>
                <block type="math_number_property"></block>
                <block type="math_round"></block>
                <block type="math_random_int"></block>
            </category>
            <category name="${t.text}" colour="#FFA726">
                <block type="text"></block>
                <block type="text_join"></block>
                <block type="text_length"></block>
                <block type="text_isEmpty"></block>
                <block type="text_trim"></block>
            </category>
            <category name="${t.lists}" colour="#8D6E63">
                <block type="lists_create_with"></block>
                <block type="lists_repeat"></block>
                <block type="lists_length"></block>
                <block type="lists_getIndex"></block>
                <block type="lists_setIndex"></block>
            </category>
            <category name="${t.variables}" colour="#EF5350" custom="VARIABLE"></category>
            <category name="${t.functions}" colour="#AB47BC" custom="PROCEDURE"></category>
            <category name="${t.output}" colour="#26A69A">
                <block type="text_print"></block>
            </category>
        </xml>
    `;
}

function initBlockly() {
    if (workspace) {
        const xml = Blockly.Xml.workspaceToDom(workspace);
        workspace.dispose();
        workspace = null;
        Blockly.mainWorkspace = null;
    }
    
    Blockly.defineBlocksWithJsonArray([]);
    
    workspace = Blockly.inject('blocklyDiv', {
        toolbox: getToolboxXml(currentLang),
        grid: { spacing: 20, length: 3, colour: '#ccc', snap: true },
        zoom: { controls: true, wheel: true, startScale: 0.9, maxScale: 1.5, minScale: 0.7 },
        trashcan: true,
        move: { scrollbars: true, drag: true, wheel: true }
    });
    
    if (currentLang === 'ar') {
        document.body.setAttribute('dir', 'rtl');
        document.querySelector('.editor-container').style.flexDirection = 'row-reverse';
    } else {
        document.body.setAttribute('dir', 'ltr');
        document.querySelector('.editor-container').style.flexDirection = 'row';
    }
    
    return workspace;
}

function changeLanguage(langCode) {
    currentLang = langCode;
    
    const savedXml = workspace ? Blockly.Xml.workspaceToDom(workspace) : null;
    
    initBlockly();
    
    if (savedXml && savedXml.children && savedXml.children.length > 0) {
        try {
            Blockly.Xml.domToWorkspace(savedXml, workspace);
        } catch(e) {
            console.warn('Could not restore workspace:', e);
            loadExampleProgram();
        }
    } else {
        loadExampleProgram();
    }
}

function runCode() {
    const outputDiv = document.getElementById('outputContent');
    outputDiv.innerHTML = '';
    
    let outputLines = [];
    
    try {
        let code = Blockly.JavaScript.workspaceToCode(workspace);
        
        let customPrint = function(text) {
            outputLines.push(String(text));
        };
        
        let fullCode = `
            var print = ${customPrint.toString()};
            ${code}
        `;
        
        let func = new Function(fullCode);
        func();
        
        if (outputLines.length === 0) {
            const langMsg = {
                ru: '[Программа выполнена без вывода данных]',
                en: '[Program executed with no output]',
                tr: '[Program cikti olmadan calisti]',
                de: '[Programm ohne Ausgabe ausgefuhrt]',
                fr: '[Programme execute sans sortie]',
                es: '[Programa ejecutado sin salida]',
                'zh-hans': '[程序执行无输出]',
                ja: '[出力なしでプログラムを実行しました]',
                ko: '[출력 없이 프로그램 실행됨]',
                ar: '[تم تنفيذ البرنامج بدون مخرجات]'
            };
            outputDiv.innerHTML = '<span style="color: #95a5a6;">' + (langMsg[currentLang] || langMsg.en) + '</span>';
        } else {
            outputDiv.innerHTML = outputLines.map(line => 
                '<div>' + escapeHtml(line) + '</div>'
            ).join('');
        }
    } catch (error) {
        const errorMsg = {
            ru: '[Ошибка] ',
            en: '[Error] ',
            tr: '[Hata] ',
            de: '[Fehler] ',
            fr: '[Erreur] ',
            es: '[Error] ',
            'zh-hans': '[错误] ',
            ja: '[エラー] ',
            ko: '[오류] ',
            ar: '[خطأ] '
        };
        outputDiv.innerHTML = '<span style="color: #e74c3c;">' + (errorMsg[currentLang] || errorMsg.en) + escapeHtml(error.toString()) + '</span>';
    }
}

function clearOutput() {
    document.getElementById('outputContent').innerHTML = '';
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function getExampleXml(lang) {
    const messages = {
        ru: { hello: 'Привет, Scratched!', example: 'Это пример программы на блоках' },
        en: { hello: 'Hello, Scratched!', example: 'This is an example block program' },
        tr: { hello: 'Merhaba, Scratched!', example: 'Bu bir ornek blok programidir' },
        de: { hello: 'Hallo, Scratched!', example: 'Dies ist ein Beispiel-Blockprogramm' },
        fr: { hello: 'Bonjour, Scratched!', example: 'Ceci est un exemple de programme par blocs' },
        es: { hello: 'Hola, Scratched!', example: 'Este es un ejemplo de programa de bloques' },
        'zh-hans': { hello: '你好，Scratched！', example: '这是一个示例块程序' },
        ja: { hello: 'こんにちは、Scratched！', example: 'これはブロックプログラムの例です' },
        ko: { hello: '안녕하세요, Scratched!', example: '이것은 블록 프로그램 예제입니다' },
        ar: { hello: 'مرحبا، سكراتشد!', example: 'هذا مثال لبرنامج الكتل' }
    };
    
    const m = messages[lang] || messages.en;
    
    return `
        <xml xmlns="http://www.w3.org/1999/xhtml">
            <block type="text_print" x="100" y="60">
                <value name="TEXT">
                    <shadow type="text">
                        <field name="TEXT">${m.hello}</field>
                    </shadow>
                </value>
            </block>
            <block type="text_print" x="100" y="140">
                <value name="TEXT">
                    <shadow type="text">
                        <field name="TEXT">${m.example}</field>
                    </shadow>
                </value>
            </block>
            <block type="math_arithmetic" x="100" y="220">
                <field name="OP">ADD</field>
                <value name="A">
                    <shadow type="math_number">
                        <field name="NUM">5</field>
                    </shadow>
                </value>
                <value name="B">
                    <shadow type="math_number">
                        <field name="NUM">3</field>
                    </shadow>
                </value>
            </block>
            <block type="text_print" x="100" y="320">
                <value name="TEXT">
                    <block type="text_join">
                        <mutation items="2"></mutation>
                        <value name="ADD0">
                            <shadow type="text">
                                <field name="TEXT">5 + 3 = </field>
                            </shadow>
                        </value>
                        <value name="ADD1">
                            <block type="math_arithmetic">
                                <field name="OP">ADD</field>
                                <value name="A">
                                    <shadow type="math_number">
                                        <field name="NUM">5</field>
                                    </shadow>
                                </value>
                                <value name="B">
                                    <shadow type="math_number">
                                        <field name="NUM">3</field>
                                    </shadow>
                                </value>
                            </block>
                        </value>
                    </block>
                </value>
            </block>
        </xml>
    `;
}

function loadExampleProgram() {
    if (!workspace) return;
    
    const xmlText = getExampleXml(currentLang);
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
    Blockly.Xml.domToWorkspace(xmlDoc.documentElement, workspace);
}

document.addEventListener('DOMContentLoaded', () => {
    initBlockly();
    
    setTimeout(() => {
        if (workspace && workspace.getAllBlocks().length === 0) {
            loadExampleProgram();
        }
    }, 200);
    
    const langButtons = document.querySelectorAll('.lang-btn');
    langButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const lang = btn.getAttribute('data-lang');
            if (lang !== currentLang) {
                changeLanguage(lang);
            }
        });
    });
    
    document.getElementById('runCode').addEventListener('click', runCode);
    document.getElementById('clearOutput').addEventListener('click', clearOutput);
    
    window.addEventListener('beforeunload', () => {
        if (workspace) {
            workspace.dispose();
        }
    });
});
