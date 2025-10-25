// 商品配置
const products = [
    { id: 1, name: "特级小麦粉", basePrice: 40.0, volatility: 0.15 },
    { id: 2, name: "大豆油", basePrice: 75.0, volatility: 0.12 },
    { id: 3, name: "优质大米", basePrice: 55.0, volatility: 0.1 },
    { id: 4, name: "玉米", basePrice: 28.0, volatility: 0.18 },
    { id: 5, name: "白糖", basePrice: 32.0, volatility: 0.2 }
];

// 存储当日价格数据
let currentPrices = {};

/**
 * 生成基于基准价格浮动的随机价格
 */
function generateRandomPrice(basePrice, volatility = 0.1) {
    // 使用正态分布生成更真实的波动
    const u1 = Math.random();
    const u2 = Math.random();
    const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    
    // 限制波动范围在 ±3σ 内
    const normalizedZ = Math.max(-3, Math.min(3, z));
    const fluctuation = (normalizedZ / 3) * volatility;
    
    const newPrice = basePrice * (1 + fluctuation);
    return Math.round(newPrice * 100) / 100;
}

/**
 * 获取当日唯一的价格键（确保每天价格一致）
 */
function getDailyKey() {
    const today = new Date();
    return `prices_${today.getFullYear()}_${today.getMonth() + 1}_${today.getDate()}`;
}

/**
 * 初始化或获取当日价格
 */
function initializeDailyPrices() {
    const dailyKey = getDailyKey();
    const stored = localStorage.getItem(dailyKey);
    
    if (stored) {
        currentPrices = JSON.parse(stored);
    } else {
        // 生成新价格
        products.forEach(product => {
            currentPrices[product.id] = {
                price: generateRandomPrice(product.basePrice, product.volatility),
                basePrice: product.basePrice
            };
        });
        // 存储到localStorage
        localStorage.setItem(dailyKey, JSON.stringify(currentPrices));
        
        // 清理旧数据（保留最近7天）
        cleanupOldPrices();
    }
}

/**
 * 清理旧的价格数据
 */
function cleanupOldPrices() {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key.startsWith('prices_')) {
            const dateParts = key.split('_').slice(1).map(Number);
            const date = new Date(dateParts[0], dateParts[1] - 1, dateParts[2]);
            
            if (date < oneWeekAgo) {
                localStorage.removeItem(key);
            }
        }
    }
}

/**
 * 计算涨跌幅
 */
function calculateChange(currentPrice, basePrice) {
    const change = ((currentPrice - basePrice) / basePrice) * 100;
    return Math.round(change * 100) / 100;
}

/**
 * 渲染价格表格
 */
function renderPriceTable() {
    const tableBody = document.getElementById('priceTableBody');
    tableBody.innerHTML = '';

    products.forEach(product => {
        const priceData = currentPrices[product.id];
        const change = calculateChange(priceData.price, product.basePrice);
        
        const tr = document.createElement('tr');
        
        // 商品名称
        const nameCell = document.createElement('td');
        nameCell.textContent = product.name;
        tr.appendChild(nameCell);
        
        // 价格
        const priceCell = document.createElement('td');
        priceCell.textContent = `¥${priceData.price.toFixed(2)}`;
        priceCell.className = change >= 0 ? 'price-up' : 'price-down';
        tr.appendChild(priceCell);
        
        // 日期
        const dateCell = document.createElement('td');
        dateCell.textContent = new Date().toLocaleDateString('zh-CN');
        tr.appendChild(dateCell);
        
        // 涨跌幅
        const changeCell = document.createElement('td');
        changeCell.textContent = `${change >= 0 ? '+' : ''}${change.toFixed(2)}%`;
        changeCell.className = change >= 0 ? 'price-up' : 'price-down';
        tr.appendChild(changeCell);
        
        tableBody.appendChild(tr);
    });
    
    // 更新最后刷新时间
    document.getElementById('lastUpdate').textContent = 
        `最后更新: ${new Date().toLocaleString('zh-CN')}`;
}

/**
 * 检查是否需要更新到新一天的价格
 */
function checkDailyUpdate() {
    const todayKey = getDailyKey();
    const lastProcessed = localStorage.getItem('lastProcessedDay');
    
    if (lastProcessed !== todayKey) {
        // 新的一天，清除旧价格并生成新的
        initializeDailyPrices();
        renderPriceTable();
        localStorage.setItem('lastProcessedDay', todayKey);
    }
}

// 页面加载时初始化
document.addEventListener('DOMContentLoaded', function() {
    initializeDailyPrices();
    renderPriceTable();
    
    // 每分钟检查一次是否到了新的一天
    setInterval(checkDailyUpdate, 60000);
    
    // 添加手动刷新按钮（可选）
    const refreshBtn = document.createElement('button');
    refreshBtn.textContent = '手动刷新';
    refreshBtn.style.margin = '10px 0';
    refreshBtn.onclick = function() {
        checkDailyUpdate();
        renderPriceTable();
    };
    document.querySelector('.price-table').parentNode.insertBefore(refreshBtn, document.querySelector('.last-update'));
});
