"""Generate explicitly named procedural thumbnails, preserving all unselected assets."""
from pathlib import Path
import json
import subprocess
import sys
sys.dont_write_bytecode = True
from prepare_catalogue import ROOT, OUT, box_faces, thumbnail, digest
query = "import { CATALOGUE } from '@roomedy/spatial'; import { FINISH_PALETTE } from './apps/frontend/src/features/catalogue/finishes.ts'; import { proceduralParts } from './apps/frontend/src/features/room-view/representations/definitions.ts'; console.log(JSON.stringify({catalogue:CATALOGUE,palette:FINISH_PALETTE,parts:Object.fromEntries(CATALOGUE.map(e=>[e.assetId,proceduralParts(e.category,Object.fromEntries(Object.entries(e.size).map(([k,a])=>[k,a.default])),e.accessMechanism,e.assetId)]))}));"
data = json.loads(subprocess.run(['node','--import','tsx','--input-type=module','-e',query],cwd=ROOT,capture_output=True,text=True,check=True).stdout)
manifest_path=OUT/'manifest.json'
manifest=json.loads(manifest_path.read_text(encoding='utf-8'))
existing={item['catalogueId']:item for item in manifest['thumbnails']}
selected=set(sys.argv[1:])
assert selected, 'Name the catalogue IDs to generate'
assert selected <= {e['id'] for e in data['catalogue'] if e['representation'] == 'procedural'}, 'Select existing procedural entries only'
for entry in data['catalogue']:
    if entry['id'] not in selected: continue
    size={axis:bounds['default'] for axis,bounds in entry['size'].items()}
    faces,colors=box_faces(data['parts'][entry['assetId']],data['palette'])
    svg=thumbnail(faces,colors,entry['label'],size).encode()
    filename='thumbnails/'+entry['assetId']+'.svg'
    (OUT/filename).write_bytes(svg)
    updated={'catalogueId':entry['id'],'filename':filename,'bytes':len(svg),'sha256':digest(svg),'semanticMm':size}
    if entry['id'] in existing: existing[entry['id']].update(updated)
    else: manifest['thumbnails'].append(updated)
manifest_path.write_text(json.dumps(manifest,indent=2)+'\n',encoding='utf-8',newline='\n')
print(f"{len(manifest['thumbnails'])} catalogue thumbnails")
