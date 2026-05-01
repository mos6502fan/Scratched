let workspace = null;
let isRunning = false;

function initBlockly() {
    if (workspace) {
        workspace.dispose();
        workspace = null;
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
    
    updateBlockCount();
    return workspace;
}

function updateBlockCount() {
    if (!workspace) return;
    const blockCount = workspace.getAllBlocks().length;
    let counter = document.getElementById('blockCounter');
    if (!counter) {
        const panel = document.querySelector('.run-panel');
        if (panel) {
            counter = document.createElement('span');
            counter.id = 'blockCounter';
            counter.style.cssText = 'background: #2c3e50; padding: 6px 12px; border-radius: 20px; font-size: 13px; margin-left: 10px;';
            panel.appendChild(counter);
        }
    }
    if (counter) {
        counter.textContent = `Блоков: ${blockCount}`;
    }
}

function runCode() {
    if (isRunning) {
        stopExecution();
        return;
    }
    
    const outputDiv = document.getElementById('outputContent');
    outputDiv.innerHTML = '';
    isRunning = true;
    
    const runBtn = document.getElementById('runCode');
    if (runBtn) runBtn.textContent = 'Стоп';
    
    let outputLines = [];
    let timeoutId = null;
    
    try {
        let code = Blockly.JavaScript.workspaceToCode(workspace);
        
        let customPrint = function(text) {
            if (!isRunning) throw new Error('Выполнение остановлено пользователем');
            outputLines.push(String(text));
            const tempDiv = document.getElementById('outputContent');
            if (tempDiv) {
                tempDiv.innerHTML = outputLines.map(line => '<div>' + escapeHtml(line) + '</div>').join('');
            }
        };
        
        let fullCode = `
            var print = ${customPrint.toString()};
            ${code}
        `;
        
        // Устанавливаем таймаут на 5 секунд для защиты от бесконечных циклов
        timeoutId = setTimeout(() => {
            if (isRunning) {
                stopExecution();
                outputDiv.innerHTML = '<span style="color: #e74c3c;">[Ошибка] Превышено время выполнения (5 сек). Возможен бесконечный цикл.</span>';
                isRunning = false;
                if (runBtn) runBtn.textContent = 'Выполнить';
            }
        }, 5000);
        
        let func = new Function(fullCode);
        func();
        
        clearTimeout(timeoutId);
        
        if (outputLines.length === 0 && isRunning) {
            outputDiv.innerHTML = '<span style="color: #95a5a6;">[Программа выполнена без вывода данных]</span>';
        }
    } catch (error) {
        clearTimeout(timeoutId);
        let errorMsg = error.toString();
        if (errorMsg.includes('stopExecution') || errorMsg.includes('остановлено')) {
            outputDiv.innerHTML = '<span style="color: #f39c12;">[Остановлено пользователем]</span>';
        } else {
            outputDiv.innerHTML = '<span style="color: #e74c3c;">[Ошибка] ' + escapeHtml(errorMsg) + '</span>';
        }
    } finally {
        isRunning = false;
        if (runBtn) runBtn.textContent = 'Выполнить';
    }
}

function stopExecution() {
    isRunning = false;
    throw new Error('stopExecution');
}

function clearOutput() {
    document.getElementById('outputContent').innerHTML = '';
}

function resetBlocks() {
    if (workspace) {
        workspace.clear();
        loadExampleProgram();
        updateBlockCount();
    }
}

function saveProject() {
    if (!workspace) return;
    const xml = Blockly.Xml.workspaceToDom(workspace);
    const xmlText = Blockly.Xml.domToText(xml);
    const blob = new Blob([xmlText], {type: 'application/xml'});
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'scratched_project.xml';
    link.click();
    URL.revokeObjectURL(link.href);
}

function loadProject() {
    if (!workspace) return;
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.xml';
    input.onchange = function(e) {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = function(ev) {
            try {
                const xml = Blockly.Xml.textToDom(ev.target.result);
                workspace.clear();
                Blockly.Xml.domToWorkspace(xml, workspace);
                updateBlockCount();
                clearOutput();
            } catch (err) {
                const outputDiv = document.getElementById('outputContent');
                outputDiv.innerHTML = '<span style="color: #e74c3c;">[Ошибка] Неверный формат файла проекта</span>';
            }
        };
        reader.readAsText(file);
    };
    input.click();
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function loadExampleProgram() {
    if (!workspace) return;
    
    const xmlText = `
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
            <block type="text_print" x="100" y="220">
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
            <block type="controls_repeat_ext" x="100" y="350">
                <value name="TIMES">
                    <shadow type="math_number">
                        <field name="NUM">3</field>
                    </shadow>
                </value>
                <statement name="DO">
                    <block type="text_print">
                        <value name="TEXT">
                            <shadow type="text">
                                <field name="TEXT">Повторяюсь!</field>
                            </shadow>
                        </value>
                    </block>
                </statement>
            </block>
        </xml>
    `;
    
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
    Blockly.Xml.domToWorkspace(xmlDoc.documentElement, workspace);
    updateBlockCount();
}

document.addEventListener('DOMContentLoaded', () => {
    initBlockly();
    
    setTimeout(() => {
        if (workspace && workspace.getAllBlocks().length === 0) {
            loadExampleProgram();
        }
    }, 200);
    
    const runBtn = document.getElementById('runCode');
    const clearBtn = document.getElementById('clearOutput');
    const resetBtn = document.getElementById('resetBlocks');
    
    if (runBtn) runBtn.addEventListener('click', runCode);
    if (clearBtn) clearBtn.addEventListener('click', clearOutput);
    if (resetBtn) resetBtn.addEventListener('click', resetBlocks);
    
    // Добавляем новые кнопки
    const panel = document.querySelector('.run-panel');
    if (panel) {
        const saveBtn = document.createElement('button');
        saveBtn.textContent = 'Сохранить';
        saveBtn.className = 'reset-btn';
        saveBtn.style.background = '#8e44ad';
        saveBtn.addEventListener('click', saveProject);
        
        const loadBtn = document.createElement('button');
        loadBtn.textContent = 'Загрузить';
        loadBtn.className = 'reset-btn';
        loadBtn.style.background = '#16a085';
        loadBtn.addEventListener('click', loadProject);
        
        panel.appendChild(saveBtn);
        panel.appendChild(loadBtn);
    }
    
    // Обновляем счётчик блоков при изменениях
    if (workspace) {
        workspace.addChangeListener(updateBlockCount);
    }
    
    window.addEventListener('beforeunload', () => {
        if (workspace) {
            workspace.dispose();
        }
    });
});
