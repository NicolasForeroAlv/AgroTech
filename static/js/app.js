// Variables globales
let charts = {};
let simulationRunning = false;
let simulationHistory = [];
let simulatorDay = 0; // Variable global para trackear días

// Inicialización
document.addEventListener('DOMContentLoaded', function () {
    initializeCharts();
    console.log('Aplicación iniciada - Listo para simular');
    // Validación en tiempo real para inputs numéricos
    ['initialMoisture', 'initialTemp', 'areaSize'].forEach(id => {
        const input = document.getElementById(id);
        if (input) {
            input.addEventListener('blur', function () {
                const val = parseFloat(this.value);
                let msg = '';

                if (id === 'initialMoisture' && (isNaN(val) || val < 0 || val > 100)) {
                    msg = '0-100%';
                } else if (id === 'initialTemp' && (isNaN(val) || val < 0 || val > 80)) {
                    msg = '0-80°C';
                } else if (id === 'areaSize' && (isNaN(val) || val <= 0)) {
                    msg = '> 0';
                }

                this.classList.toggle('is-invalid', !!msg);
                this.title = msg || '';
            });
        }
    });
});

// Inicializar gráficos
function initializeCharts() {
    const chartConfig = {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
            legend: {
                display: true,
                position: 'top'
            }
        },
        scales: {
            y: {
                beginAtZero: true
            }
        }
    };

    // Gráfico de Humedad vs Temperatura
    const moistureCtx = document.getElementById('moistureChart').getContext('2d');
    charts.moisture = new Chart(moistureCtx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [
                {
                    label: 'Humedad del Suelo (%)',
                    data: [],
                    borderColor: '#3498db',
                    backgroundColor: 'rgba(52, 152, 219, 0.1)',
                    borderWidth: 2,
                    tension: 0.3,
                    fill: true,
                    yAxisID: 'y'
                },
                {
                    label: 'Temperatura (°C)',
                    data: [],
                    borderColor: '#e74c3c',
                    backgroundColor: 'rgba(231, 76, 60, 0.1)',
                    borderWidth: 2,
                    tension: 0.3,
                    fill: false,
                    yAxisID: 'y1'
                }
            ]
        },
        options: {
            ...chartConfig,
            scales: {
                y: {
                    type: 'linear',
                    display: true,
                    position: 'left',
                    title: { display: true, text: 'Humedad (%)' }
                },
                y1: {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    title: { display: true, text: 'Temperatura (°C)' },
                    grid: { drawOnChartArea: false }
                }
            }
        }
    });

    // Gráfico de Nutrientes
    const nutrientsCtx = document.getElementById('nutrientsChart').getContext('2d');
    charts.nutrients = new Chart(nutrientsCtx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [
                {
                    label: 'Nitrógeno',
                    data: [],
                    borderColor: '#2ecc71',
                    backgroundColor: 'rgba(46, 204, 113, 0.1)',
                    borderWidth: 2,
                    tension: 0.3
                },
                {
                    label: 'Fósforo',
                    data: [],
                    borderColor: '#f39c12',
                    backgroundColor: 'rgba(243, 156, 18, 0.1)',
                    borderWidth: 2,
                    tension: 0.3
                }
            ]
        },
        options: chartConfig
    });

    // Gráfico de Productividad
    const productivityCtx = document.getElementById('productivityChart').getContext('2d');
    charts.productivity = new Chart(productivityCtx, {
        type: 'bar',
        data: {
            labels: [],
            datasets: [
                {
                    label: 'Productividad (t/ha)',
                    data: [],
                    backgroundColor: [
                        '#2ecc71',
                        '#3498db',
                        '#f39c12',
                        '#e74c3c',
                        '#9b59b6'
                    ],
                    borderRadius: 5
                }
            ]
        },
        options: chartConfig
    });

    // Gráfico de Salud de Plantas
    const healthCtx = document.getElementById('healthChart').getContext('2d');
    charts.health = new Chart(healthCtx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [
                {
                    label: 'Salud de Plantas (%)',
                    data: [],
                    borderColor: '#2ecc71',
                    backgroundColor: 'rgba(46, 204, 113, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.3,
                    pointBackgroundColor: '#2ecc71',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    pointRadius: 4
                }
            ]
        },
        options: {
            ...chartConfig,
            scales: {
                y: {
                    min: 0,
                    max: 100
                }
            }
        }
    });
}

