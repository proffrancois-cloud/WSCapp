import argparse
import sys
from pathlib import Path

import bpy
from mathutils import Vector


def clear_scene():
  bpy.ops.object.select_all(action="SELECT")
  bpy.ops.object.delete()


def import_glb(path):
  bpy.ops.import_scene.gltf(filepath=str(path))
  meshes = [obj for obj in bpy.context.scene.objects if obj.type == "MESH"]
  if not meshes:
    raise RuntimeError(f"No mesh found in {path}")
  return meshes


def scene_bounds(objects):
  corners = []
  for obj in objects:
    corners.extend(obj.matrix_world @ Vector(corner) for corner in obj.bound_box)
  low = Vector((min(point.x for point in corners), min(point.y for point in corners), min(point.z for point in corners)))
  high = Vector((max(point.x for point in corners), max(point.y for point in corners), max(point.z for point in corners)))
  return low, high


def normalize_model(objects):
  low, high = scene_bounds(objects)
  center = (low + high) / 2
  height = max(high.z - low.z, 0.01)
  scale = 2.35 / height

  root = bpy.data.objects.new("alpaca_render_root", None)
  bpy.context.collection.objects.link(root)
  for obj in objects:
    obj.parent = root
  root.location = -center
  root.scale = (scale, scale, scale)
  bpy.context.view_layer.update()
  return root


def look_at(obj, target):
  direction = Vector(target) - obj.location
  obj.rotation_euler = direction.to_track_quat("-Z", "Y").to_euler()


def setup_world():
  bpy.context.scene.render.engine = "BLENDER_EEVEE"
  if hasattr(bpy.context.scene, "eevee"):
    bpy.context.scene.eevee.taa_render_samples = 64
  bpy.context.scene.render.resolution_x = 1100
  bpy.context.scene.render.resolution_y = 1100
  bpy.context.scene.view_settings.view_transform = "Filmic"
  bpy.context.scene.view_settings.look = "Medium High Contrast"
  bpy.context.scene.view_settings.exposure = 0
  bpy.context.scene.view_settings.gamma = 1

  world = bpy.context.scene.world or bpy.data.worlds.new("World")
  bpy.context.scene.world = world
  world.color = (1, 1, 1)

  bpy.ops.object.light_add(type="AREA", location=(0, -3.6, 4.4))
  key = bpy.context.object
  key.name = "softbox_key"
  key.data.energy = 620
  key.data.size = 4.5

  bpy.ops.object.light_add(type="AREA", location=(-3.0, 1.2, 2.8))
  fill = bpy.context.object
  fill.name = "softbox_fill"
  fill.data.energy = 155
  fill.data.size = 5.5

  bpy.ops.mesh.primitive_plane_add(size=6.0, location=(0, 0, -1.18))
  floor = bpy.context.object
  floor.name = "matte_white_floor"
  mat = bpy.data.materials.new("matte_white")
  mat.diffuse_color = (0.97, 0.96, 0.94, 1)
  mat.use_nodes = True
  bsdf = mat.node_tree.nodes.get("Principled BSDF")
  bsdf.inputs["Base Color"].default_value = (0.97, 0.96, 0.94, 1)
  bsdf.inputs["Roughness"].default_value = 0.82
  floor.data.materials.append(mat)


def render_view(output_path, camera_location, lens=66):
  bpy.ops.object.camera_add(location=camera_location)
  camera = bpy.context.object
  camera.name = f"camera_{Path(output_path).stem}"
  look_at(camera, (0, 0, 0.06))
  camera.data.lens = lens
  camera.data.dof.use_dof = True
  camera.data.dof.focus_distance = (camera.location - Vector((0, 0, 0.06))).length
  camera.data.dof.aperture_fstop = 8
  bpy.context.scene.camera = camera
  bpy.context.scene.render.filepath = str(output_path)
  bpy.ops.render.render(write_still=True)
  bpy.data.objects.remove(camera, do_unlink=True)


def main():
  parser = argparse.ArgumentParser()
  parser.add_argument("--input", required=True)
  parser.add_argument("--output-dir", required=True)
  parser.add_argument("--prefix", required=True)
  argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
  args = parser.parse_args(argv)

  clear_scene()
  meshes = import_glb(Path(args.input))
  normalize_model(meshes)
  setup_world()

  output_dir = Path(args.output_dir)
  output_dir.mkdir(parents=True, exist_ok=True)
  render_view(output_dir / f"{args.prefix}-front.png", (0, -5.1, 1.18), 72)
  render_view(output_dir / f"{args.prefix}-three-quarter.png", (2.5, -4.6, 1.28), 70)
  render_view(output_dir / f"{args.prefix}-face.png", (0, -3.05, 1.45), 105)
  render_view(output_dir / f"{args.prefix}-left.png", (-5.1, 0, 1.18), 72)
  render_view(output_dir / f"{args.prefix}-left-face.png", (-3.05, -0.25, 1.45), 105)
  render_view(output_dir / f"{args.prefix}-right.png", (5.1, 0, 1.18), 72)


if __name__ == "__main__":
  main()
