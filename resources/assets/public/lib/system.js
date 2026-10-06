document.getElementById("version-short").innerHTML = "[BW ver 0.5.6.2p]";

function playCheckSound() {
    var audio = document.getElementById('sound');
    audio.play();
}

// 给整个屏幕添加点击和触控启动的监听器
document.body.addEventListener('click', playCheckSound);
document.body.addEventListener('touchend', function (event) {
    event.preventDefault(); // 阻止触控事件的默认行为
    playCheckSound();
});


// 此处文本可自由修改
const readyText = "[加载中]";
const descriptionText = "使用键盘输入或在屏幕上滑动进行移动" // 现在hidden
const clickToStartText = "触屏开始";
const initializeMidiText = "MIDI环境设置初始化";
const initialDownloadingText = "游戏文件检查中";
const buttonNormalColor = "whitesmoke"
const buttonPressedColor = "darkgrey"
var noGameHeaderFooter = false;

// 以下为系统相关部分，基本上不要改动
document.title = WoditorGameSettings.projectName;
document.getElementById("title").innerHTML = readyText;
document.getElementById("readme").innerHTML = descriptionText;

// 当使用诸如<base href="/GameFilesUpdate/202553/2/"> 之类设置的情况(PLiCy形式)
function getPLiCyFormatGameId(){
    const match = document.baseURI.match(/GameFilesUpdate\/(\d+)\/(\d+)/);
    if(match && match[1] && match[2]){
        const Game_ID = match[1];   //PLiCy上的Game_ID
        const Update_No = match[2]; //PLiCy上进行版本升级的次数
        return Game_ID;         //设置PLiCy的Game_ID为项目ID
    }
    return null;
}

//如果在iframe URL中指定了名为Game_ID的id，则将其提取出来 http://example.com/iframe/Game_ID=xxx
function getGameIdFromLocationPathname() {
    const queryString = window.location.pathname;
    const match = queryString.match(/Game_ID=(\d+)/);
    if (match && match[1]) {
      return match[1];
    }
    return null;
}

//检查是否以任一方式指定了 Game_ID并获取之
function getGameIdFromUrl() {
    const gameIdFromPLiCyFormat = getPLiCyFormatGameId();
    if(gameIdFromPLiCyFormat){
        console.log("已获取PLiCy格式的Game_ID");
        return gameIdFromPLiCyFormat;
    }
    const gameIdFromLocationPathname = getGameIdFromLocationPathname();
    if(gameIdFromLocationPathname){
        console.log("已从Pathname中获取Game_ID");
        return gameIdFromLocationPathname;
    }
    console.log("将网站URL作为基准Game_ID");
    return null;
}

function getGameProjectPath() {
    //若iframe URL中包含名为 Game_ID的id，则使用之
    const gameIdValue = getGameIdFromUrl();
    if (gameIdValue) {
      return gameIdValue + "_" + WoditorGameSettings.projectId;
    }

    // 查看设置网站的域名之后的路径 (即便在iframe内嵌的情况下，也以显示页面的URL为基准)
    // http://example.com/GamePlay/12345 => GamePlay_12345_project_id
    let dir = null;

    try{
        dir = top.location.pathname; // 由于在iframe中有可能发生跨域资源共享问题，故通过异常处理进行回退
    }catch(e){
        dir = window.location.pathname;
    }
    
    const sep = dir.endsWith("/") ? "" : "/";
    let path = dir + sep + WoditorGameSettings.projectId;

    path = path.replace("index.html/", "");
    path = path.replaceAll(".", "_");
    if (path.startsWith("/")) {
        path = path.substring(1);
    }
    path = path.replaceAll("/", "_");

    console.log("Game project path:", path);

    return path;
}

