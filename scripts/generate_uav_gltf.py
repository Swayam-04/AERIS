import json
import os

def create_tapas_bh201_gltf():
    """
    Generate valid GLTF 2.0 asset for DRDO RUSTOM-1 MALE UAV.
    Length: 5.12m, Wingspan: 7.9m (Scale 1:1)
    """
    output_dir = os.path.join(os.path.dirname(__file__), "..", "frontend", "public", "models")
    os.makedirs(output_dir, exist_ok=True)
    gltf_path = os.path.join(output_dir, "tapas_bh201_rustom2.gltf")

    gltf = {
        "asset": {
            "version": "2.0",
            "generator": "AERIS DRDO RUSTOM-1 GLTF Generator"
        },
        "scene": 0,
        "scenes": [
            {
                "name": "DRDO_RUSTOM_1_Scene",
                "nodes": [0]
            }
        ],
        "nodes": [
            {
                "name": "DRDO_RUSTOM_1",
                "children": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
            },
            {"name": "Fuselage", "translation": [0, 0, 0]},
            {"name": "Nose", "translation": [2.5, 0.4, 0]},
            {"name": "Left_Wing", "translation": [0, 0.1, -3.95]},
            {"name": "Right_Wing", "translation": [0, 0.1, 3.95]},
            {"name": "Tail_Boom", "translation": [-2.0, 0.1, 0]},
            {"name": "Vertical_Tail", "translation": [-2.5, 1.2, 0]},
            {"name": "Horizontal_Tail", "translation": [-2.6, 1.8, 0]},
            {"name": "Propeller", "translation": [-1.0, -0.2, 0]},
            {"name": "Engine", "translation": [-0.5, -0.2, 0]},
            {"name": "Landing_Gear", "translation": [0, -0.6, 0]},
            {"name": "External_Sensors", "translation": [2.0, -0.4, 0]},
            {"name": "Publicly_Visible_Antennas", "translation": [1.0, 0.8, 0]}
        ],
        "materials": [
            {
                "name": "DRDO_Tactical_Light_Grey_PBR",
                "pbrMetallicRoughness": {
                    "baseColorFactor": [0.8, 0.83, 0.88, 1.0],
                    "metallicFactor": 0.35,
                    "roughnessFactor": 0.38
                }
            }
        ]
    }

    with open(gltf_path, "w", encoding="utf-8") as f:
        json.dump(gltf, f, indent=2)

    print(f"Generated DRDO RUSTOM-1 GLTF asset at: {gltf_path}")

if __name__ == "__main__":
    create_tapas_bh201_gltf()
