import { openingMaterialTargets } from '@roomedy/contracts/furniture-materials';
import type { MaterialPattern } from '@roomedy/contracts/furniture-materials';
import {
  BoxGeometry,
  DataTexture,
  TextureSource,
  Texture,
  Group,
  Mesh,
  MeshStandardMaterial,
  OctahedronGeometry,
} from 'three';
import type { BufferGeometry, Material, Object3D, WebGLRenderer } from 'three';
import type { GLTF } from 'three/addons/loaders/GLTFLoader.js';
import type { RoomDocument } from '@roomedy/contracts/room';
import { POLICY } from '@roomedy/contracts/policy';
import { findCatalogueEntry, featureLabel } from '@roomedy/spatial';
import { furnitureMaterialTargets } from '@roomedy/contracts/furniture-materials';
import { furnitureMaterial } from '../room-view/furniture-material';
import { roomSurface, roomSurfaceDetail } from '@roomedy/contracts/surfaces';
import type { SurfaceTarget } from '@roomedy/contracts/surfaces';
import {
  configureRoomSampler,
  roomSurfaceGeometry,
  surfaceRoughness,
} from '../room-view/room-material';
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
  roomSurfaceMap,
  detailedParts,
  surfaceModel,
  surfaceProperties,
} from '../room-view/surfaces';
import { DesignExportError } from './facts';
import { createWindowGlass } from '../room-view/window-glass';
import { balconyDoorPanels } from '../room-view/opening-parts';
import type { SurfaceIO } from '../room-view/surface-assets';

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
  surfaceIO: SurfaceIO = {},
) {
  const root = new Group(),
    surfaces = createSurfaces(surfaceIO),
    unit = new BoxGeometry(1, 1, 1),
    marker = new OctahedronGeometry(0.12),
    materials = new Set<Material>(),
    roomGeometries = new Set<BufferGeometry>(),
    roomSamplers = new Set<Texture>(),
    samplerCache = new Map<string, Texture>(),
    instances: (() => void)[] = [];
  const walls = new Map<string, Group>(),
    bounds = displayRoom(room);
  let disposed = false;
  let windowGlass: ReturnType<typeof createWindowGlass> | undefined;
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
  const material = (
    color: string,
    role: 'wood' | 'soft' | 'metal' | 'wall' | 'floor' = 'wood',
    target?: SurfaceTarget,
    pattern?: MaterialPattern,
  ) => {
    const map = pattern
      ? surfaces[pattern]
      : role === 'floor'
        ? roomSurfaceMap(surfaces, roomSurface(room.room, 'floor').texture)
        : role === 'wall'
          ? roomSurfaceMap(
              surfaces,
              roomSurface(room.room, target ?? 'walls').texture,
            )
          : role === 'soft'
            ? surfaces.fabric
            : role === 'metal'
              ? null
              : surfaces.wood;
    const m = new MeshStandardMaterial({
      color,
      ...(map ? surfaceProperties(map) : {}),
      bumpScale:
        pattern === 'smooth'
          ? 0
          : role === 'floor'
            ? 0.001
            : role === 'soft'
              ? 0.0012
              : 0.0004,
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
    if (target) {
      const detail = roomSurfaceDetail(room.room, target);
      for (const key of [
        'map',
        'normalMap',
        'roughnessMap',
        'bumpMap',
      ] as const) {
        const source = m[key];
        if (!source) continue;
        const samplerKey = `${source.uuid}:${JSON.stringify(detail)}`;
        let sampler = samplerCache.get(samplerKey);
        if (!sampler) {
          sampler = source.clone();
          configureRoomSampler(sampler, detail);
          roomSamplers.add(sampler);
          samplerCache.set(samplerKey, sampler);
        }
        m[key] = sampler;
      }
      m.roughness = surfaceRoughness(detail.sheen);
    }
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
  const floor = material(
    roomSurface(room.room, 'floor').color,
    'floor',
    'floor',
  );
  const surfaceGeometry = (
    center: readonly number[],
    size: readonly number[],
    target: SurfaceTarget,
  ) => {
    const geometry = roomSurfaceGeometry(unit, center, size, target);
    roomGeometries.add(geometry);
    return geometry;
  };
  const floorCenter = [bounds.width / 2, -0.07, bounds.depth / 2];
  const floorSize = [bounds.width + 0.24, 0.14, bounds.depth + 0.24];
  box(
    root,
    'Floor',
    floorCenter,
    floorSize,
    floor,
    surfaceGeometry(floorCenter, floorSize, 'floor'),
  );
  for (const wall of ['north', 'south', 'east', 'west'] as const) {
    const wallMaterial = material(
      roomSurface(room.room, wall).color,
      'wall',
      wall,
    );
    const group = new Group();
    group.name = `Wall ${wall}`;
    root.add(group);
    walls.set(wall, group);
    for (const [i, b] of wallBoxes(room, wall).entries())
      box(
        group,
        `Wall ${wall} ${i}`,
        b.center,
        b.size,
        wallMaterial,
        surfaceGeometry(b.center, b.size, wall),
      );
  }
  for (const feature of room.room.features) {
    const appearance = openingMaterialTargets(
      feature.kind === 'obstacle' ? undefined : feature.materials,
    );
    const b = featureBox(room, feature);
    if (!b) continue;
    const group = new Group();
    group.name = featureLabel(feature);
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
    const balcony = feature.kind === 'door' && feature.purpose === 'balcony';
    if (balcony) {
      windowGlass ??= createWindowGlass();
      const daylight = box(
        group,
        'Balcony daylight',
        [0, 0, -d - 0.035],
        [w - t * 2, h - t * 2, 0.008],
        windowGlass.daylight,
      );
      daylight.castShadow = daylight.receiveShadow = false;
      for (const panel of balconyDoorPanels(
        w,
        h,
        d,
        feature.mechanism === 'sliding',
      ))
        for (const part of panel.parts) {
          const node = box(
            group,
            part.name,
            part.center,
            part.size,
            part.kind === 'glass'
              ? windowGlass.material
              : material(
                  part.kind === 'handle' ? '#574b3e' : appearance.frameColor,
                  part.kind === 'handle' ? 'metal' : undefined,
                  undefined,
                  part.kind === 'handle' ? undefined : appearance.frameTexture,
                ),
          );
          if (part.kind === 'glass')
            node.castShadow = node.receiveShadow = false;
        }
    } else if (feature.kind === 'window') {
      windowGlass ??= createWindowGlass();
      const daylight = box(
        group,
        'Window daylight',
        [0, 0, -d - 0.035],
        [w - t * 2, h - t * 2, 0.008],
        windowGlass.daylight,
      );
      daylight.castShadow = daylight.receiveShadow = false;
      const pane = box(
        group,
        'Window glass',
        [0, 0, d * 0.5],
        [w - t * 2, h - t * 2, 0.012],
        windowGlass.material,
      );
      pane.castShadow = pane.receiveShadow = false;
    } else
      box(
        group,
        feature.kind,
        [0, 0, 0],
        [w, h, feature.kind === 'door' ? d * 0.6 : d],
        material(
          feature.kind === 'door' ? appearance.color : '#9a8870',
          feature.kind === 'door' ? 'wood' : 'wall',
          undefined,
          feature.kind === 'door' ? appearance.texture : undefined,
        ),
      );
    if (feature.kind === 'obstacle') continue;
    const trim = material(
      appearance.frameColor,
      'wood',
      undefined,
      appearance.frameTexture,
    );
    for (const [x, y, width, height] of [
      [-w / 2 + t / 2, 0, t, h],
      [w / 2 - t / 2, 0, t, h],
      [0, h / 2 - t / 2, w - t * 2, t],
      ...(feature.kind === 'window'
        ? [
            [0, -h / 2 + t / 2, w - t * 2, t],
            [0, 0, t * 0.65, h - t * 2],
          ]
        : balcony
          ? [[0, -h / 2 + t / 2, w - t * 2, t]]
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
    if (feature.kind === 'door' && !balcony) {
      box(
        group,
        'Door panel',
        [0, 0, d * 0.32],
        [w - t * 4, h - t * 4, d * 0.2],
        material(
          feature.materials?.color ?? '#806046',
          'wood',
          undefined,
          appearance.texture,
        ),
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
      const instance = surfaceModel(
        asset.scene,
        surfaces,
        piece.finish,
        piece.materials,
      );
      group.add(instance.object);
      instances.push(instance.dispose);
    } else if (representation.kind === 'procedural') {
      const targets = furnitureMaterialTargets(
        piece,
        findCatalogueEntry(piece.catalogueId, piece.catalogueVersion)
          ?.category ?? 'storage',
      );
      const frame = furnitureMaterial(targets.frame, surfaces),
        soft = furnitureMaterial(targets.soft, surfaces),
        blanket = furnitureMaterial(targets.blanket, surfaces),
        metal = furnitureMaterial(targets.metal, surfaces);
      for (const owned of [frame, soft, blanket, metal]) materials.add(owned);
      const screen = material('#101820', 'metal');
      screen.roughness = 0.19;
      screen.metalness = 0.35;
      if (
        findCatalogueEntry(piece.catalogueId, piece.catalogueVersion)
          ?.category === 'mirror'
      )
        windowGlass ??= createWindowGlass();
      for (const part of detailedParts(
        representation.parts,
        representation.footprint,
      ))
        box(
          group,
          part.name,
          part.center.map(metres),
          part.size.map(metres),
          part.name === 'mirror-glass' && windowGlass
            ? windowGlass.mirror
            : part.name === 'tv-screen'
              ? screen
              : part.name.startsWith('blanket')
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
    roomGeometries.forEach((g) => g.dispose());
    roomSamplers.forEach((map) => map.dispose());
    unit.dispose();
    marker.dispose();
    surfaces.dispose();
    windowGlass?.dispose();
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
    async prepareSurfaces(signal: AbortSignal) {
      const result = await surfaces.load(signal);
      if (!disposed)
        for (const sampler of roomSamplers) sampler.needsUpdate = true;
      return result;
    },
    prepareGlass(renderer?: WebGLRenderer) {
      if (!disposed) windowGlass?.prepare(renderer);
    },
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
/** Native canvas inputs let the exporter merge PBR channels and flip normal-map
 * conventions correctly. Borrowed scene samplers remain unchanged. */
export function prepareGlbTextures(
  root: Object3D,
  canvas = () => document.createElement('canvas'),
) {
  const copies = new Map<DataTexture, Texture>();
  const sources = new Map<
    Texture['source'],
    { source: TextureSource<HTMLCanvasElement>; canvas: HTMLCanvasElement }
  >();
  const restore: (() => void)[] = [];
  const dispose = () => {
    restore.splice(0).forEach((fn) => fn());
    for (const copy of copies.values()) copy.dispose();
    for (const copy of sources.values())
      copy.canvas.width = copy.canvas.height = 1;
    copies.clear();
    sources.clear();
  };
  try {
    root.traverse((node) => {
      if (!(node instanceof Mesh)) return;
      for (const material of Array.isArray(node.material)
        ? node.material
        : [node.material]) {
        if (!(material instanceof MeshStandardMaterial)) continue;
        for (const slot of ['normalMap', 'roughnessMap'] as const) {
          const original = material[slot];
          if (!(original instanceof DataTexture)) continue;
          let copy = copies.get(original);
          if (!copy) {
            if (copies.size >= 32) throw new DesignExportError('too-large');
            let source = sources.get(original.source);
            if (!source) {
              const image = original.image;
              if (
                sources.size >= 8 ||
                !Number.isInteger(image.width) ||
                !Number.isInteger(image.height) ||
                image.width < 1 ||
                image.height < 1 ||
                image.width > 512 ||
                image.height > 512 ||
                !(image.data instanceof Uint8Array) ||
                image.data.length !== image.width * image.height * 4
              )
                throw new DesignExportError('too-large');
              const target = canvas();
              source = { source: new TextureSource(target), canvas: target };
              sources.set(original.source, source);
              target.width = image.width;
              target.height = image.height;
              const context = target.getContext('2d');
              if (!context) throw new DesignExportError('graphics');
              const pixels = context.createImageData(image.width, image.height);
              pixels.data.set(image.data);
              context.putImageData(pixels, 0, 0);
            }
            copy = new Texture().copy(original);
            copy.source = source.source;
            copies.set(original, copy);
          }
          material[slot] = copy;
          restore.push(() => {
            material[slot] = original;
          });
        }
      }
    });
    return dispose;
  } catch (error) {
    dispose();
    throw error;
  }
}
export async function exportGlb(
  room: RoomDocument,
  signal: AbortSignal,
  check: () => void,
) {
  const assets = await loadDesignAssets(room, signal);
  let projection: ReturnType<typeof buildDesignScene> | undefined;
  let retireTextures: (() => void) | undefined;
  try {
    check();
    projection = buildDesignScene(room, assets.ready);
    await projection.prepareSurfaces(signal);
    check();
    projection.prepareGlass();
    retireTextures = prepareGlbTextures(projection.root);
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
    retireTextures?.();
    projection?.dispose();
    assets.dispose();
  }
}
