import unittest
from backend.simulator.engine_sim import EngineSimulator
from backend.physics.physics_model import PhysicsEngineModel
from backend.digital_twin.twin_service import DigitalTwinService
from backend.schemas.telemetry import MissionPhase, FaultType


class TestAeroTwinBackend(unittest.TestCase):

    def setUp(self):
        self.sim = EngineSimulator(seed=100)
        self.physics = PhysicsEngineModel()
        self.twin_svc = DigitalTwinService()

    def test_simulator_determinism(self):
        sim1 = EngineSimulator(seed=42)
        rec1 = sim1.step()

        sim2 = EngineSimulator(seed=42)
        rec2 = sim2.step()

        self.assertEqual(rec1.rpm, rec2.rpm)
        self.assertEqual(rec1.cht_c, rec2.cht_c)
        self.assertEqual(rec1.egt_c, rec2.egt_c)
        self.assertEqual(rec1.oil_pressure_psi, rec2.oil_pressure_psi)

    def test_physics_model_expected_values(self):
        expected = self.physics.compute_expected(
            timestamp=10.0,
            throttle_pct=75.0,
            altitude_ft=10000.0,
            ambient_temp_c=0.0,
            mission_phase=MissionPhase.CRUISE
        )
        self.assertGreater(expected.rpm, 3000.0)
        self.assertGreater(expected.cht_c, 100.0)
        self.assertGreater(expected.egt_c, 400.0)
        self.assertGreater(expected.oil_pressure_psi, 40.0)

    def test_fault_injection_and_residual_growth(self):
        # 1. Step without fault
        normal_obs = self.sim.step()
        normal_twin = self.twin_svc.update_twin(normal_obs)
        self.assertEqual(normal_twin.status, "normal")

        # 2. Inject misfire fault
        self.sim.inject_fault(FaultType.MISFIRE, severity=0.9)
        for _ in range(12):  # Step 12 seconds to let fault ramp up
            fault_obs = self.sim.step()

        fault_twin = self.twin_svc.update_twin(fault_obs, active_fault=FaultType.MISFIRE, fault_severity=0.9)
        self.assertGreater(fault_twin.residuals.vibration_g, 0.5)
        self.assertIn(fault_twin.status, ["warning", "critical"])
        self.assertTrue(len(fault_twin.alerts) > 0)
        self.assertIn("Misfire", fault_twin.alerts[0].candidate_fault)

    def test_oil_pressure_loss_diagnosis(self):
        self.sim.inject_fault(FaultType.OIL_PRESSURE_LOSS, severity=0.8)
        for _ in range(12):
            obs = self.sim.step()
        
        twin = self.twin_svc.update_twin(obs, active_fault=FaultType.OIL_PRESSURE_LOSS, fault_severity=0.8)
        self.assertLess(twin.observed.oil_pressure_psi, 35.0)
        self.assertTrue(len(twin.alerts) > 0)
        self.assertIn("Lubrication", twin.alerts[0].candidate_fault)

    def test_rul_estimation_degradation(self):
        obs = self.sim.step()
        normal_twin = self.twin_svc.update_twin(obs)
        normal_rul = normal_twin.rul.rul_hours

        # Inject severe fault causing health drop
        self.sim.inject_fault(FaultType.OVERHEATING, severity=0.9)
        for _ in range(15):
            obs_fault = self.sim.step()
        fault_twin = self.twin_svc.update_twin(obs_fault, active_fault=FaultType.OVERHEATING, fault_severity=0.9)

        self.assertLess(fault_twin.rul.rul_hours, normal_rul)


if __name__ == "__main__":
    unittest.main()
