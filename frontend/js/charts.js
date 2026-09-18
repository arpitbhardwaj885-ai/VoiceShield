/**
 * VoiceShield - Telemetry & Analytical Chart Controller
 * Wraps Chart.js to render cosmic-editorial visual themes:
 * - Threat Ingestion Trend (Area Spline Chart)
 * - Classification Distribution (Doughnut Chart)
 * Relies on: Chart.js (v4.x+), js/config.js, js/utils.js
 */

const Charts = {
  instances: {
    threatTimeline: null,
    classificationDoughnut: null
  },

  // Unified color palette matching VoiceShield UI theme
  palette: {
    voidDark: '#030407',
    surfaceCard: 'rgba(13, 17, 27, 0.85)',
    gridLine: 'rgba(255, 255, 255, 0.06)',
    textMuted: '#94A3B8',
    cyan: '#4CC9F0',
    cyanAlpha: 'rgba(76, 201, 240, 0.15)',
    flareRed: '#FF3B30',
    flareRedAlpha: 'rgba(255, 59, 48, 0.15)',
    warningAmber: '#FFB703',
    successGreen: '#10B981'
  },

  /**
   * Initializes global Chart.js defaults to match the cosmic dark aesthetic.
   */
  applyGlobalDefaults() {
    if (typeof Chart === 'undefined') {
      console.warn('[VoiceShield Charts] Chart.js library not detected on window.');
      return;
    }

    Chart.defaults.color = this.palette.textMuted;
    Chart.defaults.font.family = "'JetBrains Mono', monospace";
    Chart.defaults.font.size = 11;
    Chart.defaults.responsive = true;
    Chart.defaults.maintainAspectRatio = false;

    // Cosmic glass tooltip styling
    Chart.defaults.plugins.tooltip.backgroundColor = 'rgba(8, 11, 18, 0.92)';
    Chart.defaults.plugins.tooltip.titleColor = '#FFFFFF';
    Chart.defaults.plugins.tooltip.bodyColor = '#E2E8F0';
    Chart.defaults.plugins.tooltip.borderColor = 'rgba(255, 255, 255, 0.15)';
    Chart.defaults.plugins.tooltip.borderWidth = 1;
    Chart.defaults.plugins.tooltip.padding = 10;
    Chart.defaults.plugins.tooltip.cornerRadius = 8;
    Chart.defaults.plugins.tooltip.displayColors = true;
  },

  /**
   * Renders the Threat Ingestion Spline Area Chart (Timeline).
   * @param {string|HTMLCanvasElement} canvasTarget - Canvas element or its ID
   * @param {Object} data - Contains labels and dataset points
   */
  renderThreatTimeline(canvasTarget, data) {
    const canvas = typeof canvasTarget === 'string' ? document.getElementById(canvasTarget) : canvasTarget;
    if (!canvas || typeof Chart === 'undefined') return;

    this.applyGlobalDefaults();

    // Destroy existing instance if rerendering
    if (this.instances.threatTimeline) {
      this.instances.threatTimeline.destroy();
    }

    const ctx = canvas.getContext('2d');

    // Create glowing vertical linear gradients for the datasets
    const gradientRed = ctx.createLinearGradient(0, 0, 0, canvas.height || 260);
    gradientRed.addColorStop(0, 'rgba(255, 59, 48, 0.35)');
    gradientRed.addColorStop(1, 'rgba(255, 59, 48, 0.00)');

    const gradientCyan = ctx.createLinearGradient(0, 0, 0, canvas.height || 260);
    gradientCyan.addColorStop(0, 'rgba(76, 201, 240, 0.30)');
    gradientCyan.addColorStop(1, 'rgba(76, 201, 240, 0.00)');

    const chartLabels = data?.labels || ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00', '23:59'];
    const cloneData = data?.clones || [4, 7, 2, 14, 28, 19, 31];
    const authenticData = data?.authentic || [38, 42, 51, 68, 85, 72, 94];

    this.instances.threatTimeline = new Chart(ctx, {
      type: 'line',
      data: {
        labels: chartLabels,
        datasets: [
          {
            label: 'AI Clone Intercepts',
            data: cloneData,
            borderColor: this.palette.flareRed,
            backgroundColor: gradientRed,
            borderWidth: 2,
            tension: 0.35,
            fill: true,
            pointBackgroundColor: this.palette.flareRed,
            pointBorderColor: '#FFFFFF',
            pointBorderWidth: 1,
            pointRadius: 3,
            pointHoverRadius: 6
          },
          {
            label: 'Organic Voice Scans',
            data: authenticData,
            borderColor: this.palette.cyan,
            backgroundColor: gradientCyan,
            borderWidth: 2,
            tension: 0.35,
            fill: true,
            pointBackgroundColor: this.palette.cyan,
            pointBorderColor: '#FFFFFF',
            pointBorderWidth: 1,
            pointRadius: 3,
            pointHoverRadius: 6
          }
        ]
      },
      options: {
        interaction: {
          mode: 'index',
          intersect: false
        },
        plugins: {
          legend: {
            position: 'top',
            align: 'end',
            labels: {
              boxWidth: 10,
              boxHeight: 10,
              usePointStyle: true,
              pointStyle: 'circle',
              color: '#94A3B8'
            }
          }
        },
        scales: {
          x: {
            grid: {
              color: this.palette.gridLine,
              drawBorder: false
            },
            ticks: {
              color: this.palette.textMuted
            }
          },
          y: {
            grid: {
              color: this.palette.gridLine,
              drawBorder: false
            },
            ticks: {
              color: this.palette.textMuted,
              stepSize: 10
            },
            beginAtZero: true
          }
        }
      }
    });

    return this.instances.threatTimeline;
  },

  /**
   * Renders the Classification Verdict Breakdown (Doughnut Chart).
   * @param {string|HTMLCanvasElement} canvasTarget - Canvas element or its ID
   * @param {Object} counts - Object containing { critical, anomalous, authentic } counts
   */
  renderClassificationDoughnut(canvasTarget, counts) {
    const canvas = typeof canvasTarget === 'string' ? document.getElementById(canvasTarget) : canvasTarget;
    if (!canvas || typeof Chart === 'undefined') return;

    this.applyGlobalDefaults();

    if (this.instances.classificationDoughnut) {
      this.instances.classificationDoughnut.destroy();
    }

    const ctx = canvas.getContext('2d');
    const values = [
      counts?.critical !== undefined ? counts.critical : 38,
      counts?.anomalous !== undefined ? counts.anomalous : 14,
      counts?.authentic !== undefined ? counts.authentic : 186
    ];

    this.instances.classificationDoughnut = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Critical Clones', 'Phase Anomalies', 'Authentic Voice'],
        datasets: [
          {
            data: values,
            backgroundColor: [
              this.palette.flareRed,
              this.palette.warningAmber,
              this.palette.successGreen
            ],
            borderColor: '#080B12',
            borderWidth: 3,
            hoverOffset: 4
          }
        ]
      },
      options: {
        cutout: '74%',
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              boxWidth: 8,
              boxHeight: 8,
              usePointStyle: true,
              pointStyle: 'circle',
              padding: 16,
              color: '#94A3B8'
            }
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                const value = context.raw || 0;
                const pct = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                return ` ${context.label}: ${value} (${pct}%)`;
              }
            }
          }
        }
      }
    });

    return this.instances.classificationDoughnut;
  },

  /**
   * Updates an existing timeline chart instance with fresh telemetry arrays.
   * @param {Array<string>} labels 
   * @param {Array<number>} clonePoints 
   * @param {Array<number>} authenticPoints 
   */
  updateTimeline(labels, clonePoints, authenticPoints) {
    const chart = this.instances.threatTimeline;
    if (!chart) return;

    if (labels) chart.data.labels = labels;
    if (clonePoints) chart.data.datasets[0].data = clonePoints;
    if (authenticPoints) chart.data.datasets[1].data = authenticPoints;

    chart.update('active');
  },

  /**
   * Destroys all registered Chart instances to release memory on view teardown.
   */
  destroyAll() {
    Object.keys(this.instances).forEach(key => {
      if (this.instances[key]) {
        this.instances[key].destroy();
        this.instances[key] = null;
      }
    });
  }
};

// Freeze API to protect configuration
Object.freeze(Charts);