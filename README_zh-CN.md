# 交互式 3D 粒子树系统

这是一个基于 Three.js 和 MediaPipe 构建的实时交互式 3D 可视化项目。它能够通过摄像头捕捉用户的手势和面部表情，并据此改变 3D 粒子系统的形态、颜色和动态效果。

## ✨ 功能特性

*   **动态粒子模型**：支持多种粒子形态变换，包括圣诞树、爱心、花朵、土星和烟花。
*   **手势控制 (Hand Tracking)**：通过手势控制粒子的缩放和扩散。
    *   **张开手掌**：粒子扩散/放大。
    *   **握紧拳头**：粒子收缩/缩小。
*   **面部表情识别 (Emotion Recognition)**：实时检测面部情绪并改变粒子颜色。
    *   **😐 常规 (Neutral)**：白色与柔和粉色的梦幻搭配。
    *   **😄 开心 (Happy)**：恢复圣诞树原本的缤纷色彩（绿叶、彩灯、金星）。
    *   **😲 惊讶 (Surprise)**：阳光黄、活力橙与热粉色的明亮拼色。
    *   **😠 生气 (Angry)**：红色与橙色的警示拼色。
    *   **😢 悲伤 (Sad)**：深蓝色与淡灰蓝的忧郁拼色。
*   **高性能渲染**：使用 BufferGeometry 优化渲染超过 60,000 个粒子，带来细腻的视觉体验。

## 🛠️ 技术栈

*   **Three.js**：核心 3D 渲染引擎。
*   **MediaPipe (Google)**：
    *   `@mediapipe/hands`：高精度手部追踪。
    *   `@mediapipe/face_mesh`：面部网格与特征点检测。
*   **lil-gui**：轻量级可视化参数控制面板。

## 🚀 本地开发

由于本项目使用了 ES6 模块 (Modules)，为了避免浏览器的跨域安全策略 (CORS) 限制，**必须在本地服务器环境下运行**，不能直接双击打开 `index.html`。

1.  **克隆或下载**本项目代码。
2.  在项目根目录下**启动本地服务器**。
    *   如果你安装了 Python (推荐)：
        ```bash
        # Python 3
        python3 -m http.server 8000
        ```
    *   或者使用 Node.js 的 `http-server`：
        ```bash
        npx http-server
        ```
    *   或者使用 VS Code 插件：
        *   安装 "Live Server" 插件。
        *   右键点击 `index.html` 选择 "Open with Live Server"。
3.  **打开浏览器** 访问 `http://localhost:8000` (或终端显示的端口)。
4.  **允许摄像头权限**：页面加载后会请求摄像头权限，请点击“允许”以体验交互功能。

## 一键部署到 EdgeOne Pages
    [![使用 EdgeOne Pages 部署](https://cdnstatic.tencentcs.com/edgeone/pages/deploy.svg)](https://edgeone.ai/pages/new?repository-url=https%3A%2F%2Fgithub.com%2Fzhoujie0531%2Fpayload-mongodb-starter)
    
## 📂 项目结构

*   `index.html`: 入口文件，引入依赖库和样式。
*   `main.js`: 主程序逻辑，负责场景初始化、渲染循环和交互事件分发。
*   `particles.js`: `ParticleSystem` 类，封装了粒子生成、形态变换、颜色动画和 Shader 材质。
*   `vision.js`: `VisionManager` 类，封装了 MediaPipe 的 AI 模型初始化和推理逻辑。
*   `style.css`: 简单的 UI 样式。

## 🎮 操作说明

*   **右上角控制面板**：
    *   `Model Shape`: 切换粒子组成的形状（树、心形等）。
    *   `Base Color`: 手动设置基础颜色（会覆盖情绪颜色）。
    *   `Particle Count`: 调整粒子数量（需回车确认）。
    *   `Auto Rotate`: 开启/关闭自动旋转。
*   **摄像头交互**：
    *   将手掌面向摄像头，尝试张开和握拳。
    *   面对摄像头做出夸张的表情（大笑、惊讶、皱眉），观察树的颜色变化。


