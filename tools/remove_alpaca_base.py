from collections import defaultdict
from pathlib import Path
import sys

import bmesh
import bpy
from mathutils import Vector


def argv_after_double_dash():
  if "--" not in sys.argv:
    return []
  return sys.argv[sys.argv.index("--") + 1:]


def flat_base_face_indices(obj):
  mesh = obj.data
  vertex_to_faces = defaultdict(list)
  for polygon in mesh.polygons:
    for vertex_index in polygon.vertices:
      vertex_to_faces[vertex_index].append(polygon.index)

  seen = set()
  faces_to_remove = set()

  for polygon in mesh.polygons:
    if polygon.index in seen:
      continue

    stack = [polygon.index]
    seen.add(polygon.index)
    component_faces = []
    component_vertices = set()

    while stack:
      face_index = stack.pop()
      component_faces.append(face_index)
      for vertex_index in mesh.polygons[face_index].vertices:
        component_vertices.add(vertex_index)
        for neighbor_index in vertex_to_faces[vertex_index]:
          if neighbor_index not in seen:
            seen.add(neighbor_index)
            stack.append(neighbor_index)

    world_points = [obj.matrix_world @ mesh.vertices[index].co for index in component_vertices]
    min_point = Vector((min(point.x for point in world_points), min(point.y for point in world_points), min(point.z for point in world_points)))
    max_point = Vector((max(point.x for point in world_points), max(point.y for point in world_points), max(point.z for point in world_points)))
    size = max_point - min_point

    is_large_base_plate = size.x > 0.85 and size.y > 0.85 and size.z < 0.01 and max_point.z < -0.2
    is_flat_base_fragment = size.z < 0.004 and max_point.z < -0.225

    if is_large_base_plate or is_flat_base_fragment:
      faces_to_remove.update(component_faces)

  return faces_to_remove


def remove_faces(obj, face_indices):
  mesh = obj.data
  bm = bmesh.new()
  bm.from_mesh(mesh)
  bm.faces.ensure_lookup_table()

  faces = [bm.faces[index] for index in sorted(face_indices) if index < len(bm.faces)]
  bmesh.ops.delete(bm, geom=faces, context="FACES")
  loose_vertices = [vertex for vertex in bm.verts if not vertex.link_edges]
  if loose_vertices:
    bmesh.ops.delete(bm, geom=loose_vertices, context="VERTS")

  bm.to_mesh(mesh)
  bm.free()
  mesh.update()


def main():
  args = argv_after_double_dash()
  if len(args) != 2:
    raise SystemExit("Usage: blender -b --python tools/remove_alpaca_base.py -- input.glb output.glb")

  input_path = Path(args[0])
  output_path = Path(args[1])

  bpy.ops.object.select_all(action="SELECT")
  bpy.ops.object.delete()
  bpy.ops.import_scene.gltf(filepath=str(input_path))

  removed_faces = 0
  for obj in bpy.context.scene.objects:
    if obj.type != "MESH":
      continue

    face_indices = flat_base_face_indices(obj)
    if face_indices:
      remove_faces(obj, face_indices)
      removed_faces += len(face_indices)

  output_path.parent.mkdir(parents=True, exist_ok=True)
  bpy.ops.export_scene.gltf(filepath=str(output_path), export_format="GLB")
  print(f"Removed {removed_faces} flat base faces from {input_path}")


if __name__ == "__main__":
  main()
