#!/usr/bin/env bash
# Set up a learning project: an Obsidian vault whose .omp links to this repo.
#
#   scripts/new-course.sh <dir> [source-file]
#
# Creates <dir> if needed, links <dir>/.omp -> this repo, copies the source
# (book PDF, lecture notes, ...) into <dir>/sources/, and writes review.base
# (an Obsidian Bases table of concepts due for review). Note folders
# (concepts/, chapters/, ...) are created by the agent as it writes. The first
# omp session in <dir> builds COURSE.md from the source.
#
# Also works for the sprint vault (omit the source).
set -euo pipefail

if [[ $# -lt 1 || $# -gt 2 ]]; then
	echo "usage: $0 <dir> [source-file]" >&2
	exit 2
fi

repo="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd -P)"
mkdir -p "$1"
dir="$(cd "$1" && pwd -P)"

if [[ -L "$dir/.omp" || -e "$dir/.omp" ]]; then
	current="$(readlink "$dir/.omp" || true)"
	if [[ "$current" != "$repo" ]]; then
		echo "error: $dir/.omp already exists (${current:-not a symlink}); expected a link to $repo. Fix or remove it, then re-run." >&2
		exit 1
	fi
else
	ln -s "$repo" "$dir/.omp"
fi

if [[ $# -eq 2 ]]; then
	if [[ ! -f "$2" ]]; then
		echo "error: source file not found: $2" >&2
		exit 1
	fi
	mkdir -p "$dir/sources"
	dest="$dir/sources/$(basename "$2")"
	if [[ -e "$dest" ]]; then
		echo "kept existing $dest"
	else
		cp "$2" "$dest"
	fi
fi

if [[ ! -e "$dir/review.base" ]]; then
	cat >"$dir/review.base" <<'EOF'
filters:
  and:
    - file.inFolder("concepts")

formulas:
  days_until_due: 'if(due, (date(due) - today()).days, "")'

properties:
  formula.days_until_due:
    displayName: "Days until due"

views:
  - type: table
    name: "Due now"
    filters:
      and:
        - 'if(due, date(due) <= today(), false)'
    order:
      - file.name
      - aliases
      - box
      - due
      - chapter
  - type: table
    name: "All concepts"
    groupBy:
      property: box
      direction: ASC
    order:
      - file.name
      - aliases
      - box
      - due
      - formula.days_until_due
      - last_reviewed
      - chapter
EOF
fi

echo "ready: $dir"
echo "  .omp -> $repo"
echo "next: cd \"$dir\" && omp, then e.g. \"I want to learn chapter 1 today\""
