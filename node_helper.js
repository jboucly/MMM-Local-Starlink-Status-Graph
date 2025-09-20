const NodeHelper = require('node_helper')
const { Dishy } = require('@gibme/starlink')

module.exports = NodeHelper.create({
    start() {
        console.log('Starting node_helper for MMM-Local-Starlink-Status-Graph')
    },

    socketNotificationReceived(notification, payload) {
        if (notification === 'START_STARLINK') {
            this.config = payload
            this.startFetching()
        }
    },

    async startFetching() {
        const dishy = new Dishy('192.168.100.1')

        setInterval(async () => {
            try {
                const status = await dishy.fetch_status()

                const download = +(status.downlinkThroughputBps / 8_000_000).toFixed(2) // Mo/s
                const upload = +(status.uplinkThroughputBps / 8_000_000).toFixed(2) // Mo/s
                const latency = +status.popPingLatencyMs.toFixed(1) // ms

                this.sendSocketNotification('STARLINK_DATA', {
                    download,
                    upload,
                    latency,
                    timestamp: Date.now()
                })
            } catch (err) {
                console.error('Erreur Starlink:', err)
            }
        }, this.config.updateInterval || 30000)
    }
})
