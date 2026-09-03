import unittest
from backend.simulator.engine_sim import EngineSimulator
from backend.digital_twin.twin_service import DigitalTwinService
from backend.schemas.telemetry import FaultType


class TestEngineHealthFaultMap(unittest.TestCase):
    def setUp(self):
        self.sim = EngineSimulator(seed=100)
        self.twin = DigitalTwinService()

    def test_nominal_state_no_fault_component(self):
        obs = self.sim.step(dt_seconds=1.0)
        state = self.twin.update_twin(obs, active_fault=FaultType.NONE, fault_severity=0.0)
        self.assertEqual(state.status, "normal")
        self.assertIsNone(state.affected_component)

    def test_cylinder_misfire_component_localization(self):
        self.sim.inject_fault(FaultType.MISFIRE, severity=0.8)
        # Advance simulation past ramp
        for _ in range(12):
            obs = self.sim.step(dt_seconds=1.0)

        state = self.twin.update_twin(obs, active_fault=FaultType.MISFIRE, fault_severity=0.8)
        self.assertIsNotNone(state.affected_component)
        self.assertEqual(state.affected_component.component_id, "cylinder_2")
        self.assertEqual(state.affected_component.subsystem, "combustion")
        self.assertIn("Cylinder #2", state.affected_component.component_name)
        self.assertIn("Left Bank", state.affected_component.physical_location)
        self.assertEqual(state.affected_component.severity, "critical")

    def test_injector_abnormality_component_localization(self):
        self.sim.inject_fault(FaultType.INJECTOR_ABNORMALITY, severity=0.75)
        for _ in range(12):
            obs = self.sim.step(dt_seconds=1.0)

        state = self.twin.update_twin(obs, active_fault=FaultType.INJECTOR_ABNORMALITY, fault_severity=0.75)
        self.assertIsNotNone(state.affected_component)
        self.assertEqual(state.affected_component.component_id, "fuel_injector_2")
        self.assertEqual(state.affected_component.subsystem, "fuel")
        self.assertIn("Injector #2", state.affected_component.component_name)

    def test_oil_pressure_loss_component_localization(self):
        self.sim.inject_fault(FaultType.OIL_PRESSURE_LOSS, severity=0.7)
        for _ in range(12):
            obs = self.sim.step(dt_seconds=1.0)

        state = self.twin.update_twin(obs, active_fault=FaultType.OIL_PRESSURE_LOSS, fault_severity=0.7)
        self.assertIsNotNone(state.affected_component)
        self.assertEqual(state.affected_component.component_id, "oil_pump")
        self.assertEqual(state.affected_component.subsystem, "lubrication")
        self.assertIn("Oil", state.affected_component.component_name)

    def test_thermal_overheating_component_localization(self):
        self.sim.inject_fault(FaultType.OVERHEATING, severity=0.85)
        for _ in range(12):
            obs = self.sim.step(dt_seconds=1.0)

        state = self.twin.update_twin(obs, active_fault=FaultType.OVERHEATING, fault_severity=0.85)
        self.assertIsNotNone(state.affected_component)
        self.assertEqual(state.affected_component.component_id, "cylinder_head_3")
        self.assertEqual(state.affected_component.subsystem, "cooling")
        self.assertIn("Cylinder Head #3", state.affected_component.component_name)

    def test_vibration_spike_component_localization(self):
        self.sim.inject_fault(FaultType.VIBRATION_SPIKE, severity=0.8)
        for _ in range(12):
            obs = self.sim.step(dt_seconds=1.0)

        state = self.twin.update_twin(obs, active_fault=FaultType.VIBRATION_SPIKE, fault_severity=0.8)
        self.assertIsNotNone(state.affected_component)
        self.assertEqual(state.affected_component.component_id, "crankshaft_prop_interface")
        self.assertEqual(state.affected_component.subsystem, "propulsion")

    def test_sensor_drift_component_localization(self):
        self.sim.inject_fault(FaultType.SENSOR_DRIFT, severity=0.6)
        for _ in range(12):
            obs = self.sim.step(dt_seconds=1.0)

        state = self.twin.update_twin(obs, active_fault=FaultType.SENSOR_DRIFT, fault_severity=0.6)
        self.assertIsNotNone(state.affected_component)
        self.assertEqual(state.affected_component.component_id, "sensor_cht_3")
        self.assertEqual(state.affected_component.subsystem, "sensors")


if __name__ == "__main__":
    unittest.main()
