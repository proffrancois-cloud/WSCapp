import argparse
import math
import sys
from pathlib import Path

import bpy


def parse_args():
  parser = argparse.ArgumentParser()
  parser.add_argument("--input", required=True)
  parser.add_argument("--output", required=True)
  argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
  return parser.parse_args(argv)


def clear_scene():
  bpy.ops.object.select_all(action="SELECT")
  bpy.ops.object.delete()


def make_material(name, color, roughness=0.45, metallic=0.0):
  mat = bpy.data.materials.new(name)
  mat.diffuse_color = color
  mat.use_nodes = True
  bsdf = mat.node_tree.nodes.get("Principled BSDF")
  if bsdf:
    bsdf.inputs["Base Color"].default_value = color
    bsdf.inputs["Roughness"].default_value = roughness
    bsdf.inputs["Metallic"].default_value = metallic
    if "Alpha" in bsdf.inputs:
      bsdf.inputs["Alpha"].default_value = color[3]
  return mat


def add_ellipsoid(name, location, scale, material, segments=32, ring_count=16):
  bpy.ops.mesh.primitive_uv_sphere_add(segments=segments, ring_count=ring_count, location=location)
  obj = bpy.context.object
  obj.name = name
  obj.scale = scale
  obj.data.materials.append(material)
  bpy.ops.object.shade_smooth()
  return obj


def add_curve(name, points, material, bevel_depth=0.0035):
  curve = bpy.data.curves.new(name, "CURVE")
  curve.dimensions = "3D"
  curve.resolution_u = 16
  curve.bevel_depth = bevel_depth
  curve.bevel_resolution = 4
  polyline = curve.splines.new("POLY")
  polyline.points.add(len(points) - 1)
  for point, coordinate in zip(polyline.points, points):
    point.co = (coordinate[0], coordinate[1], coordinate[2], 1)
  obj = bpy.data.objects.new(name, curve)
  bpy.context.collection.objects.link(obj)
  obj.data.materials.append(material)
  return obj


def add_face_upgrade():
  cream = make_material("avatar_face_warm_cream", (0.82, 0.70, 0.56, 1), 0.72)
  cream_light = make_material("avatar_face_soft_highlight", (0.93, 0.86, 0.74, 1), 0.78)
  black = make_material("avatar_eye_glossy_black", (0.015, 0.012, 0.01, 1), 0.08)
  brown = make_material("avatar_eye_warm_brown", (0.26, 0.105, 0.035, 1), 0.18)
  nose = make_material("avatar_nose_cocoa", (0.33, 0.095, 0.035, 1), 0.24)
  white = make_material("avatar_eye_white_highlight", (1.0, 0.96, 0.88, 1), 0.16)
  line = make_material("avatar_face_soft_line", (0.055, 0.018, 0.012, 1), 0.4)
  blush = make_material("avatar_cheek_soft_red", (0.78, 0.17, 0.16, 1), 0.68)

  # The uploaded GLB faces the negative X axis. Y is horizontal across the face and Z is vertical.
  muzzle_x = -0.472
  eye_x = -0.424
  nose_x = -0.510

  add_ellipsoid("muzzle_left_soft_pad", (muzzle_x, -0.030, -0.046), (0.006, 0.043, 0.032), cream, 40, 20)
  add_ellipsoid("muzzle_right_soft_pad", (muzzle_x, 0.030, -0.046), (0.006, 0.043, 0.032), cream, 40, 20)
  add_ellipsoid("muzzle_center_blend", (muzzle_x - 0.002, 0.0, -0.021), (0.005, 0.031, 0.028), cream_light, 32, 16)

  for side, y in (("left", -0.074), ("right", 0.074)):
    add_ellipsoid(f"eye_{side}_outer_gloss", (eye_x, y, 0.079), (0.0038, 0.021, 0.027), black, 48, 24)
    add_ellipsoid(f"eye_{side}_brown_iris", (eye_x - 0.002, y, 0.076), (0.002, 0.013, 0.017), brown, 36, 18)
    add_ellipsoid(f"eye_{side}_deep_pupil", (eye_x - 0.0032, y, 0.080), (0.0015, 0.009, 0.012), black, 32, 16)
    add_ellipsoid(f"eye_{side}_main_highlight", (eye_x - 0.0045, y - 0.008, 0.096), (0.001, 0.005, 0.006), white, 24, 12)
    add_ellipsoid(f"eye_{side}_lower_highlight", (eye_x - 0.0045, y + 0.008, 0.066), (0.0008, 0.0032, 0.004), white, 20, 10)
    add_curve(
      f"eyebrow_{side}_gentle_arc",
      [
        (eye_x - 0.002, y - 0.024, 0.130),
        (eye_x - 0.0035, y - 0.006, 0.137),
        (eye_x - 0.002, y + 0.024, 0.133)
      ],
      line,
      0.0016
    )

  add_ellipsoid("heart_soft_cocoa_nose", (nose_x, 0, -0.005), (0.0038, 0.026, 0.013), nose, 40, 18)
  add_ellipsoid("nose_left_nostril", (nose_x - 0.002, -0.010, -0.004), (0.0009, 0.0034, 0.0018), black, 16, 8)
  add_ellipsoid("nose_right_nostril", (nose_x - 0.002, 0.010, -0.004), (0.0009, 0.0034, 0.0018), black, 16, 8)

  add_curve("muzzle_center_line", [(nose_x - 0.002, 0, -0.023), (nose_x - 0.0025, 0, -0.057)], line, 0.0015)
  add_curve("smile_left_curve", [(nose_x - 0.0025, 0, -0.057), (nose_x - 0.003, -0.020, -0.071), (nose_x - 0.0025, -0.040, -0.063)], line, 0.0014)
  add_curve("smile_right_curve", [(nose_x - 0.0025, 0, -0.057), (nose_x - 0.003, 0.020, -0.071), (nose_x - 0.0025, 0.040, -0.063)], line, 0.0014)

  add_ellipsoid("cheek_left_soft_dot", (muzzle_x - 0.004, -0.106, 0.004), (0.0016, 0.0075, 0.0065), blush, 24, 12)
  add_ellipsoid("cheek_right_soft_dot", (muzzle_x - 0.004, 0.106, 0.004), (0.0016, 0.0075, 0.0065), blush, 24, 12)


def main():
  args = parse_args()
  clear_scene()
  bpy.ops.import_scene.gltf(filepath=args.input)
  add_face_upgrade()

  output = Path(args.output)
  output.parent.mkdir(parents=True, exist_ok=True)
  bpy.ops.export_scene.gltf(
    filepath=str(output),
    export_format="GLB",
    export_apply=True,
    export_yup=True
  )


if __name__ == "__main__":
  main()
