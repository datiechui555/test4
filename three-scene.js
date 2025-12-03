// Three.js 3D场景初始化
let scene, camera, renderer, controls;
let buildings = [];
let roads = [];
let trafficFlowLines = [];
let selectedRoad = null; // 当前选中的道路

function init3DScene() {
    // 创建场景
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xa0d2ff);
    
    // 创建相机
    const container = document.getElementById('three-container');
    camera = new THREE.PerspectiveCamera(60, container.clientWidth / container.clientHeight, 0.1, 1000);
    camera.position.set(50, 40, 50);
    
    // 创建渲染器
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);
    
    // 添加轨道控制器
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    
    // 添加环境光
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);
    
    // 添加方向光
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(50, 100, 50);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    scene.add(directionalLight);
    
    // 创建地面 - 改为白色
    const groundGeometry = new THREE.PlaneGeometry(200, 200);
    const groundMaterial = new THREE.MeshLambertMaterial({ color: 0xffffff });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);
    
    // 添加网格辅助
    const gridHelper = new THREE.GridHelper(200, 20, 0x000000, 0x000000);
    gridHelper.material.opacity = 0.2;
    gridHelper.material.transparent = true;
    scene.add(gridHelper);
    
    // 生成建筑和道路
    generateBuildings();
    generateRoads();
    
    // 窗口大小调整
    window.addEventListener('resize', onWindowResize);
    
    // 渲染循环
    animate();
}

function onWindowResize() {
    const container = document.getElementById('three-container');
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
}

function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}

function generateBuildings() {
    // 增加建筑数量，覆盖更大面积
    const buildingData = [
        { name: "南宁国际会展中心", type: "文化", height: 30, width: 40, depth: 30, x: 0, z: 0, color: 0xcccccc },
        { name: "青秀区政府大楼", type: "政府", height: 25, width: 20, depth: 20, x: -30, z: 20, color: 0xdddddd },
        { name: "金湖广场", type: "商业", height: 35, width: 25, depth: 25, x: 25, z: -20, color: 0xaaaaaa },
        { name: "地王大厦", type: "商业", height: 45, width: 15, depth: 15, x: -20, z: -25, color: 0xbbbbbb },
        { name: "航洋国际", type: "商业", height: 30, width: 30, depth: 30, x: 35, z: 25, color: 0x999999 },
        { name: "南宁博物馆", type: "文化", height: 20, width: 35, depth: 25, x: -40, z: -10, color: 0xdddddd },
        { name: "青秀山公园管理处", type: "公共", height: 15, width: 20, depth: 15, x: 10, z: 35, color: 0x7ec850 },
        { name: "南宁市图书馆", type: "文化", height: 25, width: 30, depth: 20, x: -35, z: 30, color: 0xcccccc },
        { name: "青秀万达广场", type: "商业", height: 40, width: 35, depth: 35, x: 40, z: -35, color: 0xaaaaaa },
        { name: "南宁体育中心", type: "体育", height: 20, width: 50, depth: 40, x: -50, z: -40, color: 0xdddddd },
        { name: "广西科技馆", type: "文化", height: 25, width: 30, depth: 25, x: 50, z: 40, color: 0xbbbbbb },
        { name: "南宁火车站", type: "交通", height: 15, width: 45, depth: 30, x: -45, z: 45, color: 0xcccccc },
        { name: "广西医科大学", type: "教育", height: 20, width: 40, depth: 35, x: 45, z: -45, color: 0xdddddd },
        { name: "南宁金融中心", type: "商业", height: 50, width: 20, depth: 20, x: -55, z: -50, color: 0xaaaaaa },
        { name: "青秀湖公园", type: "公共", height: 10, width: 60, depth: 50, x: 55, z: 50, color: 0x7ec850 }
    ];
    
    buildingData.forEach(data => {
        // 创建建筑主体
        const geometry = new THREE.BoxGeometry(data.width, data.height, data.depth);
        const material = new THREE.MeshLambertMaterial({ color: data.color });
        const building = new THREE.Mesh(geometry, material);
        building.position.set(data.x, data.height / 2, data.z);
        building.castShadow = true;
        building.receiveShadow = true;
        
        // 存储建筑信息
        building.userData = {
            name: data.name,
            type: data.type,
            height: data.height,
            address: `青秀区${data.name}`
        };
        
        // 添加建筑窗户
        const windows = [];
        const windowGeometry = new THREE.PlaneGeometry(2, 3);
        const windowMaterial = new THREE.MeshLambertMaterial({ color: 0x1a3c6e });
        
        for (let i = 0; i < 4; i++) {
            for (let j = 0; j < 3; j++) {
                const window = new THREE.Mesh(windowGeometry, windowMaterial.clone());
                const side = i % 2 === 0 ? 1 : -1;
                const axis = i < 2 ? 'x' : 'z';
                
                if (axis === 'x') {
                    window.position.set(
                        side * (data.width / 2 + 0.1),
                        -data.height / 2 + 5 + j * 8,
                        -data.depth / 2 + 5 + (i % 2) * (data.depth - 10)
                    );
                    window.rotation.y = side * Math.PI / 2;
                } else {
                    window.position.set(
                        -data.width / 2 + 5 + (i % 2) * (data.width - 10),
                        -data.height / 2 + 5 + j * 8,
                        side * (data.depth / 2 + 0.1)
                    );
                    window.rotation.y = (side === 1 ? 0 : Math.PI);
                }
                
                building.add(window);
                windows.push(window);
            }
        }
        
        building.userData.windows = windows;
        scene.add(building);
        buildings.push(building);
    });
}