var Module = {
    projectId: getGameProjectPath(),
    showDebugLog: 1,
    woditor: {},
    noInitialRun: true,
    preRun: [],
    postRun: [],
    print: (function () {
        return function (text) {
            text = Array.prototype.slice.call(arguments).join(' ');
            console.log(text);
        };
    })(),
    printErr: function (text) {
        text = Array.prototype.slice.call(arguments).join(' ');
        document.getElementById("error-log").innerHTML += text;
        console.error(text);
    },
    canvas: (function () {
        var canvas = document.getElementById('canvas');
        canvas.addEventListener("webglcontextlost", function (e) { alert('FIXME: WebGL context lost, please reload the page'); e.preventDefault(); }, false);
        return canvas;
    })(),
    webgl_enable_webgl2: true,
    webgl_enable_extension: ["OES_texture_float", "WEBGL_color_buffer_float"],
    title: document.getElementById("title"),
    setStatus: function (text) {
        if (text == '') {
            Module.ready = true;
            document.getElementById('title').innerHTML = clickToStartText;
            document.getElementById('touchtostart').innerHTML = clickToStartText;
        }
    },
    monitorRunDependencies: function (left) { },
    //这是在Woditor内执行「BrowserWoditor:」调试语句时显示语句内容的函数
    catchGameMessage: function (message) {
        console.log(message);
    },
    playVibration: function (inputType, power, time, effectIndex) {
        playGamePadVibration(inputType, power, time, effectIndex); // 如下所述
    }
};

window.progressDownloading = function (loaded, total, filename) {
    const percentage = total > 0 ? Math.round(100 * loaded / total) + "%" : Math.round(loaded / 100000) / 10 + "MB";
    const progressText = filename + " [" + percentage + "]";
    document.getElementById('title').innerHTML = progressText;
    document.getElementById('touchtostart').innerHTML = progressText;
}

function registerKeyDownUp(buttonEl, keyCode) {
    buttonEl.addEventListener('mousedown', (e) => {
        buttonEl.style.backgroundColor = buttonPressedColor;
        e.preventDefault();
        dispatchKeyCode('keydown', keyCode);
    });
    buttonEl.addEventListener('mouseup', (e) => {
        buttonEl.style.backgroundColor = buttonNormalColor;
        e.preventDefault();
        dispatchKeyCode('keyup', keyCode);
    });
    buttonEl.addEventListener('touchstart', (e) => {
        buttonEl.style.backgroundColor = buttonPressedColor;
        e.preventDefault();
        dispatchKeyCode('keydown', keyCode);
    });
    buttonEl.addEventListener('touchend', (e) => {
        buttonEl.style.backgroundColor = buttonNormalColor;
        e.preventDefault();
        dispatchKeyCode('keyup', keyCode);
    });
    buttonEl.addEventListener('touchcancel', (e) => {
        buttonEl.style.backgroundColor = buttonNormalColor;
        e.preventDefault();
        dispatchKeyCode('keyup', keyCode);
    });
}
const rightClickButton = document.getElementById("right-hold");
rightClickButton.addEventListener('mousedown', (e) => {
    e.preventDefault();
    rightClickButton.style.backgroundColor = buttonPressedColor;
});
rightClickButton.addEventListener('mouseup', (e) => {
    e.preventDefault();
    rightClickButton.style.backgroundColor = buttonNormalColor;
});
rightClickButton.addEventListener('touchstart', (e) => {
    e.preventDefault();
    rightClickButton.style.backgroundColor = buttonPressedColor;
    enableMouseRightButton();
});
rightClickButton.addEventListener('touchend', (e) => {
    e.preventDefault();
    rightClickButton.style.backgroundColor = buttonNormalColor;
    disableMouseRightButton();
});
registerKeyDownUp(document.getElementById("shift"), shift);
registerKeyDownUp(document.getElementById("esc"), cancel);
registerKeyDownUp(document.getElementById("enter"), enter);
registerKeyDownUp(document.getElementById("move-axis"), undefined);

