import json, os, sys

print("Loading existing materials...")
with open("scripts/seeded_materials.json", "r", encoding="utf-8") as f:
    materials = json.load(f)

print(f"Loaded {len(materials)} existing materials.")
