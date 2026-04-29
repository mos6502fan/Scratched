let workspace = null;
let currentLang = 'ru';

const langMap = {
    'ru': Blockly.Msg.ru,
    'en': Blockly.Msg.en,
    'tr': Blockly.Msg.tr,
    'de': Blockly.Msg.de,
    'fr': Blockly.Msg.fr,
    'es': Blockly.Msg.es,
    'zh-hans': Blockly.Msg['zh-hans'],
    'ja': Blockly.Msg.ja,
    'ko': Blockly.Msg.ko,
    'ar': Blockly.Msg.ar
};

function initBlockly() {
    if (workspace) {
        workspace.dispose();
    }
    
    workspace = Blockly.inject('blocklyDiv', {
        toolbox: `
            <xml xmlns="http://www.w3.org/1999/xhtml" id="toolbox" style="display: none">
                <category name="Логика" colour="#5C6BC0">
                    <block type="controls_if"></block>
                    <block type="logic_compare"></block>
                    <block type="logic_operation"></block>
                    <block type="logic_boolean"></block>
                    <block type="logic_negate"></block>
                </category>
                <category name="Циклы" colour="#42A5F5">
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
                <category name="Математика" colour="#66BB6A">
                    <block type="math_number"></block>
                    <block type="math_arithmetic"></block>
                    <block type="math_single"></block>
                    <block type="math_number_property"></block>
                    <block type="math_round"></block>
                    <block type="math_random_int"></block>
                </category>
                <category name="Текст" colour="#FFA726">
                    <block type="text"></block>
                    <block type="text_join"></block>
                    <block type="text_length"></block>
                    <block type="text_isEmpty"></block>
                    <block type="text_trim"></block>
                </category>
                <category name="Списки" colour="#8D6E63">
                    <block type="lists_create_with"></block>
                    <block type="lists_repeat"></block>
                    <block type="lists_length"></block>
                    <block type="lists_getIndex"></block>
                    <block type="lists_setIndex"></block>
                </category>
                <category name="Переменные" colour="#EF5350" custom="VARIABLE"></category>
                <category name="Функции" colour="#AB47BC" custom="PROCEDURE"></category>
                <category name="Вывод" colour="#26A69A">
                    <block type="text_print"></block>
                </category>
            </xml>
        `,
        grid: { spacing: 20, length: 3, colour: '#ccc', snap: true },
        zoom: { controls: true, wheel: true, startScale: 0.9, maxScale: 1.5, minScale: 0.7 },
        trashcan: true,
        move: { scrollbars: true, drag: true, wheel: true }
    });
    
    Blockly.JavaSCRIPT.addReservedWords('console,print,output');
    
    if (workspace && Blockly.Msg[currentLang]) {
        try {
            workspace.options.language = currentLang;
        } catch(e) {}
    }
}

function changeLanguage(langCode) {
    currentLang = langCode;
    const messages = langMap[langCode];
    
    if (messages) {
        Blockly.setLocale(messages);
    }
    
    const oldXml = Blockly.Xml.workspaceToDom(workspace);
    initBlockly();
    Blockly.Xml.domToWorkspace(oldXml, workspace);
}

function runCode() {
    const outputDiv = document.getElementById('outputContent');
    outputDiv.innerHTML = '';
    
    let oldConsoleLog = console.log;
    let outputLines = [];
    
    console.log = function() {
        let args = Array.from(arguments).map(arg => {
            if (arg === null) return 'null';
            if (arg === undefined) return 'undefined';
            if (typeof arg === 'object') {
                try {
                    return JSON.stringify(arg);
                } catch(e) {
                    return String(arg);
                }
            }
            return String(arg);
        }).join(' ');
        outputLines.push(args);
        oldConsoleLog.apply(console, arguments);
    };
    
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
            outputDiv.innerHTML = '<span style="color: #95a5a6;">[Программа выполнена без вывода данных]</span>';
        } else {
            outputDiv.innerHTML = outputLines.map(line => 
                '<div>' + escapeHtml(line) + '</div>'
            ).join('');
        }
    } catch (error) {
        outputDiv.innerHTML = '<span style="color: #e74c3c;">[Ошибка] ' + escapeHtml(error.toString()) + '</span>';
    } finally {
        console.log = oldConsoleLog;
    }
}

function clearOutput() {
    document.getElementById('outputContent').innerHTML = '';
    const emptyMsg = document.getElementById('outputContent');
    if (emptyMsg.children.length === 0) {
        emptyMsg.innerHTML = '';
    }
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function loadExampleProgram() {
    let xmlText = `
        <xml xmlns="http://www.w3.org/1999/xhtml">
            <block type="text_print" x="100" y="60">
                <value name="TEXT">
                    <shadow type="text">
                        <field name="TEXT">Привет, Scratched!</field>
                    </shadow>
                </value>
            </block>
            <block type="text_print" x="100" y="140">
                <value name="TEXT">
                    <shadow type="text">
                        <field name="TEXT">Это пример программы на блоках</field>
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
                    <shadow type="text">
                        <field name="TEXT">5 + 3 = </field>
                    </shadow>
                </value>
            </block>
        </xml>
    `;
    let xml = Blockly.utils.xml.textToDom(xmlText);
    Blockly.Xml.domToWorkspace(xml, workspace);
}

document.addEventListener('DOMContentLoaded', () => {
    initBlockly();
    
    setTimeout(() => {
        loadExampleProgram();
    }, 100);
    
    const langButtons = document.querySelectorAll('.lang-btn');
    langButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const lang = btn.getAttribute('data-lang');
            changeLanguage(lang);
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
