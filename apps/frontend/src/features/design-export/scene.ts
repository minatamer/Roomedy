import {
  BoxGeometry,
  Group,
  Mesh,
  MeshStandardMaterial,
  OctahedronGeometry,
} from 'three';
import type { BufferGeometry, Material, Object3D } from 'three';
import type { GLTF } from 'three/addons/loaders/GLTFLoader.js';
import type { RoomDocument } from '@roomedy/contracts/room';
import { POLICY } from '@roomedy/contracts/policy';
import { findCatalogueEntry } from '@roomedy/spatial';
import { FINISH_PALETTE } from '../catalogue/finishes';
import {
  displayRoom,
  featureBox,
  metres,
  piecePose,
  pieceRepresentation,
  wallBoxes,
} from '../room-view/adapter';
import type { Triple } from '../room-view/adapter';
import { ViewAssets } from '../room-view/assets';
import type { AssetState } from '../room-view/assets';
import {
  createSurfaces,
  detailedParts,
  surfaceModel,
} from '../room-view/surfaces';
import { DesignExportError } from './facts';

export async function loadDesignAssets(
  room: RoomDocument,
  signal: AbortSignal,
) {
  const urls = [
    ...new Set(
      room.furniture.flatMap((p) => {
        const r = pieceRepresentation(p);
        return r.kind === 'mesh' ? [r.url] : [];
      }),
    ),
  ];
  let cache!: ViewAssets;
  let settled = false;
  const states = await new Promise<ReadonlyMap<string, AssetState>>(
    (resolve, reject) => {
      const abort = () => {
        if (settled) return;
        settled = true;
        cache?.dispose();
        reject(new DesignExportError('cancelled'));
      };
      const complete = (next: ReadonlyMap<string, AssetState>) => {
        if (
          settled ||
          !urls.every(
            (url) => next.has(url) && next.get(url)?.kind !== 'loading',
          )
        )
          return;
        settled = true;
        signal.removeEventListener('abort', abort);
        resolve(next);
      };
      cache = new ViewAssets(complete);
      signal.addEventListener('abort', abort, { once: true });
      if (signal.aborted) {
        abort();
        return;
      }
      if (!urls.length) {
        settled = true;
        signal.removeEventListener('abort', abort);
        resolve(new Map());
        return;
      }
      urls.forEach((url) => cache.load(url));
    },
  );
  const ready = new Map<string, GLTF>();
  for (const [url, state] of states)
    if (state.kind === 'ready') ready.set(url, state.asset);
  return {
    ready,
    simplified: urls.some((url) => !ready.has(url)),
    dispose: () => cache.dispose(),
  };
}
/** A read-only presentation of the same canonical adapter/representation geometry. */
export function buildDesignScene(
  room: RoomDocument,
  assets: ReadonlyMap<string, GLTF> = new Map(),
) {
  const root = new Group(),
    surfaces = createSurfaces(),
    unit = new BoxGeometry(1, 1, 1),
    marker = new OctahedronGeometry(0.12),
    materials = new Set<Material>(),
    instances: (() => void)[] = [];
  const walls = new Map<string, Group>(),
    bounds = displayRoom(room);
  let disposed = false;
  root.name = 'Roomedy room';
  root.userData = {
    roomedy: {
      units: 'metres',
      width: {
        value:
          room.room.width.value === null ? null : metres(room.room.width.value),
        status: room.room.width.status,
      },
      depth: {
        value:
          room.room.depth.value === null ? null : metres(room.room.depth.value),
        status: room.room.depth.status,
      },
      height: {
        value:
          room.room.height.value === null
            ? null
            : metres(room.room.height.value),
        status: room.room.height.status,
      },
      displayBounds: bounds,
    },
  };
  surfaces.floor.repeat.set(bounds.width / 1.12, bounds.depth / 2.8);
  const material = (
    color: string,
    role: 'wood' | 'soft' | 'metal' | 'wall' | 'floor' = 'wood',
  ) => {
    const map =
      role === 'floor'
        ? surfaces.floor
        : role === 'wall'
          ? surfaces.plaster
          : role === 'soft'
            ? surfaces.fabric
            : role === 'metal'
              ? null
              : surfaces.wood;
    const m = new MeshStandardMaterial({
      color,
      map,
      bumpMap: map,
      bumpScale: role === 'floor' ? 0.001 : role === 'soft' ? 0.0012 : 0.0004,
      roughness:
        role === 'metal'
          ? 0.38
          : role === 'soft'
            ? 0.97
            : role === 'wall'
              ? 0.94
              : 0.76,
      metalness: role === 'metal' ? 0.55 : 0,
    });
    materials.add(m);
    return m;
  };
  const box = (
    parent: Object3D,
    name: string,
    center: readonly number[],
    size: readonly number[],
    m: Material,
    g: BufferGeometry = unit,
  ) => {
    const mesh = new Mesh(g, m);
    mesh.name = name;
    mesh.position.fromArray(center);
    mesh.scale.fromArray(size);
    mesh.castShadow = mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  };
  const floor = material(FINISH_PALETTE[room.room.floorFinish], 'floor');
  box(
    root,
    'Floor',
    [bounds.width / 2, -0.07, bounds.depth / 2],
    [bounds.width + 0.24, 0.14, bounds.depth + 0.24],
    floor,
  );
  const wallMaterial = material(FINISH_PALETTE[room.room.wallFinish], 'wall');
  for (const wall of ['north', 'south', 'east', 'west'] as const) {
    const group = new Group();
    group.name = `Wall ${wall}`;
    root.add(group);
    walls.set(wall, group);
    for (const [i, b] of wallBoxes(room, wall).entries())
      box(group, `Wall ${wall} ${i}`, b.center, b.size, wallMaterial);
  }
  for (const feature of room.room.features) {
    const b = featureBox(room, feature);
    if (!b) continue;
    const group = new Group();
    group.name = feature.kind;
    group.userData = { roomedy: { id: feature.id, wall: feature.wall } };
    group.position.fromArray(b.center);
    group.rotation.y =
      feature.wall === 'south'
        ? Math.PI
        : feature.wall === 'west'
          ? Math.PI / 2
          : feature.wall === 'east'
            ? -Math.PI / 2
            : 0;
    (walls.get(feature.wall) ?? root).add(group);
    const along = feature.wall === 'north' || feature.wall === 'south',
      w = along ? b.size[0] : b.size[2],
      h = b.size[1],
      d = along ? b.size[2] : b.size[0],
      t = Math.min(0.035, w / 6, h / 6);
    const opening = material(
      feature.kind === 'window'
        ? '#b8ced2'
        : feature.kind === 'door'
          ? '#765238'
          : '#9a8870',
      feature.kind === 'door' ? 'wood' : 'wall',
    );
    if (feature.kind === 'window') {
      opening.map = opening.bumpMap = null;
      opening.roughness = 0.28;
      opening.metalness = 0.15;
      opening.emissive.set('#adc9d1');
      opening.emissiveIntensity = 0.15;
    }
    box(
      group,
      feature.kind,
      [0, 0, 0],
      [
        w,
        h,
        feature.kind === 'window'
          ? 0.004
          : feature.kind === 'door'
            ? d * 0.6
            : d,
      ],
      opening,
    );
    if (feature.kind === 'obstacle') continue;
    const trim = material('#e8e0d3');
    for (const [x, y, width, height] of [
      [-w / 2 + t / 2, 0, t, h],
      [w / 2 - t / 2, 0, t, h],
      [0, h / 2 - t / 2, w - t * 2, t],
      ...(feature.kind === 'window'
        ? [
            [0, -h / 2 + t / 2, w - t * 2, t],
            [0, 0, t * 0.65, h - t * 2],
          ]
        : []),
    ])
      box(
        group,
        'Opening trim',
        [x!, y!, 0],
        [width!, height!, d],
        trim,
        surfaces.hard,
      );
    if (feature.kind === 'door') {
      box(
        group,
        'Door panel',
        [0, 0, d * 0.32],
        [w - t * 4, h - t * 4, d * 0.2],
        material('#806046'),
        surfaces.hard,
      );
      box(
        group,
        'Door handle',
        [(feature.hinge === 'right' ? -1 : 1) * w * 0.32, -h * 0.06, d * 0.43],
        [Math.min(0.1, w * 0.2), t * 0.5, d * 0.12],
        material('#574b3e', 'metal'),
        surfaces.hard,
      );
    }
  }
  for (const piece of room.furniture) {
    const group = new Group(),
      pose = piecePose(piece),
      first = pieceRepresentation(piece);
    group.name = piece.label;
    group.position.fromArray(pose.position);
    group.rotation.y = pose.rotationY;
    group.userData = {
      roomedy: {
        id: piece.id,
        dimensions: Object.fromEntries(
          Object.entries(piece.dimensions).map(([key, value]) => [
            key,
            {
              value: value.value === null ? null : metres(value.value),
              status: value.status,
            },
          ]),
        ),
        pose: piece.pose.provenance.status,
      },
    };
    root.add(group);
    const asset = first.kind === 'mesh' ? assets.get(first.url) : undefined,
      representation = pieceRepresentation(piece, !!asset);
    if (representation.kind === 'mesh' && asset) {
      const instance = surfaceModel(asset.scene, surfaces);
      group.add(instance.object);
      instances.push(instance.dispose);
    } else if (representation.kind === 'procedural') {
      const chair =
        findCatalogueEntry(piece.catalogueId, piece.catalogueVersion)
          ?.category === 'chair';
      const frame = material(
          FINISH_PALETTE[piece.finish],
          piece.finish === 'oak' || piece.finish === 'walnut' ? 'wood' : 'wall',
        ),
        soft = material(
          chair ? FINISH_PALETTE[piece.finish] : '#eee5d5',
          'soft',
        ),
        blanket = material('#bc9475', 'soft'),
        metal = material('#514a40', 'metal');
      for (const part of detailedParts(
        representation.parts,
        representation.footprint,
      ))
        box(
          group,
          part.name,
          part.center.map(metres),
          part.size.map(metres),
          part.name === 'blanket'
            ? blanket
            : part.role === 'soft'
              ? soft
              : part.role === 'metal'
                ? metal
                : frame,
          part.name === 'physical-bounds'
            ? unit
            : part.role === 'soft'
              ? surfaces.soft
              : surfaces.hard,
        );
    } else {
      const mesh = new Mesh(marker, material('#9a7857'));
      mesh.position.y = 0.15;
      mesh.name = 'Size not recorded';
      group.add(mesh);
    }
  }
  root.updateMatrixWorld(true);
  const dispose = () => {
    if (disposed) return;
    disposed = true;
    instances.forEach((fn) => fn());
    materials.forEach((m) => m.dispose());
    unit.dispose();
    marker.dispose();
    surfaces.dispose();
    root.clear();
  };
  let nodes = 0,
    triangles = 0;
  root.traverse((object) => {
    nodes++;
    if (object instanceof Mesh)
      triangles +=
        (object.geometry.index?.count ??
          object.geometry.getAttribute('position').count) / 3;
  });
  if (
    nodes > POLICY.designExportNodes ||
    triangles > POLICY.designExportTriangles
  ) {
    dispose();
    throw new DesignExportError('too-large');
  }
  return {
    root,
    bounds,
    nodes,
    triangles,
    dispose,
    setCutaway(position: Triple, inside: boolean) {
      for (const [wall, group] of walls)
        group.visible =
          inside ||
          !(wall === 'north'
            ? position[2] < bounds.depth / 2
            : wall === 'south'
              ? position[2] > bounds.depth / 2
              : wall === 'west'
                ? position[0] < bounds.width / 2
                : position[0] > bounds.width / 2);
    },
    full() {
      for (const group of walls.values()) group.visible = true;
    },
  };
}
export async function exportGlb(
  room: RoomDocument,
  signal: AbortSignal,
  check: () => void,
) {
  const assets = await loadDesignAssets(room, signal);
  let projection: ReturnType<typeof buildDesignScene> | undefined;
  try {
    check();
    projection = buildDesignScene(room, assets.ready);
    check();
    const { GLTFExporter } =
      await import('three/addons/exporters/GLTFExporter.js');
    check();
    const bytes = await new GLTFExporter().parseAsync(projection.root, {
      binary: true,
      maxTextureSize: POLICY.designExportTextureEdge,
      onlyVisible: false,
    });
    check();
    if (
      !(bytes instanceof ArrayBuffer) ||
      bytes.byteLength > POLICY.designExportGlbBytes
    )
      throw new DesignExportError('too-large');
    return new Blob([bytes], { type: 'model/gltf-binary' });
  } finally {
    projection?.dispose();
    assets.dispose();
  }
}