function generateRoads() {
    // 道路数据
    const roadData = [
        { name: "民族大道", width: 8, points: [{x: -80, z: 0}, {x: 80, z: 0}], color: 0x333333 },
        { name: "青秀路", width: 6, points: [{x: 0, z: -60}, {x: 0, z: 60}], color: 0x333333 },
        { name: "凤岭北路", width: 6, points: [{x: -40, z: -30}, {x: 40, z: 30}], color: 0x333333 },
        { name: "会展路", width: 5, points: [{x: -30, z: -20}, {x: 30, z: 20}], color: 0x444444 },
        { name: "竹溪大道", width: 7, points: [{x: -60, z: -20}, {x: 60, z: 20}], color: 0x333333 },
        { name: "青山路", width: 5, points: [{x: -20, z: -40}, {x: 20, z: 40}], color: 0x444444 },
        { name: "佛子岭路", width: 4, points: [{x: -25, z: -25}, {x: 25, z: 25}], color: 0x555555 },
        { name: "枫林路", width: 4, points: [{x: -35, z: -15}, {x: 35, z: 15}], color: 0x555555 },
        { name: "云景路", width: 5, points: [{x: -15, z: -35}, {x: 15, z: 35}], color: 0x444444 },
        { name: "长湖路", width: 6, points: [{x: -50, z: -10}, {x: 50, z: 10}], color: 0x333333 }
    ];
    
    roadData.forEach((road, index) => {
        const roadGroup = new THREE.Group();
        roadGroup.userData = {
            name: road.name,
            status: allData[index] ? allData[index].status : Math.floor(Math.random() * 3) // 0: 畅通, 1: 缓行, 2: 拥堵
        };
        
        // 根据状态设置道路颜色
        let roadColor;
        if (roadGroup.userData.status === 0) {
            roadColor = 0x34a853; // 绿色 - 畅通
        } else if (roadGroup.userData.status === 1) {
            roadColor = 0xfbbc05; // 黄色 - 缓行
        } else {
            roadColor = 0xea4335; // 红色 - 拥堵
        }
        
        // 创建道路几何体
        const points = road.points;
        for (let i = 0; i < points.length - 1; i++) {
            const start = points[i];
            const end = points[i + 1];
            
            const length = Math.sqrt(Math.pow(end.x - start.x, 2) + Math.pow(end.z - start.z, 2));
            const angle = Math.atan2(end.z - start.z, end.x - start.x);
            
            const geometry = new THREE.BoxGeometry(length, 0.5, road.width);
            const material = new THREE.MeshLambertMaterial({ color: roadColor });
            const roadSegment = new THREE.Mesh(geometry, material);
            
            roadSegment.position.set(
                (start.x + end.x) / 2,
                0.25,
                (start.z + end.z) / 2
            );
            roadSegment.rotation.y = angle;
            
            roadGroup.add(roadSegment);
        }
        
        scene.add(roadGroup);
        roads.push(roadGroup);
    });
}

function generateTrafficFlow() {
    clearTrafficFlow();
    
    roads.forEach(road => {
        // 为每条道路生成交通流线
        const points = road.userData.points || [{x: -80, z: 0}, {x: 80, z: 0}]; // 默认点
        
        for (let i = 0; i < points.length - 1; i++) {
            const start = points[i];
            const end = points[i + 1];
            
            const length = Math.sqrt(Math.pow(end.x - start.x, 2) + Math.pow(end.z - start.z, 2));
            const angle = Math.atan2(end.z - start.z, end.x - start.x) * 180 / Math.PI;
            
            // 创建交通流线
            const flowLine = document.createElement('div');
            flowLine.className = 'traffic-flow-line';
            
            // 根据道路状态设置颜色
            if (road.userData.status === 0) {
                flowLine.style.backgroundColor = '#34a853'; // 绿色
            } else if (road.userData.status === 1) {
                flowLine.style.backgroundColor = '#fbbc05'; // 黄色
            } else {
                flowLine.style.backgroundColor = '#ea4335'; // 红色
            }
            
            flowLine.style.width = `${length}px`;
            flowLine.style.left = `${start.x + 100}px`; // 调整坐标偏移
            flowLine.style.top = `${start.z + 100}px`;
            flowLine.style.transform = `rotate(${angle}deg)`;
            flowLine.style.animationDelay = `${Math.random() * 3}s`;
            
            document.getElementById('traffic-flow-layer').appendChild(flowLine);
            trafficFlowLines.push(flowLine);
        }
    });
}

function clearTrafficFlow() {
    trafficFlowLines.forEach(line => {
        if (line.parentNode) {
            line.parentNode.removeChild(line);
        }
    });
    trafficFlowLines = [];
}