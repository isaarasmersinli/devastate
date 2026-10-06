const WoditorGameSettings = {
    projectId: "default",                     // 用于决定浏览器端保存路径（日语也可以）
    projectName: "乌鲁法尔游戏示例", // 在标题栏上显示
    noSystemTouch: false,                     // false 不执行任何操作 true 禁用浏览器端 Woditor 预设的触屏操作，并改为模拟鼠标
    requestFullScreen: false,                 // false 不执行任何操作 true 游戏启动时尝试向↓拉伸全屏化(iOS无效)
    lockOrientation: "landscape-primary",     // 锁定屏幕方向(仅全屏时有效) 
    /* undefined(无引号/仅全屏) "landscape-primary"(正常横向)、"landscape-secondary"(反向横向) "portrait-primary"(正常纵向) "portrait-secondary"(反向纵向)*/
    hideHeaderFooter: false,                  // false 不执行任何操作 true 隐藏标题栏和说明书等
    hideSideButtons: false,                   // false 不执行任何操作 true 隐藏左右按钮
    switchUILeftRight: false,                 // false 不执行任何操作 true 将按钮 UI 的左右布局对调
    limitFPS: 60,                             // 30 或 60
}
