import json
import os

def create_tapas_bh201_gltf():
    """
    Generate valid GLTF 2.0 asset for DRDO TAPAS-BH-201 (RUSTOM-II) MALE UAV.
    Length: 9.5m, Wingspan: 20.6m (Scale 1:1)
    """
    output_dir = os.path.join(os.path.dirname(__file__), "..", "frontend", "public", "models")
    os.makedirs(output_dir, exist_ok=True)
    gltf_path = os.path.join(output_dir, "tapas_bh201_rustom2.gltf")

    gltf = {
        "asset": {
            "version": "2.0",
            "generator": "AERIS DRDO TAPAS-BH-201 GLTF Generator"
        },
        "scene": 0,
        "scenes": [
            {
                "name": "TAPAS_BH_201_RUSTOM_II_Scene",
                "nodes": [0]
            }
        ],
        "nodes": [
            {
                "name": "TAPAS_BH_201",
                "children": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
            },
            {"name": "Fuselage", "translation": [0, 0, 0]},
            {"name": "Nose", "translation": [4.35, 0.65, 0]},
            {"name": "Left_Wing", "translation": [0, 0.1, -10.3]},
            {"name": "Right_Wing", "translation": [0, 0.1, 10.3]},
            {"name": "Tail_Boom", "translation": [-3.5, 0.1, 0]},
            {"name": "Vertical_Tail", "translation": [-4.75, 1.6, 0]},
            {"name": "Horizontal_Tail", "translation": [-5.0, 3.2, 0]},
            {"name": "Propeller", "translation": [-1.85, -0.2, 1.8]},
            {"name": "Engine", "translation": [-0.8, -0.2, 1.8]},
            {"name": "Landing_Gear", "translation": [0, -0.9, 0]},
            {"name": "External_Sensors", "translation": [3.8, -0.65, 0]},
            {"name": "Publicly_Visible_Antennas", "translation": [1.5, 1.25, 0]}
        ],
        "materials": [
            {
                "name": "DRDO_Tactical_Light_Grey_PBR",
                "pbrMetallicRoughness": {
                    "baseColorFactor": [0.8, 0.83, 0.88, 1.0],
                    "metallicFactor": 0.35,
                    "roughnessFactor": 0.38
                }
            },
            {
                "name": "Matte_Black_SATCOM_Radome",
                "pbrMetallicRoughness": {
                    "baseColorFactor": [0.06, 0.08, 0.12, 1.0],
                    "metallicFactor": 0.15,
                    "roughnessFactor": 0.15
                }
            },
            {
                "name": "Twin_AeroPiston_Engine_Nacelle",
                "pbrMetallicRoughness": {
                    "baseColorFactor": [0.02, 0.7, 0.83, 1.0],
                    "metallicFactor": 0.85,
                    "roughnessFactor": 0.2
                },
                "emissiveFactor": [0.02, 0.7, 0.83]
            }
        ]
    }

    with open(gltf_path, "w", encoding="utf-8") as f:
        json.dump(gltf, f, indent=2)

    print(f"Generated TAPAS-BH-201 / RUSTOM-II GLTF asset at: {gltf_path}")

if __name__ == "__main__":
    create_tapas_bh201_gltf()
