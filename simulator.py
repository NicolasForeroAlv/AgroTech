import random
import math
from typing import Dict, List

class CropSimulator:
    """Simulador de cultivos agrícolas inteligente"""
    
    def __init__(self, crop_type='maize', initial_moisture=60, 
                 initial_temperature=25, area_size=1):
        """
        Inicializa el simulador de cultivos
        
        Args:
            crop_type: Tipo de cultivo (maize, wheat, rice, potato, tomato)
            initial_moisture: Humedad inicial del suelo (0-100)
            initial_temperature: Temperatura inicial en °C
            area_size: Tamaño del área en hectáreas
        """
        # Validación estricta
        if not (0 <= initial_moisture <= 100):
            raise ValueError("Humedad debe estar entre 0% y 100%.")
        if not (0 <= initial_temperature <= 80):
            raise ValueError("Temperatura debe estar entre 0°C y 80°C.")
        self.crop_type = crop_type
        self.area_size = area_size
        self.day = 0
        self.initial_moisture = initial_moisture
        self.initial_temperature = initial_temperature
        
        # Configuración por tipo de cultivo
        self.crop_config = {
            'maize': {
                'optimal_moisture': 70,
                'optimal_temp': 25,
                'optimal_ph': 6.5,
                'water_demand': 600,
                'growth_days': 120,
                'nitrogen_demand': 150,
                'name': 'Maíz'
            },
            'wheat': {
                'optimal_moisture': 65,
                'optimal_temp': 18,
                'optimal_ph': 7.0,
                'water_demand': 400,
                'growth_days': 150,
                'nitrogen_demand': 100,
                'name': 'Trigo'
            },
            'rice': {
                'optimal_moisture': 85,
                'optimal_temp': 28,
                'optimal_ph': 6.8,
                'water_demand': 1200,
                'growth_days': 150,
                'nitrogen_demand': 120,
                'name': 'Arroz'
            },
            'potato': {
                'optimal_moisture': 75,
                'optimal_temp': 18,
                'optimal_ph': 6.2,
                'water_demand': 500,
                'growth_days': 90,
                'nitrogen_demand': 140,
                'name': 'Papa'
            },
            'tomato': {
                'optimal_moisture': 70,
                'optimal_temp': 26,
                'optimal_ph': 6.5,
                'water_demand': 400,
                'growth_days': 85,
                'nitrogen_demand': 120,
                'name': 'Tomate'
            }
        }
        
        # Estado inicial
        self.soil_moisture = initial_moisture
        self.temperature = initial_temperature
        self.ph_level = 6.5
        self.nitrogen = 100
        self.potassium = 80
        self.phosphorus = 60
        self.productivity = 0
        self.plant_health = 100
        self.irrigation_applied = 0
        self.rainfall = 0
        self.pest_pressure = random.randint(5, 15)
        self.disease_pressure = random.randint(2, 8)
        
        # Historial
        self.history = []
        self._save_history()
    
    def _save_history(self):
        """Guarda el estado actual en el historial"""
        self.history.append({
            'day': self.day,
            'soil_moisture': round(self.soil_moisture, 2),
            'temperature': round(self.temperature, 2),
            'ph_level': round(self.ph_level, 2),
            'nitrogen': round(self.nitrogen, 2),
            'productivity': round(self.productivity, 2),
            'plant_health': round(self.plant_health, 2),
            'irrigation_applied': round(self.irrigation_applied, 2),
            'rainfall': round(self.rainfall, 2),
            'pest_pressure': self.pest_pressure,
            'disease_pressure': self.disease_pressure
        })
    
    def _simulate_weather(self):
        """Simula condiciones climáticas"""
        # Variación de temperatura (patrón estacional más pronunciado)
        seasonal_variation = 8 * math.sin(self.day / 60)  # Ciclo más corto
        daily_variation = random.uniform(-4, 4)
        temp_variation = seasonal_variation + daily_variation
    
        # Temperatura base según el día (simula estaciones)
        base_temp = self.initial_temperature + (math.sin(self.day / 45) * 10)
        self.temperature = max(10, min(38, base_temp + temp_variation))
    
        # Simulación de lluvia (probabilidad variable)
        rainfall_probability = 0.25 if self.soil_moisture < 70 else 0.15
        if random.random() < rainfall_probability:
            self.rainfall = random.uniform(0, 15)  # Lluvia más moderada
        else:
            self.rainfall = 0
    
    def _simulate_soil_dynamics(self):
        """Simula cambios en el suelo"""
        config = self.crop_config[self.crop_type]
        
        # Evaporación MÁS AGRESIVA según temperatura
        evaporation_rate = 0.8 + (self.temperature / 50)  # 0.8 a 1.6
        
        # Pérdida por transpiración de la planta
        transpiration = 0.5 + (self.plant_health / 200)  # 0.5 a 1.0
        
        # Drenaje natural cuando hay exceso de humedad
        drainage = 0.3 if self.soil_moisture > 80 else 0
        
        # Cambio en humedad del suelo
        moisture_loss = evaporation_rate + transpiration + drainage
        self.soil_moisture = max(0, self.soil_moisture - moisture_loss)
        
        # Añadir lluvia (más moderada)
        self.soil_moisture += self.rainfall * 0.5  # La lluvia no se absorbe 100%
        
        # Añadir riego
        self.soil_moisture += self.irrigation_applied
        
        # Limitar a 100%
        self.soil_moisture = min(100, self.soil_moisture)
        
        # Cambio en nutrientes (más lento)
        self.nitrogen = max(0, self.nitrogen - 0.3)  # Reducido de 0.8 a 0.3
        self.potassium = max(0, self.potassium - 0.2)
        self.phosphorus = max(0, self.phosphorus - 0.15)
        
        # pH ajustado por humedad
        self.ph_level = 6.5 + (self.soil_moisture - 60) / 150
        self.ph_level = max(5.5, min(8.0, self.ph_level))
        
        # Reiniciar riego aplicado
        self.irrigation_applied = 0
    def _calculate_plant_health(self):
        """Calcula la salud de las plantas"""
        config = self.crop_config[self.crop_type]
        
        # Efectos de variables óptimas
        moisture_score = 100 - abs(self.soil_moisture - config['optimal_moisture'])
        temp_score = 100 - abs(self.temperature - config['optimal_temp']) * 2
        pH_score = 100 - abs(self.ph_level - config['optimal_ph']) * 10
        nitrogen_score = min(100, (self.nitrogen / config['nitrogen_demand']) * 100)
        
        # Promedio ponderado
        health = (moisture_score * 0.3 + temp_score * 0.3 + 
                 pH_score * 0.2 + nitrogen_score * 0.2)
        
        # Efectos de plagas y enfermedades
        pest_damage = self.pest_pressure * 0.5
        disease_damage = self.disease_pressure * 0.8
        
        health = max(0, min(100, health - pest_damage - disease_damage))
        
        return health
    
    def _update_productivity(self):
        """Actualiza productividad según salud y crecimiento"""
        config = self.crop_config[self.crop_type]
        
        # Factor de crecimiento diario
        growth_factor = (self.day / config['growth_days']) * self.plant_health / 100
        growth_factor = min(1.0, growth_factor)
        
        # Productividad en toneladas por hectárea
        base_yield = {
            'maize': 8,
            'wheat': 7,
            'rice': 6,
            'potato': 20,
            'tomato': 80
        }
        
        self.productivity = growth_factor * base_yield[self.crop_type] * self.area_size
    
    def _simulate_pests_diseases(self):
        """Simula plagas y enfermedades"""
        # Incremento de plagas con humedad alta y temperatura cálida
        pest_factor = 0.1 if self.soil_moisture > 80 else 0.05
        pest_factor += 0.1 if self.temperature > 28 else 0
        
        self.pest_pressure = max(0, min(100, 
            self.pest_pressure + random.uniform(-2, 2) + pest_factor
        ))
        
        # Incremento de enfermedades con humedad
        disease_factor = 0.2 if self.soil_moisture > 80 else 0.05
        self.disease_pressure = max(0, min(100,
            self.disease_pressure + random.uniform(-1, 1) + disease_factor
        ))
    
    def step(self):
        """Ejecuta un paso de simulación (un día)"""
        self.day += 1
        
        # Simulaciones
        self._simulate_weather()
        self._simulate_soil_dynamics()
        self._simulate_pests_diseases()
        
        # Calcular salud de plantas
        self.plant_health = self._calculate_plant_health()
        
        # Actualizar productividad
        self._update_productivity()
        
        # Guardar en historial
        self._save_history()
    
    def apply_irrigation(self, amount=20):
        """Aplica riego automático"""
        self.irrigation_applied = min(amount, 100 - self.soil_moisture)
    
    def apply_fertilizer(self, nitrogen=20, phosphorus=10, potassium=15):
        """Aplica fertilizante"""
        self.nitrogen = min(300, self.nitrogen + nitrogen)
        self.phosphorus = min(200, self.phosphorus + phosphorus)
        self.potassium = min(250, self.potassium + potassium)
    
    def apply_pest_control(self, efficiency=0.6):
        """Aplica control de plagas"""
        self.pest_pressure = max(0, self.pest_pressure * (1 - efficiency))
    
    def apply_disease_control(self, efficiency=0.7):
        """Aplica control de enfermedades"""
        self.disease_pressure = max(0, self.disease_pressure * (1 - efficiency))
    
    def get_recommendations(self) -> List[str]:
        """Genera recomendaciones inteligentes"""
        config = self.crop_config[self.crop_type]
        recommendations = []
        
        # Recomendaciones de riego
        if self.soil_moisture < config['optimal_moisture'] - 10:
            recommendations.append(
                f"Riego urgente: Humedad en {self.soil_moisture:.0f}% "
                f"(óptimo: {config['optimal_moisture']}%)"
            )
        elif self.soil_moisture < config['optimal_moisture']:
            recommendations.append("Aumentar riego gradualmente")
        
        if self.soil_moisture > 85:
            recommendations.append("Riesgo de encharcamiento - Mejorar drenaje")
        
        # Recomendaciones de fertilización
        if self.nitrogen < config['nitrogen_demand'] * 0.5:
            recommendations.append(
                f"Aplicar fertilizante nitrogenado urgentemente "
                f"(Nitrógeno: {self.nitrogen:.0f})"
            )
        elif self.nitrogen < config['nitrogen_demand'] * 0.7:
            recommendations.append(
                "Considerar fertilización pronto - Nitrógeno bajando"
            )
        
        # Recomendaciones de temperatura
        if abs(self.temperature - config['optimal_temp']) > 8:
            if self.temperature > config['optimal_temp']:
                recommendations.append("Temperatura muy alta - Aumentar riego")
            else:
                recommendations.append("Temperatura baja - Proteger cultivo")
        
        # Recomendaciones de plagas
        if self.pest_pressure > 50:
            recommendations.append(
                f"Plagas detectadas ({self.pest_pressure:.0f}%) - Aplicar control"
            )
        
        # Recomendaciones de enfermedades
        if self.disease_pressure > 30:
            recommendations.append(
                f"Riesgo de enfermedad alto - Aplicar fungicida"
            )
        
        if not recommendations:
            recommendations.append("Condiciones óptimas - Continuar monitoreo")
        
        return recommendations[:5]  # Limitar a 5 recomendaciones

    def get_irrigation_decision(self) -> Dict:
        """Toma decisión automática de riego"""
        config = self.crop_config[self.crop_type]
        decision = {
            'irrigate': False,
            'amount': 0,
            'reason': ''
        }
        
        # Verificar humedad excesiva PRIMERO
        if self.soil_moisture > config['optimal_moisture'] + 15:
            decision['irrigate'] = False
            decision['reason'] = f"Humedad excesiva: {self.soil_moisture:.1f}% - Suspender riego"

        # Decisión basada en humedad
        elif self.soil_moisture < config['optimal_moisture'] - 5:
            decision['irrigate'] = True
            deficit = config['optimal_moisture'] - self.soil_moisture
            decision['amount'] = min(30, deficit * 0.8)
            decision['reason'] = f"Déficit de humedad: {deficit:.1f}%"
        
        # Considerar lluvia
        elif self.rainfall > 10:
            decision['irrigate'] = False
            decision['reason'] = f"Lluvia suficiente: {self.rainfall:.1f}mm"

        #Razón por defecto
        else:
            decision['reason'] = f"Humedad adecuada: {self.soil_moisture:.1f}%"
        
        # Aplicar riego si es necesario
        if decision['irrigate']:
            self.apply_irrigation(decision['amount'])
        
        return decision
    
    def get_current_state(self) -> Dict:
        """Obtiene el estado actual del simulador"""
        config = self.crop_config[self.crop_type]
        
        return {
            'crop_name': config['name'],
            'soil_moisture': round(self.soil_moisture, 2),
            'temperature': round(self.temperature, 2),
            'rainfall': round(self.rainfall, 2),
            'ph_level': round(self.ph_level, 2),
            'nitrogen': round(self.nitrogen, 2),
            'potassium': round(self.potassium, 2),
            'phosphorus': round(self.phosphorus, 2),
            'plant_health': round(self.plant_health, 2),
            'productivity': round(self.productivity, 2),
            'pest_pressure': round(self.pest_pressure, 2),
            'disease_pressure': round(self.disease_pressure, 2),
            'irrigation_applied': round(self.irrigation_applied, 2)
        }
