// 全局变量
let predictionChart, historyChart, historyStatsChart, peakHoursChart;
let allData = [
    { name: "民族大道", roadType: 0, status: 0, speed: 45.2, congestionIndex: 1.2, prediction1: 0, prediction2: 1 },
    { name: "青秀路", roadType: 0, status: 1, speed: 25.6, congestionIndex: 2.3, prediction1: 1, prediction2: 0 },
    { name: "凤岭北路", roadType: 1, status: 2, speed: 8.7, congestionIndex: 4.5, prediction1: 2, prediction2: 1 },
    { name: "会展路", roadType: 1, status: 0, speed: 42.1, congestionIndex: 1.5, prediction1: 0, prediction2: 0 },
    { name: "竹溪大道", roadType: 0, status: 1, speed: 28.3, congestionIndex: 2.1, prediction1: 1, prediction2: 1 },
    { name: "青山路", roadType: 1, status: 0, speed: 38.9, congestionIndex: 1.8, prediction1: 0, prediction2: 1 },
    { name: "佛子岭路", roadType: 2, status: 2, speed: 6.5, congestionIndex: 5.2, prediction1: 2, prediction2: 2 },
    { name: "枫林路", roadType: 2, status: 1, speed: 22.7, congestionIndex: 2.8, prediction1: 1, prediction2: 0 },
    { name: "云景路", roadType: 2, status: 0, speed: 40.5, congestionIndex: 1.3, prediction1: 0, prediction2: 0 },
    { name: "长湖路", roadType: 1, status: 1, speed: 26.8, congestionIndex: 2.4, prediction1: 1, prediction2: 1 }
];

const roadTypeNames = ['主干道', '次干道', '支路'];

// DOM加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    // 登录功能
    document.getElementById('login-form').addEventListener('submit', function(e) {
        e.preventDefault();
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        
        // 简单验证
        if (username === 'admin' && password === '123456') {
            document.getElementById('login-page').style.display = 'none';
            document.getElementById('main-app').style.display = 'block';
            init3DScene(); // 初始化3D场景
            initCharts(); // 初始化图表
            updatePageData(); // 更新页面数据
            initEventListeners(); // 初始化事件监听器
            initRoadSelector(); // 初始化道路选择器
        } else {
            alert('用户名或密码错误！请使用演示账号: admin / 密码: 123456');
        }
    });
    
    // 退出登录
    document.getElementById('logout-btn').addEventListener('click', function() {
        document.getElementById('login-page').style.display = 'flex';
        document.getElementById('main-app').style.display = 'none';
    });
});