var screenObserver = undefined;
function setCustomGameSize(width, height) { //在系统初始化时内部调用，用于自动调整屏幕尺寸
    if (!screenObserver) {
        screenObserver = new ResizeObserver(function (mutations) {
            adjustGameUI();
        });
        screenObserver.observe(document.body);
    }
    // 校正输入位置
    Module.gameWidth = width;
    Module.gameHeight = height;

    // 调整长宽比
    Module.canvas.width = width;
    Module.canvas.height = height;
    adjustGameUI();
}
window.onload = () => {
    const resizableEl = document.getElementById("canvas");
    setCustomGameSize(resizableEl.width, resizableEl.height); // 以标准尺寸调用一次
}

window.onerror = (err) => {
    // document.getElementById("error-log").innerHTML += err;
}
function showGameMemoryUsage() {
    if (Module && Module.HEAP8) {
        const memory = (Math.round(10 * Module.HEAP8.length / 1000000) / 10 + "MB");
        document.getElementById("memory-usage").innerHTML = "已用运存:" + memory;
    }
}
setInterval(showGameMemoryUsage, 1000);

function showToast(message) {
    var toast = document.getElementById("toast");
    toast.textContent = message;
    toast.className = "show";
    setTimeout(function () { toast.className = toast.className.replace("show", ""); }, 3000);
}

function handleFullScreen() {
    var elem = document.getElementById("main-content");
    const isIPhone = /iPhone/i.test(navigator.userAgent);
    const isIPad = /iPad/i.test(navigator.userAgent) || (/Macintosh/i.test(navigator.userAgent) && navigator.maxTouchPoints > 1);

    if (true || isIPhone || isIPad) { // 在所有设备上启用伪全屏（暂定）
        if (!WoditorGameSettings.isPseudoFullscreen) {
            startPseudoFullscreen();
        } else {
            endPseudoFullscreen();
        }
        adjustGameUI();

    } else if (elem.requestFullscreen) {
        elem.requestFullscreen();
    } else if (elem.webkitRequestFullscreen) { /* Safari */
        elem.webkitRequestFullscreen();
    } else if (elem.msRequestFullscreen) { /* IE11 */
        elem.msRequestFullscreen();
    }
}
function lockScreenOrientation(orientation) {
    if (orientation && screen.orientation && screen.orientation.lock) {
        screen.orientation.lock(orientation).catch(function (error) {
            // alert("无法锁定屏幕方向:", error);
        });
    }
}
function tryFullScreen() {
    handleFullScreen();
    if (WoditorGameSettings.lockOrientation) {
        lockScreenOrientation(WoditorGameSettings.lockOrientation);
    }
    document.onfullscreenchange = (event) => {
        event.preventDefault();
        if (document.fullscreenElement) {
            WoditorGameSettings.isFullscreen = true;
        } else {
            WoditorGameSettings.isFullscreen = false;
        }
        adjustGameUI();
    };
}

document.getElementById('fullscreen').addEventListener('click', tryFullScreen);
document.getElementById('fullscreen').addEventListener('touchend', function (event) {
    event.preventDefault(); // 阻止触控事件的默认行为
    tryFullScreen();
});

const mainContent = document.getElementById("outer");
function beforeGameStart() {
    document.getElementById('touchtostart').hidden = true;
}
function initializeGame() { // 触控时的游戏启动处理
    if (Module.ready && Module.woditor && !Module.woditor.initialized) {
        mainContent.ontouchend = undefined; // 因多次触发启动尝试会造成问题，所以将其移除
        mainContent.onclick = undefined;

        Module.woditor.initialized = true;
        Module.woditor.textInputField = document.getElementById("textinput");

        document.getElementById('title').innerHTML = initializeMidiText;
        document.getElementById('title').innerHTML = initialDownloadingText;
        document.getElementById('touchtostart').innerHTML = initialDownloadingText;

        setTimeout(() => {
            window.Benten.initialize();
        }, 10);

        Module.callMain(); // entry point

        if (WoditorGameSettings.requestFullScreen) {
            handleFullScreen();
            lockScreenOrientation(WoditorGameSettings.lockOrientation);
        }
    }
}
mainContent.ontouchend = (e) => { //开始时触摸
    if (e.target.localName == "a") {
        return;
    }
    e.preventDefault();
    initializeGame();
}
mainContent.onclick = (e) => { //响应点击
    if (e.target.localName == "a") {
        return;
    }
    e.preventDefault();
    initializeGame();
}

