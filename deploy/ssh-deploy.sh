#!/usr/bin/env bash
set -Eeuo pipefail
umask 077
root=/opt/gin-react-blog
if [[ ${SSH_ORIGINAL_COMMAND:-} =~ ^deploy\ ([a-f0-9]{40})$ ]]; then sha=${BASH_REMATCH[1]}; else
  echo "Only deploy <commit SHA> is allowed." >&2
  exit 2
fi
IFS= read -r registry_token
[[ -n $registry_token && ${#registry_token} -lt 1024 ]] || exit 2
registry_config=$(mktemp -d)
archive=$(mktemp)
cleanup() { rm -rf "$registry_config"; rm -f "$archive"; }
trap cleanup EXIT
export DOCKER_CONFIG=$registry_config
printf '%s' "$registry_token" | docker login ghcr.io --username michaelwu0905 --password-stdin
unset registry_token
cat >"$archive"
[[ $(stat -c %s "$archive") -lt 2097152 ]] || exit 2
python3 - "$archive" "$root/releases/$sha" <<'PY'
import pathlib
import sys
import tarfile
archive, destination = sys.argv[1:]
base = pathlib.Path(destination)
base.mkdir(parents=True, exist_ok=True)
with tarfile.open(archive, "r:gz") as bundle:
    members = bundle.getmembers()
    if sum(member.size for member in members) > 2 * 1024 * 1024:
        raise ValueError("release bundle too large")
    for member in members:
        path = pathlib.PurePosixPath(member.name)
        if path.is_absolute() or ".." in path.parts or not path.parts or path.parts[0] not in {"deploy", "monitoring"}:
            raise ValueError("unexpected bundle path")
        if not (member.isdir() or member.isfile()):
            raise ValueError("links and special files are forbidden")
        target = base.joinpath(*path.parts)
        if member.isdir():
            target.mkdir(parents=True, exist_ok=True)
        else:
            target.parent.mkdir(parents=True, exist_ok=True)
            with bundle.extractfile(member) as source, target.open("wb") as output:
                output.write(source.read())
PY
bash "$root/releases/$sha/deploy/deploy.sh" "$sha"