// Iniciar simulación
function startSimulation() {
    const cropType = document.getElementById('cropSelect').value;
    const areaSize = parseFloat(document.getElementById('areaSize').value);
    const initialMoisture = parseFloat(document.getElementById('initialMoisture').value);
    const initialTemp = parseFloat(document.getElementById('initialTemp').value);

    // Validación frontend
    const errores = [];
    if (isNaN(initialMoisture) || initialMoisture < 0 || initialMoisture > 100) {
        errores.push("Humedad debe estar entre 0% y 100%.");
    }
    if (isNaN(initialTemp) || initialTemp < 0 || initialTemp > 80) {
        errores.push("Temperatura debe estar entre 0°C y 80°C.");
    }
    if (isNaN(areaSize) || areaSize <= 0) {
        errores.push("Área debe ser mayor a 0 hectáreas.");
    }

    if (errores.length > 0) {
        mostrarError(errores.join('\n'));
        return; // Detiene ejecución
    }

    const data = {
        crop_type: cropType,
        area_size: areaSize,
        initial_moisture: initialMoisture,
        initial_temperature: initialTemp
    };

    fetch('/api/simulation/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    })
        .then(response => {
            // ✅ Verificar si la respuesta es OK antes de parsear
            if (!response.ok) {
                throw new Error('HTTP error! status: ' + response.status);
            }
            return response.json();
        })
        .then(data => {
            if (data.status === 'success') {
                simulationRunning = true;
                simulatorDay = 0;
                simulationHistory = [];
                document.getElementById('stepBtn').disabled = false;
                document.getElementById('startBtn').disabled = true;
                console.log('Simulación iniciada:', data.simulator_state);
                updateUI(data.simulator_state, 0, {}, {});
            } else {
                mostrarError(data.message || 'Error al iniciar simulación');
            }
        })
        .catch(error => {
            console.error('Error detallado:', error);
            // NO mostrar error automáticamente
            // Solo mostrar si es un error REAL de red
            if (error.message && error.message.includes('HTTP error')) {
                mostrarError('Error de conexión con el servidor');
            }
            // Si es otro tipo de error, solo loguear (la simulación puede haber iniciado)
        });
}

// Paso de simulación - Avanzar 1 día
function stepSimulation() {
    if (!simulationRunning) {
        alert('Por favor, inicia una simulación primero');
        return;
    }

    fetch('/api/simulation/step', {
        method: 'POST'
    })
        .then(response => {
            if (!response.ok) {
                throw new Error('HTTP error! status: ' + response.status);
            }
            return response.json();
        })
        .then(data => {
            if (data.status === 'success') {
                simulatorDay = data.day;
                updateUI(data.state, data.day, data.recommendations, data.irrigation_decision);
                simulationHistory.push(data.state);
            } else {
                mostrarError(data.message || 'Error en el paso de simulación');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            mostrarError('Error al avanzar un día');
        });
}

// Ejecución automática
function autoRun(steps) {
    if (!simulationRunning) {
        alert('Por favor, inicia una simulación primero');
        return;
    }

    const data = { steps: steps };

    fetch('/api/simulation/auto-run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    })
        .then(response => response.json())
        .then(response => {
            if (response.status === 'success') {
                // Agregar todos los resultados al historial
                simulationHistory.push(...response.results);

                // Usar el último estado con el día correcto
                // En autoRun, al actualizar UI:
                const lastState = response.results[response.results.length - 1];
                const finalDay = simulatorDay + steps; // ← Día acumulado real
                updateUI(lastState, finalDay, response.recommendations, response.irrigation_decision);

                // Agregar cada resultado con su día correspondiente
                response.results.forEach((result, index) => {
                    const resultDay = simulatorDay + index + 1;
                    updateCharts(resultDay, result);
                });
                simulatorDay = finalDay; // ← Actualizar variable global
            }
        })
        .catch(error => {
            console.error('Error:', error);
            mostrarError('Error al ejecutar simulación automática');
        });
}

// Reiniciar simulación
function resetSimulation() {
    fetch('/api/simulation/reset', {
        method: 'POST'
    })
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                simulationRunning = false;
                simulationHistory = [];
                document.getElementById('stepBtn').disabled = true;
                document.getElementById('startBtn').disabled = false;

                // Limpiar gráficos
                Object.values(charts).forEach(chart => {
                    chart.data.labels = [];
                    chart.data.datasets.forEach(dataset => dataset.data = []);
                    chart.update();
                });

                // Resetear valores
                updateMetrics({});
                console.log('Simulación reiniciada');
            }
        })
        .catch(error => console.error('Error:', error));
}