// 初始化事件监听器
function initEventListeners() {
    // 标签页切换
    document.querySelectorAll('.nav-link[data-tab]').forEach(tab => {
        tab.addEventListener('click', function() {
            // 更新导航激活状态
            document.querySelectorAll('.nav-link').forEach(link => {
                link.classList.remove('active');
            });
            this.classList.add('active');
            
            // 显示对应的标签内容
            const tabId = this.getAttribute('data-tab');
            document.querySelectorAll('.tab-content').forEach(content => {
                content.style.display = 'none';
            });
            document.getElementById(`${tabId}-tab`).style.display = 'block';
            
            // 如果是历史数据标签，初始化历史图表
            if (tabId === 'history') {
                initHistoryCharts();
            }
        });
    });
    
    // 地图控制事件
    document.getElementById('reset-view').addEventListener('click', function() {
        camera.position.set(50, 40, 50);
        controls.reset();
    });
    
    document.getElementById('zoom-in').addEventListener('click', function() {
        camera.position.y -= 5;
        camera.position.x -= 3;
        camera.position.z -= 3;
    });
    
    document.getElementById('zoom-out').addEventListener('click', function() {
        camera.position.y += 5;
        camera.position.x += 3;
        camera.position.z += 3;
    });
    
    document.getElementById('toggle-traffic').addEventListener('click', function() {
        const showTraffic = this.classList.toggle('btn-primary');
        if (showTraffic) {
            this.classList.remove('btn-light');
            this.classList.add('btn-primary');
            generateTrafficFlow(); // 生成交通流
        } else {
            this.classList.remove('btn-primary');
            this.classList.add('btn-light');
            clearTrafficFlow(); // 清除交通流
        }
    });
    
    // 视图模式切换
    document.getElementById('view-mode').addEventListener('change', function() {
        const mode = this.value;
        if (mode === 'night') {
            scene.background = new THREE.Color(0x0a1a2a);
            ambientLight.intensity = 0.3;
            directionalLight.intensity = 0.5;
            // 点亮建筑窗户
            buildings.forEach(building => {
                if (building.userData.windows) {
                    building.userData.windows.forEach(window => {
                        window.material.emissive = new THREE.Color(0xffff00);
                        window.material.emissiveIntensity = 0.5;
                    });
                }
            });
        } else if (mode === 'traffic') {
            scene.background = new THREE.Color(0x1a1a2a);
            ambientLight.intensity = 0.5;
            directionalLight.intensity = 0.7;
        } else {
            scene.background = new THREE.Color(0xa0d2ff);
            ambientLight.intensity = 0.6;
            directionalLight.intensity = 0.8;
            // 关闭建筑窗户发光
            buildings.forEach(building => {
                if (building.userData.windows) {
                    building.userData.windows.forEach(window => {
                        window.material.emissive = new THREE.Color(0x000000);
                        window.material.emissiveIntensity = 0;
                    });
                }
            });
        }
    });
    
    // 重置道路选择
    document.getElementById('reset-road-selection').addEventListener('click', function() {
        resetRoadSelection();
    });
    
    // 道路选择器展开/收起
    document.getElementById('road-selector-toggle').addEventListener('click', function() {
        const roadList = document.getElementById('road-list');
        const isCollapsed = roadList.style.display === 'none';
        roadList.style.display = isCollapsed ? 'block' : 'none';
        this.innerHTML = isCollapsed ? '<i class="fas fa-chevron-up"></i>' : '<i class="fas fa-chevron-down"></i>';
    });
    
    // 刷新按钮
    document.getElementById('refresh-btn').addEventListener('click', function() {
        updatePageData();
    });
    
    // 重置缩放按钮
    document.getElementById('reset-zoom').addEventListener('click', function() {
        predictionChart.resetZoom();
    });
}

// 初始化道路选择器
function initRoadSelector() {
    const roadList = document.getElementById('road-list');
    roadList.innerHTML = '';
    
    // 获取所有道路名称（去重）
    const roadNames = [...new Set(roads.map(road => road.userData.name))];
    
    roadNames.forEach(name => {
        const roadItem = document.createElement('div');
        roadItem.className = 'road-item';
        roadItem.dataset.roadName = name;
        
        // 获取道路状态
        const road = roads.find(r => r.userData.name === name);
        const status = road.userData.status;
        
        let statusText, statusClass;
        if (status === 0) {
            statusText = '畅通';
            statusClass = 'status-smooth';
        } else if (status === 1) {
            statusText = '缓行';
            statusClass = 'status-slow';
        } else {
            statusText = '拥堵';
            statusClass = 'status-congested';
        }
        
        roadItem.innerHTML = `
            <div>
                <div class="road-status-indicator ${statusClass}"></div>
                ${name}
            </div>
            <span>${statusText}</span>
        `;
        
        roadItem.addEventListener('click', function() {
            selectRoad(name);
        });
        
        roadList.appendChild(roadItem);
    });
}

// 选择道路
function selectRoad(roadName) {
    // 重置之前选中的道路
    if (selectedRoad) {
        resetRoadHighlight();
    }
    
    // 设置当前选中的道路
    selectedRoad = roadName;
    
    // 高亮选中的道路
    highlightRoad(roadName);
    
    // 更新道路选择器中的选中状态
    updateRoadSelectorSelection(roadName);
    
    // 更新选中道路的信息显示
    updateSelectedRoadInfo(roadName);
    
    // 更新统计面板和表格数据
    updateRoadSpecificData(roadName);
}

