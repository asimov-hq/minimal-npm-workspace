#!/usr/bin/env bash
set -euo pipefail

usage() {
  echo "Usage: $0 [--overwrite] <destination>"
}

overwrite=false
dest=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --overwrite)
      overwrite=true
      shift
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    -*)
      echo "Unknown option: $1" >&2
      usage >&2
      exit 1
      ;;
    *)
      if [[ -n "$dest" ]]; then
        echo "Error: multiple destinations specified." >&2
        usage >&2
        exit 1
      fi
      dest="$1"
      shift
      ;;
  esac
done

if [[ -z "$dest" ]]; then
  echo "Error: destination is required." >&2
  usage >&2
  exit 1
fi

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
root_dir="$(cd "$script_dir/.." && pwd)"

src_gitignore="$root_dir/.gitignore"
src_tsconfig="$root_dir/tsconfig.base.json"
src_package="$root_dir/package.json"
src_packages_dir="$root_dir/packages"

if [[ ! -e "$src_gitignore" || ! -e "$src_tsconfig" || ! -e "$src_package" || ! -d "$src_packages_dir" ]]; then
  echo "Error: source files not found. Run this script from the repository." >&2
  exit 1
fi

mkdir -p "$dest"

fail_if_exists() {
  local path="$1"
  if [[ -e "$path" ]]; then
    return 0
  fi
  return 1
}

if ! $overwrite; then
  existing=()

  if fail_if_exists "$dest/.gitignore"; then
    existing+=(".gitignore")
  fi
  if fail_if_exists "$dest/tsconfig.base.json"; then
    existing+=("tsconfig.base.json")
  fi
  if fail_if_exists "$dest/package.json"; then
    existing+=("package.json")
  fi

  while IFS= read -r rel_path; do
    if fail_if_exists "$dest/$rel_path"; then
      existing+=("$rel_path")
    fi
  done < <(cd "$src_packages_dir" && find . -type f -print | sed 's|^\./|packages/|')

  if [[ ${#existing[@]} -gt 0 ]]; then
    echo "Error: destination already contains the following files:" >&2
    for item in "${existing[@]}"; do
      echo "  - $item" >&2
    done
    echo "Use --overwrite to replace." >&2
    exit 1
  fi
else
  rm -f "$dest/.gitignore" "$dest/tsconfig.base.json" "$dest/package.json"
  if [[ -d "$dest/packages" ]]; then
    for entry in "$src_packages_dir"/*; do
      name="$(basename "$entry")"
      rm -rf "$dest/packages/$name"
    done
  fi
fi

cp "$src_gitignore" "$dest/.gitignore"
cp "$src_tsconfig" "$dest/tsconfig.base.json"
cp "$src_package" "$dest/package.json"

mkdir -p "$dest/packages"
for entry in "$src_packages_dir"/*; do
  cp -R "$entry" "$dest/packages/"
done

echo "Copied files:"
echo "  - .gitignore"
echo "  - tsconfig.base.json"
echo "  - package.json"
while IFS= read -r rel_path; do
  echo "  - $rel_path"
done < <(cd "$src_packages_dir" && find . -type f -print | sed 's|^\./|packages/|')