window.addEventListener('touchend', function (event) { // iOS区域外触摸事件的处理
    event.preventDefault();
});

window.addEventListener('beforeunload', function (event) {
    FS.syncfs(false, function (err) {
        console.log(err);
    });
});

async function customTestFileChanged(urlStr, pathStr) { // 当请求文件时内部调用，检查文件是否已更新并决定是否下载
    try {
        const response = await fetch(urlStr, { method: "HEAD", redirect: 'follow' });
        if (response.status == 200) {
            var modifiedInfo = response.headers.get('ETag');
            const filePathStr = "/data0/" + Module.projectId + "-GameCache" + pathStr + "_etag";

            if (modifiedInfo === null) {
                modifiedInfo = response.headers.get('Last-Modified');
            }

            if (modifiedInfo === null) {
                modifiedInfo = "null";
            }

            if (FS.analyzePath(filePathStr, false).exists) {
                const prevModifiedInfo = FS.readFile(filePathStr, { encoding: 'utf8' });
                if (modifiedInfo !== prevModifiedInfo) { // 过去的ETag存在且为不同的ETag
                    console.log("updated: " + pathStr, prevModifiedInfo, "=>", modifiedInfo);
                    FS.writeFile(filePathStr, modifiedInfo, { flags: 'w+' });
                    return true;
                }
            } else { // 过去的ETag本就不存在（全新的下载内容）
                console.log("new: " + pathStr, modifiedInfo);

                FS.writeFile(filePathStr, modifiedInfo, { flags: 'w+' });
                return true;
            }
        }
    } catch {
        return false;
    }
    return false;
}

function browserCheckFailed(errorCode) { // 在尚未进行浏览器配置时调用。在这里所做的只是警告内部错误
    if (errorCode == 0) {
        alert("必要文件位于Data.wolf外\n请重新确认操作步骤");
    } else {
        alert("因未正确对浏览器进行设置而无法启动\n请重新确认步骤\n(版本升级后可能更改了相关规格)")
    }
}
const noSystemTouchEl = document.getElementById("no-system-touch");
function toggleNoSystemTouch() {
    WoditorGameSettings.noSystemTouch = !WoditorGameSettings.noSystemTouch;
    if (WoditorGameSettings.noSystemTouch) {
        noSystemTouchEl.style.backgroundColor = buttonPressedColor;
    } else {
        noSystemTouchEl.style.backgroundColor = buttonNormalColor;
    }
}
if (WoditorGameSettings.noSystemTouch) { // 初始颜色设置
    noSystemTouchEl.style.backgroundColor = buttonPressedColor;
} else {
    noSystemTouchEl.style.backgroundColor = buttonNormalColor;
}

const switchUIEl = document.getElementById("switch-ui");
function toggleSwitchUI() {
    WoditorGameSettings.switchUILeftRight = !WoditorGameSettings.switchUILeftRight;
    if (WoditorGameSettings.switchUILeftRight) {
        switchUIEl.style.backgroundColor = buttonPressedColor;
    } else {
        switchUIEl.style.backgroundColor = buttonNormalColor;
    }
    adjustGameUI();
}
if (WoditorGameSettings.switchUILeftRight && switchUIEl !== null) { // 初始颜色设置
    switchUIEl.style.backgroundColor = buttonPressedColor;
} else {
    switchUIEl.style.backgroundColor = buttonNormalColor;
}

