const { createApp } = Vue;

const API_BASE_URL = 'http://localhost:5000/api';

createApp({
    data() {
        return {
            activeTab: 'records',
            records: [],
            currentPage: 1,
            perPage: 9,
            totalPages: 1,
            searchKeyword: '',
            
            newRecord: {
                title: '',
                content: '',
                mood: '',
                weather: '',
                location: '',
                record_date: new Date().toISOString().split('T')[0],
                tags: ''
            },
            
            checkinData: {
                date: new Date().toISOString().split('T')[0],
                sleep_hours: null,
                exercise_minutes: null,
                water_intake: null,
                mood_score: null,
                notes: ''
            },
            
            moodOptions: ['开心', '平静', '兴奋', '紧张', '疲惫', '忧郁', '愤怒', '期待', '感恩', '无聊'],
            weatherOptions: ['晴天', '多云', '阴天', '小雨', '大雨', '雪', '雾', '大风'],
            
            statsYear: new Date().getFullYear(),
            statsMonth: new Date().getMonth() + 1,
            monthlyStats: [],
            tagStats: [],
            maxTagCount: 0,
            
            mediaFiles: []
        };
    },
    
    mounted() {
        this.loadRecords();
        this.loadTagAnalysis();
        this.initCharts();
    },
    
    methods: {
        async loadRecords() {
            try {
                const response = await axios.get(`${API_BASE_URL}/records`, {
                    params: {
                        page: this.currentPage,
                        per_page: this.perPage,
                        search: this.searchKeyword
                    }
                });
                
                this.records = response.data.records;
                this.totalPages = response.data.pages;
            } catch (error) {
                console.error('加载记录失败:', error);
            }
        },
        
        async submitRecord() {
            try {
                const formData = new FormData();
                
                // 添加文本数据
                Object.keys(this.newRecord).forEach(key => {
                    if (this.newRecord[key] !== null && this.newRecord[key] !== '') {
                        formData.append(key, this.newRecord[key]);
                    }
                });
                
                // 添加媒体文件
                this.mediaFiles.forEach(file => {
                    formData.append('media', file);
                });
                
                const response = await axios.post(`${API_BASE_URL}/records`, formData, {
                    headers: {
                        'Content-Type': 'multipart/form-data'
                    }
                });
                
                alert('记录创建成功！');
                this.resetNewRecord();
                this.activeTab = 'records';
                this.loadRecords();
            } catch (error) {
                console.error('创建记录失败:', error);
                alert('创建失败：' + error.response?.data?.error || error.message);
            }
        },
        
        async submitCheckin() {
            try {
                const response = await axios.post(`${API_BASE_URL}/checkins`, this.checkinData);
                alert('打卡成功！');
                this.resetCheckinData();
            } catch (error) {
                console.error('打卡失败:', error);
                alert('打卡失败：' + error.response?.data?.error || error.message);
            }
        },
        
        async loadMonthlyStats() {
            try {
                const response = await axios.get(`${API_BASE_URL}/stats/monthly`, {
                    params: {
                        year: this.statsYear,
                        month: this.statsMonth
                    }
                });
                
                this.monthlyStats = response.data.stats;
                this.renderMonthlyChart();
            } catch (error) {
                console.error('加载月度统计失败:', error);
            }
        },
        
        async loadTagAnalysis() {
            try {
                const response = await axios.get(`${API_BASE_URL}/tags/analysis`);
                this.tagStats = response.data.tags;
                this.maxTagCount = Math.max(...this.tagStats.map(t => t.count));
            } catch (error) {
                console.error('加载标签分析失败:', error);
            }
        },
        
        viewRecordDetail(id) {
            // 在实际项目中，这里可以跳转到详情页或打开模态框
            alert(`查看记录详情 ID: ${id}`);
        },
        
        changePage(page) {
            if (page >= 1 && page <= this.totalPages) {
                this.currentPage = page;
                this.loadRecords();
            }
        },
        
        handleMediaUpload(event) {
            this.mediaFiles = Array.from(event.target.files);
        },
        
        resetNewRecord() {
            this.newRecord = {
                title: '',
                content: '',
                mood: '',
                weather: '',
                location: '',
                record_date: new Date().toISOString().split('T')[0],
                tags: ''
            };
            this.mediaFiles = [];
        },
        
        resetCheckinData() {
            this.checkinData = {
                date: new Date().toISOString().split('T')[0],
                sleep_hours: null,
                exercise_minutes: null,
                water_intake: null,
                mood_score: null,
                notes: ''
            };
        },
        
        initCharts() {
            // 初始化图表
            this.monthlyChart = new Chart(
                document.getElementById('monthlyChart'),
                {
                    type: 'bar',
                    data: {
                        labels: [],
                        datasets: [{
                            label: '记录数量',
                            backgroundColor: 'rgba(99, 102, 241, 0.5)',
                            borderColor: 'rgb(99, 102, 241)',
                            borderWidth: 1,
                            data: []
                        }]
                    },
                    options: {
                        responsive: true,
                        scales: {
                            y: {
                                beginAtZero: true,
                                ticks: {
                                    stepSize: 1
                                }
                            }
                        }
                    }
                }
            );
        },
        
        renderMonthlyChart() {
            if (!this.monthlyChart) return;
            
            const labels = this.monthlyStats.map(s => s.date.split('-')[2] + '日');
            const data = this.monthlyStats.map(s => s.count);
            
            this.monthlyChart.data.labels = labels;
            this.monthlyChart.data.datasets[0].data = data;
            this.monthlyChart.update();
        }
    },
    
    watch: {
        activeTab() {
            if (this.activeTab === 'stats') {
                this.$nextTick(() => {
                    this.loadMonthlyStats();
                });
            }
        }
    }
}).mount('#app');