// 高亮显示选中的道路
function highlightRoad(roadName) {
    roads.forEach(road => {
        if (road.userData.name === roadName) {
            // 改变道路颜色为高亮
            road.children.forEach(child => {
                if (child instanceof THREE.Mesh) {
                    // 保存原始颜色
                    if (!child.userData.originalColor) {
                        child.userData.originalColor = child.material.color.clone();
                    }
                    
                    // 设置高亮颜色
                    child.material.color.set(0x1a73e8);
                }
            });
        }
    });
}

// 重置道路高亮
function resetRoadHighlight() {
    roads.forEach(road => {
        road.children.forEach(child => {
            if (child instanceof THREE.Mesh && child.userData.originalColor) {
                // 恢复原始颜色
                child.material.color.copy(child.userData.originalColor);
            }
        });
    });
}

// 更新道路选择器中的选中状态
function updateRoadSelectorSelection(roadName) {
    const roadItems = document.querySelectorAll('.road-item');
    roadItems.forEach(item => {
        item.classList.remove('selected');
        if (item.dataset.roadName === roadName) {
            item.classList.add('selected');
        }
    });
}

// 更新选中道路的信息显示
function updateSelectedRoadInfo(roadName) {
    const road = roads.find(r => r.userData.name === roadName);
    if (!road) return;
    
    const status = road.userData.status;
    let statusText, speed, congestion;
    
    if (status === 0) {
        statusText = '畅通';
        speed = (40 + Math.random() * 20).toFixed(1);
        congestion = (1 + Math.random() * 1).toFixed(1);
    } else if (status === 1) {
        statusText = '缓行';
        speed = (20 + Math.random() * 15).toFixed(1);
        congestion = (2 + Math.random() * 1).toFixed(1);
    } else {
        statusText = '拥堵';
        speed = (5 + Math.random() * 10).toFixed(1);
        congestion = (4 + Math.random() * 2).toFixed(1);
    }
    
    document.getElementById('selected-road-name').textContent = roadName;
    document.getElementById('selected-road-speed').textContent = speed + ' km/h';
    document.getElementById('selected-road-congestion').textContent = congestion;
    document.getElementById('selected-road-status').textContent = statusText;
    
    // 显示选中道路信息区域
    document.getElementById('selected-road-info').style.display = 'block';
}

// 重置道路选择
function resetRoadSelection() {
    if (selectedRoad) {
        resetRoadHighlight();
        selectedRoad = null;
        
        // 更新道路选择器中的选中状态
        const roadItems = document.querySelectorAll('.road-item');
        roadItems.forEach(item => {
            item.classList.remove('selected');
        });
        
        // 隐藏选中道路信息区域
        document.getElementById('selected-road-info').style.display = 'none';
        
        // 恢复显示所有数据
        updatePageData();
    }
}

// 更新特定道路的数据显示
function updateRoadSpecificData(roadName) {
    // 筛选出该道路的数据
    const roadData = allData.filter(item => item.name.includes(roadName));
    
    // 更新统计卡片
    updateStatistics(roadData);
    
    // 更新表格数据（不进行分页）
    renderRoadSpecificTable(roadData);
    
    // 更新预测图表（显示该道路的预测）
    updatePredictionChartForRoad(roadName);
}