function toggleSettingVisibility() {
    const el = document.getElementById("main-footer-additional");
    el.hidden = !el.hidden;
}
function uploadSaveData() {
    const file = document.getElementById("savedata").files[0];
    var fr = new FileReader();
    fr.onload = eve => {
        console.log(fr.result);
        const arr = new Uint8Array(fr.result);

        const dirPathStr = "/Save";
        const filePathStr = dirPathStr + "/" + file.name;
        if (!FS.analyzePath(dirPathStr).exists) {
            FS.mkdir(dirPathStr);
        }
        FS.writeFile(filePathStr, arr, { flags: 'w+' });

        const backupPath = "/data0/" + Module.projectId + filePathStr;
        FS.writeFile(backupPath, arr, { flags: 'w+' });
        FS.syncfs(false, function (err) { });

        alert("已将存档加载至Save文件夹")
    }
    fr.readAsArrayBuffer(file);
}

document.addEventListener("visibilitychange", async (e) => {
    if (document.visibilityState === "visible") {
        if (Module && Module.AL) {
            // 处理恢复音频上下文
            for (var key in Module.AL.contexts) {
                const ctx = Module.AL.contexts[key].audioCtx;
                if (ctx.state === "suspended") {
                    await ctx.resume().then(() => {
                        console.log("AudioContext resumed.");
                    }).catch(err => {
                        console.log("Failed to resume AudioContext:", err);
                    });
                }
            }

            // 取消 MIDI 播放静音
            if (window.Benten) {
                window.Benten.unmute();
            }
        }
    } else if (document.visibilityState === "hidden") {
        if (window.Benten) {
            window.Benten.mute();
        }
    }
});

// 设置按钮
{
    const popup = document.getElementById('popup');

    function startPseudoFullscreen() {
        showToast("通过设置按钮退出全屏");

        WoditorGameSettings.isFullscreen = true;
        WoditorGameSettings.isPseudoFullscreen = true;
        adjustGameUI();
    }

    function endPseudoFullscreen() {
        if (WoditorGameSettings.isFullscreen && WoditorGameSettings.isPseudoFullscreen) {
            WoditorGameSettings.isFullscreen = false;
            WoditorGameSettings.isPseudoFullscreen = false;
            adjustGameUI();
        }
    }
    function isOpenSetting() {
        return !popup.hidden;
    }
    function openSetting() {
        popup.hidden = !popup.hidden;
    }
    function closeSetting() {
        popup.hidden = true;
    }

    const button = document.getElementById('settings');
    let isDragging = false;
    let currentX;
    let currentY;
    let initialX;
    let initialY;
    let xOffset = 0;
    let yOffset = 0;
    let moveCount = 0;

    button.addEventListener('mousedown', dragStart);
    button.addEventListener('touchstart', dragStart);
    document.addEventListener('mousemove', drag);
    document.addEventListener('touchmove', drag);
    document.addEventListener('mouseup', dragEnd);
    document.addEventListener('touchend', dragEnd);

    function dragStart(e) {
        e.preventDefault();
        moveCount = 0;
        startTime = new Date().getTime();
        if (e.type === "touchstart") {
            initialX = e.touches[0].clientX - xOffset;
            initialY = e.touches[0].clientY - yOffset;
        } else {
            initialX = e.clientX - xOffset;
            initialY = e.clientY - yOffset;
        }

        if (e.target === button) {
            isDragging = true;
        }
    }

    function drag(e) {
        e.preventDefault();
        if (isDragging) {
            moveCount += 1;
            if (e.type === "touchmove") {
                currentX = e.touches[0].clientX - initialX;
                currentY = e.touches[0].clientY - initialY;
            } else {
                currentX = e.clientX - initialX;
                currentY = e.clientY - initialY;
            }

            currentX = limitedX(currentX, button);
            currentY = limitedY(currentY, button);

            xOffset = currentX;
            yOffset = currentY;

            setTranslate(currentX, currentY, button);
        }
    }

    function dragEnd(e) {
        e.preventDefault();
        const moveCountThreshold = 20;

        if (moveCount < moveCountThreshold) {
            const isTargetCanvas = e.target.id == 'canvas';
            const isTargetBody = e.target == document.body;
            if ((isTargetCanvas || isTargetBody) && isOpenSetting()) { //点击 canvas 关闭
                closeSetting();
            }

            const isTargetSetting = e.target.id == 'settings';
            if (isTargetSetting) {
                openSetting();
            }
        }

        initialX = currentX;
        initialY = currentY;

        isDragging = false;
    }

    const outer = document.getElementById("outer");
    const outerSize = outer.getBoundingClientRect();
    const offsetX = outerSize.left;
    const offsetY = outerSize.top;
    const wholeWidth = window.innerWidth - offsetX;
    const wholeHeight = window.innerHeight - offsetY;

    function limitedX(xPos, el) {
        const rect = el.getBoundingClientRect();
        xPos -= offsetX;
        return offsetX + Math.max(wholeWidth * 0.1, Math.min(xPos, wholeWidth - rect.width - wholeWidth * 0.0125));
    }

    function limitedY(yPos, el) {
        const rect = el.getBoundingClientRect();
        yPos -= offsetY;
        return offsetY + Math.max(0, Math.min(yPos, wholeHeight - rect.height - wholeHeight * 0.1));
    }

    function setTranslate(xPos, yPos, el) {
        const rect = el.getBoundingClientRect();
        xPos = limitedX(xPos, el); // 在 iOS 中，如果过于靠左或靠下，就会与其他操作手势重叠造成问题
        yPos = limitedY(yPos, el);
        el.style.transform = `translate3d(${xPos}px, ${yPos}px, 0)`;
    }

    window.addEventListener("resize", function (e) {
        setTranslate(currentX, currentY, button);
    });
    window.addEventListener("load", function (e) {
        const rect = button.getBoundingClientRect();
        xOffset = offsetX + wholeWidth - rect.width;
        yOffset = offsetY + Math.max(0, Math.min(yOffset, wholeHeight - rect.height));
        setTranslate(xOffset, yOffset, button);
    });
}