// Actualizar interfaz
function updateUI(state, day, recommendations, irrigation_decision) {
    updateMetrics(state);
    updateCharts(day, state);
    updateRecommendations(recommendations);
    updateIrrigation(irrigation_decision);
    updateDetailedMetrics(state);

    // Actualizar contador de días
    document.getElementById('dayCounter').textContent = 'Día: ' + day;
}

// Actualizar métricas
function updateMetrics(state) {
    if (!state || Object.keys(state).length === 0) {
        document.getElementById('plantHealth').textContent = '0%';
        document.getElementById('productivity').textContent = '0 t/ha';
        document.getElementById('soilMoisture').textContent = '0%';
        document.getElementById('temperature').textContent = '0°C';
        document.getElementById('phLevel').textContent = '0';
        document.getElementById('nitrogen').textContent = '0';
        return;
    }

    document.getElementById('plantHealth').textContent = state.plant_health.toFixed(1) + '%';
    document.getElementById('productivity').textContent = state.productivity.toFixed(2) + ' t/ha';
    document.getElementById('soilMoisture').textContent = state.soil_moisture.toFixed(1) + '%';
    document.getElementById('temperature').textContent = state.temperature.toFixed(1) + '°C';
    document.getElementById('phLevel').textContent = state.ph_level.toFixed(2);
    document.getElementById('nitrogen').textContent = state.nitrogen.toFixed(1);

    // Actualizar barras de plagas y enfermedades
    document.getElementById('pestBar').style.width = state.pest_pressure + '%';
    document.getElementById('pestValue').textContent = state.pest_pressure.toFixed(0) + '%';

    document.getElementById('diseaseBar').style.width = state.disease_pressure + '%';
    document.getElementById('diseaseValue').textContent = state.disease_pressure.toFixed(0) + '%';
}

// Actualizar gráficos
function updateCharts(day, state) {
    if (!state || Object.keys(state).length === 0) return;

    // Evitar duplicados: si el día ya existe, no agregar
    const label = 'Día ' + day;
    if (charts.moisture.data.labels.includes(label)) return;

    // 📊 Humedad y Temperatura
    charts.moisture.data.labels.push(label);
    charts.moisture.data.datasets[0].data.push(state.soil_moisture);
    charts.moisture.data.datasets[1].data.push(state.temperature);

    // 📊 Nutrientes
    charts.nutrients.data.labels.push(label);
    charts.nutrients.data.datasets[0].data.push(state.nitrogen);
    charts.nutrients.data.datasets[1].data.push(state.phosphorus);

    // 📊 Productividad
    charts.productivity.data.labels.push(label);
    charts.productivity.data.datasets[0].data.push(state.productivity);

    // 📊 Salud
    charts.health.data.labels.push(label);
    charts.health.data.datasets[0].data.push(state.plant_health);

    // 🔄 Mantener máximo 50 puntos en todos los gráficos
    if (charts.moisture.data.labels.length > 50) {
        [charts.moisture, charts.nutrients, charts.productivity, charts.health].forEach(chart => {
            chart.data.labels.shift();
            chart.data.datasets.forEach(ds => ds.data.shift());
            chart.update('none'); // 'none' evita reanimación en cada punto
        });
    } else {
        // Actualizar solo si no se hizo shift
        [charts.moisture, charts.nutrients, charts.productivity, charts.health].forEach(chart => {
            chart.update('none');
        });
    }
}

// Actualizar recomendaciones
function updateRecommendations(recommendations) {
    const panel = document.getElementById('recommendationsPanel');

    if (!recommendations || recommendations.length === 0) {
        panel.innerHTML = '<p class="text-muted">Sin recomendaciones en este momento</p>';
        return;
    }

    panel.innerHTML = recommendations.map(rec =>
        `<div class="recommendation-item">${rec}</div>`
    ).join('');
}

// Actualizar decisión de riego
function updateIrrigation(irrigation) {
    const panel = document.getElementById('irrigationPanel');

    if (!irrigation || Object.keys(irrigation).length === 0) {
        panel.innerHTML = '<p class="text-muted">Inicia una simulación para ver decisiones de riego</p>';
        return;
    }

    const className = irrigation.irrigate ? 'yes' : 'no';
    const action = irrigation.irrigate ? 'ACTIVAR RIEGO' : 'NO REGAR';
    const amount = irrigation.amount ? `${irrigation.amount.toFixed(2)} litros/m²` : 'N/A';

    panel.innerHTML = `
        <div class="irrigation-decision ${className}">
            <strong>${action}</strong><br>
            Cantidad: ${amount}<br>
            Razón: ${irrigation.reason}
        </div>
    `;
}