// 渲染特定道路的表格数据
function renderRoadSpecificTable(data) {
    const tbody = document.getElementById('traffic-data');
    tbody.innerHTML = '';
    
    data.forEach(road => {
        const row = document.createElement('tr');
        
        // 状态文本和颜色
        let statusText, statusClass;
        if (road.status === 0) {
            statusText = '畅通';
            statusClass = 'status-smooth';
        } else if (road.status === 1) {
            statusText = '缓行';
            statusClass = 'status-slow';
        } else {
            statusText = '拥堵';
            statusClass = 'status-congested';
        }
        
        // 预测变化
        let pred1Class, pred1Text;
        if (road.prediction1 < road.status) {
            pred1Class = 'prediction-down';
            pred1Text = '改善';
        } else if (road.prediction1 > road.status) {
            pred1Class = 'prediction-up';
            pred1Text = '恶化';
        } else {
            pred1Class = 'prediction-stable';
            pred1Text = '保持';
        }
        
        let pred2Class, pred2Text;
        if (road.prediction2 < road.prediction1) {
            pred2Class = 'prediction-down';
            pred2Text = '改善';
        } else if (road.prediction2 > road.prediction1) {
            pred2Class = 'prediction-up';
            pred2Text = '恶化';
        } else {
            pred2Class = 'prediction-stable';
            pred2Text = '保持';
        }
        
        row.innerHTML = `
            <td>${road.name}</td>
            <td>${roadTypeNames[road.roadType]}</td>
            <td>
                <div class="traffic-status">
                    <div class="status-indicator ${statusClass}"></div>
                    <span>${statusText}</span>
                </div>
            </td>
            <td>${road.speed} km/h</td>
            <td>${road.congestionIndex}</td>
            <td><span class="prediction-badge ${pred1Class}">${pred1Text}</span></td>
            <td><span class="prediction-badge ${pred2Class}">${pred2Text}</span></td>
        `;
        
        tbody.appendChild(row);
    });
    
    // 隐藏分页控件
    document.getElementById('pagination').style.display = 'none';
}

// 更新特定道路的预测图表
function updatePredictionChartForRoad(roadName) {
    // 生成该道路的预测数据
    const labels = ['当前', '30分钟后', '1小时后', '1.5小时后', '2小时后'];
    
    // 根据道路状态生成预测数据
    const road = roads.find(r => r.userData.name === roadName);
    const status = road.userData.status;
    
    let smoothData, slowData, congestedData;
    
    if (status === 0) {
        // 当前畅通，预测可能保持或轻微恶化
        smoothData = [1, 0.9, 0.8, 0.85, 0.9];
        slowData = [0, 0.1, 0.15, 0.1, 0.05];
        congestedData = [0, 0, 0.05, 0.05, 0.05];
    } else if (status === 1) {
        // 当前缓行，预测可能改善或恶化
        smoothData = [0, 0.1, 0.2, 0.15, 0.1];
        slowData = [1, 0.8, 0.7, 0.75, 0.8];
        congestedData = [0, 0.1, 0.1, 0.1, 0.1];
    } else {
        // 当前拥堵，预测可能改善或保持
        smoothData = [0, 0.05, 0.1, 0.15, 0.2];
        slowData = [0, 0.2, 0.3, 0.25, 0.2];
        congestedData = [1, 0.75, 0.6, 0.6, 0.6];
    }
    
    // 更新图表
    predictionChart.data.datasets[0].data = smoothData;
    predictionChart.data.datasets[1].data = slowData;
    predictionChart.data.datasets[2].data = congestedData;
    predictionChart.update();
    
    // 更新图表标题
    predictionChart.options.plugins.title.text = `${roadName} - 未来2小时交通状况预测`;
    predictionChart.update();
}