{
    document.body.addEventListener("touchmove", function (e) { // 留白处理
        e.preventDefault();
    });
}

{
    const framelimitEl = document.getElementById("framelimit");

    function changeFrameLimit() {
        const limitFPS = WoditorGameSettings.isLimitFPS ? 30 : 60;
        Module.ccall('setFrameLimit', null, ['number'], [limitFPS]);
    }

    function toggleFrameLimit() {
        WoditorGameSettings.isLimitFPS = !WoditorGameSettings.isLimitFPS;

        if (WoditorGameSettings.isLimitFPS) {
            framelimitEl.style.backgroundColor = buttonPressedColor;
        } else {
            framelimitEl.style.backgroundColor = buttonNormalColor;
        }
        changeFrameLimit();
    }

    if (WoditorGameSettings.limitFPS == 30 && !WoditorGameSettings.isLimitFPS) {
        toggleFrameLimit();
    }
}

{
    function openLink(url) {
        showToast("在启用弹窗拦截功能时，可能不会响应");

        window.open(url, '_blank').focus();
    }
}

// Save 文件夹下载/加载相关
{
    // 改动此处即可改变整个下载/加载所针对的 Save 文件夹
    let targetSaveFileDir = "Save";

    function mkdirs(dirpath) {
        const rootDir = FS.analyzePath(dirpath);
        if (!rootDir.exists) {
            if (!rootDir.parentExists) {
                mkdirs(rootDir.parentPath);
            }
            try {
                FS.mkdir(dirpath);
            } catch (err) {
                console.log(err);
            }
        }
    }

    // {filename: Uint8Array}
    const zipAndDownloadAllDict = (dict) => {
        var zip = new JSZip();

        for (let key in dict) {
            zip.file(key, dict[key]);
        };

        const location = document.getElementById('savedownload');

        zip.generateAsync({ type: "base64" }).then(function (base64) {
            location.href = "data:application/zip;base64," + base64;
            location.click();
        });
    }

    function downloadSaveDir() {
        const savepath = "/data0/" + Module.projectId + "-Save";

        const root = FS.lookupPath(savepath);
        const fileDict = {};

        function lookupAndAdd(node, path) {
            if (FS.isDir(node.mode)) {
                for (const [key, value] of Object.entries(node.contents)) {
                    lookupAndAdd(node.contents[key], path + node.name + "/");
                }
            }
            if (FS.isFile(node.mode)) {
                const filename = (path + node.name).substring(2);
                fileDict[filename] = node.contents.buffer;
            }
        }
        lookupAndAdd(root.node, "");

        zipAndDownloadAllDict(fileDict);
    }

    // 覆盖缓存区与主文件两者（若文件夹不存在则创建之）
    const saveFiles = (dict) => {
        const savepath = "/data0/" + Module.projectId + "-Save";

        mkdirs(savepath + "/" + targetSaveFileDir);
        mkdirs(targetSaveFileDir);

        for (let key in dict) {
            const path = savepath + "/" + key;
            FS.writeFile(path, dict[key]);
            FS.writeFile(key, dict[key]);
        };
        FS.syncfs(false);
        showToast("加载完成");
    }

    function loadAllFiles(selectedFiles, i, stop, dict, onLoadFinished) {
        const file = selectedFiles[i];
        const reader = new FileReader();

        reader.onload = function () {
            var ar = new Uint8Array(reader.result);
            dict[targetSaveFileDir + "/" + file.name] = ar;

            if (i + 1 < stop) {
                loadAllFiles(selectedFiles, i + 1, stop, dict, onLoadFinished);
            } else {
                onLoadFinished(dict);
            }
        }

        reader.readAsArrayBuffer(file);
    }

    function uploadSaveDir() {
        const selectedFiles = document.getElementById("savefiles").files;

        if (selectedFiles.length > 0) {
            loadAllFiles(selectedFiles, 0, selectedFiles.length, {}, saveFiles);
        }
    }
}

