// Railway 部署配置
const API_BASE_URL = window.location.origin + '/api';

// 全局状态
let currentRecordsPage = 1;
let totalRecordsPages = 1;
let currentCheckinsPage = 1;
let totalCheckinsPages = 1;

// DOM加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 生活记录系统已加载');
    console.log('API 地址:', API_BASE_URL);
    
    // 初始化日期选择器
    const today = new Date().toISOString().split('T')[0];
    if (document.getElementById('date')) {
        document.getElementById('date').value = today;
    }
    if (document.getElementById('checkin-date')) {
        document.getElementById('checkin-date').value = today;
    }
    
    // 初始化统计月份
    const currentMonth = new Date().getMonth() + 1;
    if (document.getElementById('stats-month')) {
        document.getElementById('stats-month').value = currentMonth;
        document.getElementById('stats-year').value = new Date().getFullYear();
    }
    
    // 绑定事件
    if (document.getElementById('record-form')) {
        document.getElementById('record-form').addEventListener('submit', handleRecordSubmit);
    }
    if (document.getElementById('checkin-form')) {
        document.getElementById('checkin-form').addEventListener('submit', handleCheckinSubmit);
    }
    
    // 显示首页
    showPage('dashboard');
    
    // 初始化Charts.js
    initCharts();
    
    // 加载首页数据
    loadDashboardData();
    loadRecentRecords();
    loadRecentCheckins();
    
    // 检查 API 连接
    checkApiConnection();
});

// 检查 API 连接
async function checkApiConnection() {
    try {
        const response = await fetch(API_BASE_URL + '/health');
        const data = await response.json();
        console.log('✅ API 连接正常:', data);
    } catch (error) {
        console.warn('⚠️ API 连接异常:', error);
        showMessage('无法连接到服务器，请稍后重试', 'warning');
    }
}

// 页面切换
function showPage(pageId) {
    // 隐藏所有页面
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    
    // 更新导航栏
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });
    
    // 显示目标页面
    document.getElementById(`${pageId}-page`).classList.add('active');
    const navLink = document.querySelector(`[href="#${pageId}"]`);
    if (navLink) {
        navLink.classList.add('active');
    }
    
    // 加载页面数据
    switch(pageId) {
        case 'dashboard':
            loadDashboardData();
            loadRecentRecords();
            break;
        case 'records':
            loadRecords();
            break;
        case 'checkin':
            loadRecentCheckins();
            break;
        case 'stats':
            loadStats();
            break;
    }
}

// 显示消息提示
function showMessage(message, type = 'success') {
    const container = document.getElementById('message-container');
    if (!container) {
        console.log(`${type.toUpperCase()}: ${message}`);
        return;
    }
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}`;
    
    let icon = '';
    switch(type) {
        case 'success':
            icon = '<i class="fas fa-check-circle"></i>';
            break;
        case 'error':
            icon = '<i class="fas fa-exclamation-circle"></i>';
            break;
        case 'warning':
            icon = '<i class="fas fa-exclamation-triangle"></i>';
            break;
    }
    
    messageDiv.innerHTML = `
        ${icon}
        <span>${message}</span>
    `;
    
    container.appendChild(messageDiv);
    
    // 3秒后自动移除
    setTimeout(() => {
        messageDiv.style.opacity = '0';
        setTimeout(() => messageDiv.remove(), 300);
    }, 3000);
}

// 加载首页数据
async function loadDashboardData() {
    try {
        const response = await fetch(`${API_BASE_URL}/stats/summary`);
        const data = await response.json();
        
        if (data.success) {
            const summary = data.summary;
            if (document.getElementById('total-records')) {
                document.getElementById('total-records').textContent = summary.total_records;
            }
            if (document.getElementById('total-checkins')) {
                document.getElementById('total-checkins').textContent = summary.total_checkins;
            }
            if (document.getElementById('avg-mood')) {
                document.getElementById('avg-mood').textContent = summary.avg_mood_score;
            }
            if (document.getElementById('recent-records')) {
                document.getElementById('recent-records').textContent = summary.recent_records;
            }
        }
    } catch (error) {
        console.error('加载首页数据失败:', error);
        showMessage('加载数据失败', 'error');
    }
}

// ... (保持其他函数不变，但将所有 fetch 调用中的 URL 改为使用 API_BASE_URL)
// 例如：const response = await fetch(`${API_BASE_URL}/records?per_page=5`);