// Actualizar métricas detalladas
function updateDetailedMetrics(state) {
    if (!state || Object.keys(state).length === 0) return;

    // Función auxiliar para obtener estado
    function getStatus(value, min, max) {
        if (value < min) return 'danger';
        if (value > max) return 'warning';
        return 'success';
    }

    // Humedad
    const moistureStatus = getStatus(state.soil_moisture, 60, 80);
    document.getElementById('metric-moisture').textContent = state.soil_moisture.toFixed(1) + '%';
    document.getElementById('status-moisture').textContent =
        moistureStatus === 'success' ? 'Óptima' :
            moistureStatus === 'warning' ? 'Excesiva' : 'Déficit';
    document.getElementById('status-moisture').className =
        'badge badge-' + (moistureStatus === 'danger' ? 'danger' : moistureStatus);

    // Temperatura
    const tempStatus = getStatus(state.temperature, 18, 28);
    document.getElementById('metric-temp').textContent = state.temperature.toFixed(1) + '°C';
    document.getElementById('status-temp').textContent =
        tempStatus === 'success' ? 'Óptima' :
            tempStatus === 'warning' ? 'Alta' : 'Baja';
    document.getElementById('status-temp').className =
        'badge badge-' + (tempStatus === 'danger' ? 'danger' : tempStatus);

    // pH
    const phStatus = getStatus(state.ph_level, 6.0, 7.0);
    document.getElementById('metric-ph').textContent = state.ph_level.toFixed(2);
    document.getElementById('status-ph').textContent =
        phStatus === 'success' ? 'Óptimo' :
            phStatus === 'warning' ? 'Alto' : 'Bajo';
    document.getElementById('status-ph').className =
        'badge badge-' + (phStatus === 'danger' ? 'danger' : phStatus);

    // Nitrógeno
    const nitrogenStatus = getStatus(state.nitrogen, 100, 200);
    document.getElementById('metric-nitrogen').textContent = state.nitrogen.toFixed(1);
    document.getElementById('status-nitrogen').textContent =
        nitrogenStatus === 'success' ? 'Adecuado' :
            nitrogenStatus === 'warning' ? 'Exceso' : 'Déficit';
    document.getElementById('status-nitrogen').className =
        'badge badge-' + (nitrogenStatus === 'danger' ? 'danger' : nitrogenStatus);

    // Salud
    const healthStatus = state.plant_health > 80 ? 'success' :
        state.plant_health > 50 ? 'warning' : 'danger';
    document.getElementById('metric-health').textContent = state.plant_health.toFixed(1) + '%';
    document.getElementById('status-health').textContent =
        healthStatus === 'success' ? 'Excelente' :
            healthStatus === 'warning' ? 'Regular' : 'Crítica';
    document.getElementById('status-health').className = 'badge badge-' + healthStatus;
}

// Exportar datos
function exportData() {
    fetch('/api/simulation/history')
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                const csv = convertToCSV(data.history);
                downloadCSV(csv, 'simulacion_agrotech.csv');
                console.log('Datos exportados');
            }
        })
        .catch(error => console.error('Error:', error));
}

// Convertir a CSV
function convertToCSV(data) {
    if (!data || data.length === 0) return '';

    const headers = Object.keys(data[0]);
    const csv = [headers.join(',')];

    data.forEach(row => {
        const values = headers.map(header => {
            const value = row[header];
            return typeof value === 'string' && value.includes(',')
                ? `"${value}"`
                : value;
        });
        csv.push(values.join(','));
    });

    return csv.join('\n');
}

// Descargar CSV
function downloadCSV(csv, filename) {
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
}

function mostrarError(mensaje) {
    // Opción 1: Alert nativo (simple)
    alert('⚠️ Error de validación:\n\n' + mensaje);

    // Opción 2: Toast/Modal (mejor UX - descomenta si tienes Bootstrap)
    /*
    const toast = document.getElementById('errorToast');
    if (toast) {
        document.querySelector('#errorToast .toast-body').textContent = mensaje;
        new bootstrap.Toast(toast).show();
    }
    */

    // Opción 3: Insertar en DOM (personalizable)
    /*
    let errorDiv = document.getElementById('validationError');
    if (!errorDiv) {
        errorDiv = document.createElement('div');
        errorDiv.id = 'validationError';
        errorDiv.className = 'alert alert-danger m-3';
        document.querySelector('.container').prepend(errorDiv);
    }
    errorDiv.textContent = mensaje;
    setTimeout(() => errorDiv.remove(), 5000);
    */
}

console.log('Script JavaScript cargado correctamente');
