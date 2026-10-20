"""Offline, deterministic packaging of the four selected CC0 source material sets.

Use the bundled Pillow/NumPy runtime. Sources and download-receipt.json remain in
an ignored folder; this command never downloads files or invents a room finish.
"""

import argparse
import hashlib
import json
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter, ImageOps


SETS = [
    ("floor", "oak_wood_planks", "Dimitrios Savva", 512, 190, 1.2, 0.5),
    ("wood", "oak_veneer_01", "Jenelle van Heerden", 512, 185, 1.8, 0.45),
    ("fabric", "rough_linen", "colormass / Rico Cilliers", 256, 204, 0.3, 0.5),
    ("plaster", "white_plaster_02", "Rob Tuytel", 256, 232, 1.0, 0.3),
]


def sha(raw):
    return hashlib.sha256(raw).hexdigest()


def prepare(sources, destination):
    receipt = json.loads((sources / "download-receipt.json").read_text())
    destination.mkdir(parents=True, exist_ok=True)
    rows = []
    for kind, asset, author, edge, low, metres, relief in SETS:
        selected = [
            row for row in receipt
            if row["asset"] == asset and row["map"] in {"Diffuse", "Rough", "nor_gl"}
        ]
        assert len(selected) == 3
        for row in selected:
            raw = (sources / row["file"]).read_bytes()
            assert len(raw) == row["bytes"] and sha(raw) == row["sha256"]

        def image(map_name, mode):
            row = next(row for row in selected if row["map"] == map_name)
            with Image.open(sources / row["file"]) as original:
                assert max(original.size) <= 2048
                return original.convert(mode).resize((edge, edge), Image.Resampling.LANCZOS)

        diffuse = image("Diffuse", "L")
        if kind == "plaster":
            # Remove large weathering stains; keep the photographed fine detail.
            values = np.asarray(diffuse, dtype=np.float32)
            blurred = np.asarray(diffuse.filter(ImageFilter.GaussianBlur(8)), dtype=np.float32)
            albedo = np.clip(247 + (values - blurred) * 0.6, low, 255)
        else:
            values = np.asarray(ImageOps.autocontrast(diffuse, cutoff=1), dtype=np.float32)
            albedo = low + values * ((255 - low) / 255)
        roughness = np.asarray(image("Rough", "L"), dtype=np.float32)
        # Preserve a restrained matte-to-satin response under the existing lights.
        roughness = 184 + roughness * (71 / 255)
        packed = np.zeros((edge, edge, 4), dtype=np.uint8)
        packed[:, :, 0] = (np.rint(albedo / 2) * 2).clip(0, 255).astype(np.uint8)
        packed[:, :, 1] = (np.rint(roughness / 4) * 4).clip(0, 255).astype(np.uint8)
        packed[:, :, 3] = 255

        normal = np.asarray(image("nor_gl", "RGB"), dtype=np.float32) / 127.5 - 1
        normal[:, :, :2] *= relief
        normal /= np.maximum(np.linalg.norm(normal, axis=2, keepdims=True), 0.0001)
        normals = np.full((edge, edge, 4), 255, dtype=np.uint8)
        normals[:, :, :3] = np.rint((normal + 1) * 127.5).clip(0, 255).astype(np.uint8)
        files = []
        for suffix, pixels in [("detail", packed), ("normal", normals)]:
            filename = f"{kind}-{suffix}-v1.png"
            # DataTexture flipY=false: bake the ordinary image-to-GL row flip.
            Image.fromarray(pixels[::-1].copy()).save(destination / filename, optimize=True)
            raw = (destination / filename).read_bytes()
            assert len(raw) <= 256 * 1024
            files.append({"filename": filename, "bytes": len(raw), "sha256": sha(raw)})
        rows.append({
            "kind": kind, "sourceAsset": asset, "author": author,
            "sourcePage": "https://polyhaven.com/a/" + asset,
            "sourceTileMetres": metres, "edge": edge,
            "normalStrengthBaked": relief, "albedoMinimum": low,
            "sources": selected, "files": files,
        })
    total = sum(file["bytes"] for row in rows for file in row["files"])
    assert total <= 1024 * 1024
    manifest = {
        "version": 1, "license": "CC0-1.0",
        "licenseUrl": "https://polyhaven.com/license", "preparedBy": "scripts/prepare-surfaces.py",
        "packing": "detail R=neutral sRGB albedo, G=linear roughness, B=0, A=255; normal RGB=linear GL normal, A=255; GL row order",
        "budgets": {"assetBytes": 262144, "totalBytes": 1048576, "edge": 512, "sets": 4, "files": 8, "textureMipBytes": 16777216},
        "bytes": total, "materials": rows,
    }
    (destination / "manifest.json").write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"files": 8, "bytes": total}))


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--sources", type=Path, required=True)
    parser.add_argument("--out", type=Path, required=True)
    args = parser.parse_args()
    prepare(args.sources, args.out)
