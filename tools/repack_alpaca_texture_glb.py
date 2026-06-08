import argparse
import sys
from pathlib import Path

import bpy


def parse_args():
  parser = argparse.ArgumentParser()
  parser.add_argument("--input", required=True)
  parser.add_argument("--texture", required=True)
  parser.add_argument("--output", required=True)
  argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
  return parser.parse_args(argv)


def main():
  args = parse_args()
  bpy.ops.object.select_all(action="SELECT")
  bpy.ops.object.delete()
  bpy.ops.import_scene.gltf(filepath=args.input)

  for obj in list(bpy.context.scene.objects):
    if obj.name != "geometry_0":
      bpy.data.objects.remove(obj, do_unlink=True)

  texture = bpy.data.images.load(args.texture)
  texture.name = "Image_0_face_upgrade"
  for material in bpy.data.materials:
    if not material.node_tree:
      continue
    for node in material.node_tree.nodes:
      if node.bl_idname == "ShaderNodeTexImage" and node.image and node.image.name.startswith("Image_0"):
        node.image = texture

  output = Path(args.output)
  output.parent.mkdir(parents=True, exist_ok=True)
  bpy.ops.object.select_all(action="DESELECT")
  for obj in bpy.context.scene.objects:
    obj.select_set(True)
  bpy.ops.export_scene.gltf(
    filepath=str(output),
    export_format="GLB",
    export_apply=True,
    export_yup=True
  )


if __name__ == "__main__":
  main()