// 初始化图表
function initCharts() {
    // 预测图表
    const predictionCtx = document.getElementById('prediction-chart').getContext('2d');
    predictionChart = new Chart(predictionCtx, {
        type: 'line',
        data: {
            labels: ['当前', '30分钟后', '1小时后', '1.5小时后', '2小时后'],
            datasets: [
                {
                    label: '畅通',
                    data: [0.6, 0.5, 0.4, 0.45, 0.5],
                    borderColor: '#34a853',
                    backgroundColor: 'rgba(52, 168, 83, 0.1)',
                    tension: 0.4,
                    fill: true
                },
                {
                    label: '缓行',
                    data: [0.3, 0.35, 0.4, 0.35, 0.3],
                    borderColor: '#fbbc05',
                    backgroundColor: 'rgba(251, 188, 5, 0.1)',
                    tension: 0.4,
                    fill: true
                },
                {
                    label: '拥堵',
                    data: [0.1, 0.15, 0.2, 0.2, 0.2],
                    borderColor: '#ea4335',
                    backgroundColor: 'rgba(234, 67, 53, 0.1)',
                    tension: 0.4,
                    fill: true
                }
            ]
        },
        options: {
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: '未来2小时交通状况预测',
                    font: {
                        size: 16
                    }
                },
                legend: {
                    position: 'top',
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 1,
                    ticks: {
                        callback: function(value) {
                            return (value * 100) + '%';
                        }
                    }
                }
            }
        }
    });
}

