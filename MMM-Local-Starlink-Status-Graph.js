Module.register('MMM-Local-Starlink-Status-Graph', {
    defaults: {
        title: 'Starlink Status', // Title to display above the graph
        updateInterval: 30 * 1000, // 30 seconds

        // Graph settings
        maxPoints: 20, // Maximum number of points to display on the graph
        chartHeight: 150, // Height of the chart in pixels
        chartWidth: '100%', // Width of the chart in pixels
        latencyColor: 'orange', // Color for the latency line
        downloadColor: 'blue', // Color for the download line
        uploadColor: 'green' // Color for the upload line
    },

    getScripts() {
        return ['https://cdn.jsdelivr.net/npm/chart.js']
    },

    start() {
        this.downloadData = []
        this.uploadData = []
        this.latencyData = []
        this.labels = []
        this.chart = null
        this.sendSocketNotification('START_STARLINK', this.config)
    },

    socketNotificationReceived(notification, payload) {
        if (notification === 'STARLINK_DATA') {
            const { download, upload, latency, timestamp } = payload

            this.labels.push(new Date(timestamp).toLocaleTimeString())
            this.downloadData.push(download)
            this.uploadData.push(upload)
            this.latencyData.push(latency)

            if (this.downloadData.length > this.config.maxPoints) {
                this.labels.shift()
                this.downloadData.shift()
                this.uploadData.shift()
                this.latencyData.shift()
            }

            if (this.chart) {
                this.chart.data.labels = this.labels
                this.chart.data.datasets[0].data = this.downloadData
                this.chart.data.datasets[1].data = this.uploadData
                this.chart.data.datasets[2].data = this.latencyData
                this.chart.update()
            }
        }
    },

    getDom() {
        const wrapper = document.createElement('div')
        wrapper.style.width = this.config.chartWidth
        wrapper.style.height = this.config.chartHeight + 'px'
        wrapper.style.minWidth = this.config.chartWidth + 'px'
        wrapper.style.minHeight = this.config.chartHeight + 'px'

        if (this.config.title) {
            const titleEl = document.createElement('div')

            titleEl.style.textAlign = 'center'
            titleEl.style.fontWeight = 'bold'
            titleEl.style.marginBottom = '5px'
            titleEl.innerText = this.config.title

            wrapper.appendChild(titleEl)
        }

        if (!this.canvas) {
            this.canvas = document.createElement('canvas')
            this.canvas.id = 'starlinkChart'
            this.canvas.style.width = '100%'
            this.canvas.style.height = '100%'
            wrapper.appendChild(this.canvas)

            if (typeof Chart !== 'undefined' && !this.chart) {
                this.chart = new Chart(this.canvas, {
                    type: 'line',
                    data: {
                        labels: this.labels,
                        datasets: [
                            {
                                fill: true,
                                label: '⬇️ Download (Mo/s)',
                                borderColor: this.config.downloadColor,
                                data: this.downloadData
                            },
                            {
                                fill: false,
                                label: '⬆️ Upload (Mo/s)',
                                borderColor: this.config.uploadColor,
                                data: this.uploadData
                            },
                            {
                                fill: false,
                                label: '⏱️ Latence (ms)',
                                borderColor: this.config.latencyColor,
                                data: this.latencyData
                            }
                        ]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        animation: false,
                        plugins: { legend: { display: true } },
                        scales: {
                            y: { beginAtZero: true }
                        }
                    }
                })
            }
        } else {
            wrapper.appendChild(this.canvas)
        }

        return wrapper
    }
})