{
    let isPlayingGanePadVibration = false;

    //游戏手柄振动的实现
    function playGamePadVibration(inputType, power, time, effectIndex) {
        for (let index = 0; index < navigator.getGamepads().length; ++index) {
            const gamepad = navigator.getGamepads()[index];
            if (gamepad && gamepad.vibrationActuator) {
                if (time <= 0) {
                    isPlayingGanePadVibration = false;
                    gamepad.vibrationActuator.reset();
                } else {
                    // 由于一次性载入超过规定毫秒数时无法正常工作，故已进行了处理
                    isPlayingGanePadVibration = true;
                    const maxtime = 5000;
                    let remaining = time;

                    function playGamePadVibrationRaw() {
                        gamepad.vibrationActuator.playEffect("dual-rumble", {
                            startDelay: 0,
                            duration: remaining > maxtime ? maxtime : remaining,
                            weakMagnitude: power / 1000.0,
                            strongMagnitude: power / 1000.0,
                        });
                        remaining -= maxtime;
                        if(remaining > 0){
                            setTimeout(() => {
                                if (isPlayingGanePadVibration) {
                                    playGamePadVibrationRaw();
                                }
                            }, (maxtime - 1));
                        }else{
                            isPlayingGanePadVibration = false;
                        }
                    }
                    playGamePadVibrationRaw();
                }
            }
        }
    }
}

{
    // 错误显示处理
    window.onerror = function (msg, file, line, column, err) {
        const errorMessage = msg + "\n" + file + "[line:" + line + "]\n";

        const settingButton = document.getElementById('settings');
        settingButton.style.backgroundColor = '#88000088';

        const errorText = document.getElementById('bwoditorerror');
        errorText.textContent = errorMessage;
    };
}