function initHistoryCharts() {
    // 历史趋势图表
    const historyCtx = document.getElementById('history-chart').getContext('2d');
    historyChart = new Chart(historyCtx, {
        type: 'line',
        data: {
            labels: ['00:00', '02:00', '04:00', '06:00', '08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00', '22:00'],
            datasets: [{
                label: '拥堵指数',
                data: [1.2, 1.0, 0.8, 1.5, 3.2, 2.8, 2.5, 2.3, 3.5, 4.2, 2.1, 1.5],
                borderColor: '#1a73e8',
                backgroundColor: 'rgba(26, 115, 232, 0.1)',
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: '过去24小时交通趋势',
                    font: {
                        size: 16
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: '拥堵指数'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: '时间'
                    }
                }
            }
        }
    });
    
    // 历史数据统计图表
    const statsCtx = document.getElementById('history-stats-chart').getContext('2d');
    historyStatsChart = new Chart(statsCtx, {
        type: 'doughnut',
        data: {
            labels: ['畅通', '缓行', '拥堵'],
            datasets: [{
                data: [45, 35, 20],
                backgroundColor: ['#34a853', '#fbbc05', '#ea4335'],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: '交通状况分布',
                    font: {
                        size: 16
                    }
                },
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
    
    // 高峰时段图表
    const peakCtx = document.getElementById('peak-hours-chart').getContext('2d');
    peakHoursChart = new Chart(peakCtx, {
        type: 'bar',
        data: {
            labels: ['早高峰', '午间', '晚高峰', '夜间'],
            datasets: [{
                label: '拥堵指数',
                data: [3.8, 2.3, 4.2, 1.5],
                backgroundColor: ['#1a73e8', '#34a853', '#ea4335', '#fbbc05'],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: '各时段拥堵情况',
                    font: {
                        size: 16
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: '拥堵指数'
                    }
                }
            }
        }
    });
}

// 更新页面数据
function updatePageData() {
    updateStatistics(allData);
    renderTable(allData, 1);
    updateLastUpdated();
}

// 更新统计数据
function updateStatistics(data) {
    const smoothCount = data.filter(item => item.status === 0).length;
    const slowCount = data.filter(item => item.status === 1).length;
    const congestedCount = data.filter(item => item.status === 2).length;
    
    // 计算平均速度
    const avgSpeed = data.reduce((sum, item) => sum + item.speed, 0) / data.length;
    
    // 更新卡片数据
    document.getElementById('smooth-count').textContent = smoothCount;
    document.getElementById('slow-count').textContent = slowCount;
    document.getElementById('congested-count').textContent = congestedCount;
    document.getElementById('avg-speed').textContent = avgSpeed.toFixed(1);
    
    // 更新变化数据（模拟）
    document.getElementById('smooth-change').textContent = `+${Math.floor(Math.random() * 3)}`;
    document.getElementById('slow-change').textContent = `${Math.random() > 0.5 ? '+' : '-'}${Math.floor(Math.random() * 2)}`;
    document.getElementById('congested-change').textContent = `+${Math.floor(Math.random() * 2)}`;
}

// 渲染表格
function renderTable(data, currentPage) {
    const itemsPerPage = 5;
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const pageData = data.slice(startIndex, endIndex);
    
    const tbody = document.getElementById('traffic-data');
    tbody.innerHTML = '';
    
    pageData.forEach(road => {
        const row = document.createElement('tr');
        
        // 状态文本和颜色
        let statusText, statusClass;
        if (road.status === 0) {
            statusText = '畅通';
            statusClass = 'status-smooth';
        } else if (road.status === 1) {
            statusText = '缓行';
            statusClass = 'status-slow';
        } else {
            statusText = '拥堵';
            statusClass = 'status-congested';
        }
        
        // 预测变化
        let pred1Class, pred1Text;
        if (road.prediction1 < road.status) {
            pred1Class = 'prediction-down';
            pred1Text = '改善';
        } else if (road.prediction1 > road.status) {
            pred1Class = 'prediction-up';
            pred1Text = '恶化';
        } else {
            pred1Class = 'prediction-stable';
            pred1Text = '保持';
        }
        
        let pred2Class, pred2Text;
        if (road.prediction2 < road.prediction1) {
            pred2Class = 'prediction-down';
            pred2Text = '改善';
        } else if (road.prediction2 > road.prediction1) {
            pred2Class = 'prediction-up';
            pred2Text = '恶化';
        } else {
            pred2Class = 'prediction-stable';
            pred2Text = '保持';
        }
        
        row.innerHTML = `
            <td>${road.name}</td>
            <td>${roadTypeNames[road.roadType]}</td>
            <td>
                <div class="traffic-status">
                    <div class="status-indicator ${statusClass}"></div>
                    <span>${statusText}</span>
                </div>
            </td>
            <td>${road.speed} km/h</td>
            <td>${road.congestionIndex}</td>
            <td><span class="prediction-badge ${pred1Class}">${pred1Text}</span></td>
            <td><span class="prediction-badge ${pred2Class}">${pred2Text}</span></td>
        `;
        
        tbody.appendChild(row);
    });
    
    // 更新分页控件
    updatePagination(data.length, itemsPerPage, currentPage);
}

// 更新分页控件
function updatePagination(totalItems, itemsPerPage, currentPage) {
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const pagination = document.getElementById('pagination');
    pagination.innerHTML = '';
    
    // 显示分页控件
    pagination.style.display = 'flex';
    
    // 上一页按钮
    const prevItem = document.createElement('li');
    prevItem.className = `page-item ${currentPage === 1 ? 'disabled' : ''}`;
    prevItem.innerHTML = '<a class="page-link" href="#">上一页</a>';
    prevItem.addEventListener('click', function(e) {
        e.preventDefault();
        if (currentPage > 1) {
            renderTable(allData, currentPage - 1);
        }
    });
    pagination.appendChild(prevItem);
    
    // 页码按钮
    for (let i = 1; i <= totalPages; i++) {
        const pageItem = document.createElement('li');
        pageItem.className = `page-item ${i === currentPage ? 'active' : ''}`;
        pageItem.innerHTML = `<a class="page-link" href="#">${i}</a>`;
        pageItem.addEventListener('click', function(e) {
            e.preventDefault();
            renderTable(allData, i);
        });
        pagination.appendChild(pageItem);
    }
    
    // 下一页按钮
    const nextItem = document.createElement('li');
    nextItem.className = `page-item ${currentPage === totalPages ? 'disabled' : ''}`;
    nextItem.innerHTML = '<a class="page-link" href="#">下一页</a>';
    nextItem.addEventListener('click', function(e) {
        e.preventDefault();
        if (currentPage < totalPages) {
            renderTable(allData, currentPage + 1);
        }
    });
    pagination.appendChild(nextItem);
}

// 更新最后更新时间
function updateLastUpdated() {
    const now = new Date();
    const timeString = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
    document.getElementById('update-time').textContent = timeString;
}