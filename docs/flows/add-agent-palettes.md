# Adding Agent-Generated Palettes

## What this flow covers

Adding palette records directly to the managed data directory (bypassing the API), then restarting the server so they appear in the ColorLab and DevApp.

---

## File location

All managed EC records live in:

```
code/v001/packages/server/data/managed/ec/
```

One JSON file per record, named `<id>.json` where `<id>` is the record's own `id` field.

---

## File format

```json
{
  "id": "ec_<uuid-v4>",
  "title": "Human-readable palette name",
  "documentKinds": ["palette"],
  "document": {
    "format": "EC",
    "version": 1,
    "documents": [
      {
        "id": "palette-main",
        "kind": "palette",
        "version": 1,
        "data": {
          "colors": [
            [R, G, B, A],
            ...
          ]
        }
      }
    ]
  },
  "createdAt": "<ISO-8601 timestamp>",
  "updatedAt": "<ISO-8601 timestamp>",
  "version": 1
}
```

Colors are `[R, G, B, A]` arrays of integers 0–255.

Generate IDs with:

```bash
python3 -c "import uuid; print(f'ec_{uuid.uuid4()}')"
```

---

## Color ordering convention

For palettes that encode intensity (sequential, density, etc.):

| State | Color |
|---|---|
| 0 | `[0, 0, 0, 0]` — transparent black (background / "off" / dead cell) |
| 1 | **Darkest / most saturated** color in the ramp |
| 2 | ↓ |
| 3 | ↓ |
| N | **Lightest / least saturated** color in the ramp |

**Rationale:** state 0 is always the CA dead/background state, rendered transparent. States 1..N represent increasing presence/activity. Dark = prominent, light = subtle — this matches how CA patterns read visually (active cells stand out).

This is the **opposite** of how ColorBrewer lists its ramps on colorbrewer2.org (which goes light→dark). Always reverse the ColorBrewer order when encoding here.

---

## ColorBrewer 5-class palettes (reference)

All palettes below are 6 entries: `[0,0,0,0]` + 5 colors in **dark→light** order.

### Single-hue sequential

| Scheme | State 1 (dark) → State 5 (light) |
|---|---|
| Blues | `#084594` → `#eff3ff` |
| Greens | `#006d2c` → `#edf8e9` |
| Greys | `#252525` → `#f7f7f7` |
| Oranges | `#a63603` → `#feedde` |
| Purples | `#54278f` → `#f2f0f7` |
| Reds | `#a50f15` → `#fee5d9` |

### Multi-hue sequential

| Scheme | State 1 (dark) → State 5 (light) |
|---|---|
| YlOrRd | `#bd0026` → `#ffffb2` |
| YlOrBr | `#8c2d04` → `#ffffd4` |
| YlGn | `#006837` → `#ffffcc` |
| YlGnBu | `#253494` → `#ffffcc` |
| GnBu | `#0868ac` → `#f0f9e8` |
| BuGn | `#006d2c` → `#edf8fb` |
| BuPu | `#810f7c` → `#edf8fb` |
| RdPu | `#7a0177` → `#feebe2` |
| PuRd | `#980043` → `#f1eef6` |
| OrRd | `#b30000` → `#fef0d9` |
| PuBu | `#045a8d` → `#f1eef6` |
| PuBuGn | `#016c59` → `#f6eff7` |

---

## How to write the files efficiently

Use a Python script so you don't hand-edit JSON:

```python
import json, uuid

MANAGED_DIR = "code/v001/packages/server/data/managed/ec"
TS = "2026-05-29T00:00:00.000Z"  # use today's date

def rgb(h):
    h = h.lstrip('#')
    return [int(h[0:2],16), int(h[2:4],16), int(h[4:6],16), 255]

palettes = {
    f"ec_{uuid.uuid4()}": ("My Palette Name", [
        "#darkest", "#...", "#...", "#...", "#lightest"  # dark→light order
    ]),
    # ... more palettes
}

for ec_id, (title, hexes) in palettes.items():
    colors = [[0,0,0,0]] + [rgb(h) for h in hexes]  # state 0 transparent, then dark→light
    doc = {
        "id": ec_id, "title": title, "documentKinds": ["palette"],
        "document": {"format": "EC", "version": 1, "documents": [{
            "id": "palette-main", "kind": "palette", "version": 1,
            "data": {"colors": colors}
        }]},
        "createdAt": TS, "updatedAt": TS, "version": 1,
    }
    with open(f"{MANAGED_DIR}/{ec_id}.json", "w") as f:
        json.dump(doc, f, indent=2); f.write("\n")
```

---

## Restarting the server

The store loads all JSON files into an in-memory Map at startup and never re-reads them. A restart is required after adding or modifying files manually.

The server runs under `tsx watch`. Touching any `.ts` source file triggers a clean restart:

```bash
touch code/v001/packages/server/src/main.ts
```

Wait ~3 seconds, then verify:

```bash
curl -s http://localhost:3001/v1/health
```

---

## Verifying the palettes loaded

```bash
curl -s "http://localhost:3001/v1/ec/documents?kind=palette&limit=500" \
  | python3 -c "
import sys, json
data = json.load(sys.stdin)['data']
print(f'total: {data[\"total\"]}')
for r in data['items']:
    print(r['title'])
"
```

---

## Validation rules (what the server enforces on load)

The server calls `validateEcContainer()` on every file at startup. If a file is malformed the entire server startup fails. Key rules:

- `format` must be `"EC"`, `version` must be `1`
- Each document needs `id` (non-empty string), `kind` (one of `palette|pattern|rule|rule-forest`), `version: 1`, `data` (object)
- For palettes: `data.colors` is an array; each color is a 4-element array of finite numbers
- All document `id` values within a container must be unique
- The outer record needs `id`, `title`, `createdAt`, `updatedAt` (strings), `documentKinds` (string array), `version` (positive integer)
