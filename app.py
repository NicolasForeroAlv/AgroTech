from flask import Flask, render_template, jsonify, request
from simulator import CropSimulator
from datetime import datetime, timedelta
import json
import os

app = Flask(__name__)

# Inicializar simulador global
simulator = CropSimulator()

@app.route('/')
def index():
    """Página principal del dashboard"""
    return render_template('index.html')

@app.route('/api/simulation/start', methods=['POST'])
def start_simulation():
    """Inicia una nueva simulación con parámetros iniciales"""
    global simulator
    
    data = request.json or {}
    # 1. Parseo seguro de números
    try:
        initial_moisture = float(data.get('initial_moisture', 60))
        initial_temperature = float(data.get('initial_temperature', 25))
        area_size = float(data.get('area_size', 1))
    except (ValueError, TypeError):
        return jsonify({'status': 'error', 'message': 'Ingrese valores numéricos válidos.'}), 400

    # 2. Instanciación con validación del simulador
    try:
        crop_type = data.get('crop_type', 'maize')
        initial_moisture = data.get('initial_moisture', 60)
        initial_temperature = data.get('initial_temperature', 25)
        area_size = data.get('area_size', 1)
        simulator = CropSimulator(
            crop_type=data.get('crop_type', 'maize'),
            initial_moisture=initial_moisture,
            initial_temperature=initial_temperature,
            area_size=area_size
        )
        return jsonify({
            'status': 'success',
            'message': 'Simulación iniciada',
            'simulator_state': simulator.get_current_state()
        })
    except ValueError as e:
        return jsonify({'status': 'error', 'message': str(e)}), 400
    
@app.route('/api/simulation/step', methods=['POST'])
def step_simulation():
    """Avanza un paso en la simulación"""
    try:
        simulator.step()
        
        state = simulator.get_current_state()
        recommendations = simulator.get_recommendations()
        irrigation_decision = simulator.get_irrigation_decision()
        
        return jsonify({
            'status': 'success',
            'day': simulator.day,
            'state': state,
            'recommendations': recommendations,
            'irrigation_decision': irrigation_decision
        })
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 400

@app.route('/api/simulation/auto-run', methods=['POST'])
def auto_run_simulation():
    """Ejecuta múltiples pasos automáticamente"""
    try:
        data = request.json or {}
        steps = data.get('steps', 7)
        
        results = []
        for _ in range(steps):
            simulator.step()
            state = simulator.get_current_state()
            state['day'] = simulator.day
            results.append(state)
        
        return jsonify({
            'status': 'success',
            'results': results,
            'recommendations': simulator.get_recommendations(),
            'irrigation_decision': simulator.get_irrigation_decision()
        })
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 400

@app.route('/api/simulation/state', methods=['GET'])
def get_simulation_state():
    """Obtiene el estado actual de la simulación"""
    state = simulator.get_current_state()
    state['day'] = simulator.day
    
    return jsonify({
        'status': 'success',
        'day': simulator.day,
        'state': state,
        'crop_type': simulator.crop_type,
        'area_size': simulator.area_size,
        'history': {
            'days': list(range(len(simulator.history))),
            'soil_moisture': [h['soil_moisture'] for h in simulator.history],
            'temperature': [h['temperature'] for h in simulator.history],
            'ph_level': [h['ph_level'] for h in simulator.history],
            'nitrogen': [h['nitrogen'] for h in simulator.history],
            'productivity': [h['productivity'] for h in simulator.history],
            'irrigation_applied': [h['irrigation_applied'] for h in simulator.history]
        },
        'recommendations': simulator.get_recommendations(),
        'irrigation_decision': simulator.get_irrigation_decision()
    })

@app.route('/api/simulation/reset', methods=['POST'])
def reset_simulation():
    """Reinicia la simulación"""
    global simulator
    simulator = CropSimulator()
    
    return jsonify({
        'status': 'success',
        'message': 'Simulación reiniciada',
        'simulator_state': simulator.get_current_state()
    })

@app.route('/api/simulation/history', methods=['GET'])
def get_history():
    """Obtiene el historial completo de la simulación"""
    return jsonify({
        'status': 'success',
        'history': simulator.history,
        'day': simulator.day
    })

@app.route('/api/simulation/config', methods=['GET'])
def get_config():
    """Obtiene la configuración actual del simulador"""
    return jsonify({
        'crop_types': ['maize', 'wheat', 'rice', 'potato', 'tomato'],
        'current_config': {
            'crop_type': simulator.crop_type,
            'area_size': simulator.area_size,
            'initial_moisture': simulator.initial_moisture,
            'initial_temperature': simulator.initial_temperature
        }
    })

if __name__ == '__main__':
    # Render asigna un puerto dinámico mediante la variable de entorno PORT
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=False)
