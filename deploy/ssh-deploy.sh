#!/usr/bin/env bash
set -Eeuo pipefail
umask 077
root=/opt/gin-react-blog
if [[ ${SSH_ORIGINAL_COMMAND:-} =~ ^images\ ([a-f0-9]{40})$ ]]; then
  sha=${BASH_REMATCH[1]}
  prefix=ghcr.io/michaelwu0905/gin-react-blog
  for image in "$prefix-backend:$sha" "$prefix-frontend:$sha" "$prefix-mysql:8.0" "$prefix-prometheus:v3.15.0" "$prefix-grafana:13.2.3"; do
    if ! docker image inspect "$image" >/dev/null 2>&1; then
      # A new SHA may reference layers already present after a merge-only change.
      if ! timeout 20 docker pull --quiet "$image" >/dev/null 2>&1; then printf '%s\n' "$image"; fi
    fi
  done
  exit 0
fi
if [[ ${SSH_ORIGINAL_COMMAND:-} =~ ^deploy\ ([a-f0-9]{40})$ ]]; then sha=${BASH_REMATCH[1]}; else
  echo "Only deploy/images <commit SHA> is allowed." >&2
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
[[ $(stat -c %s "$archive") -lt 2147483648 ]] || exit 2
python3 - "$archive" "$root/releases/$sha" <<'PY'
import pathlib
import shutil
import sys
import tarfile
archive, destination = sys.argv[1:]
base = pathlib.Path(destination)
base.mkdir(parents=True, exist_ok=True)
with tarfile.open(archive, "r:gz") as bundle:
    members = bundle.getmembers()
    if sum(member.size for member in members) > 4 * 1024 * 1024 * 1024:
        raise ValueError("release bundle too large")
    for member in members:
        path = pathlib.PurePosixPath(member.name)
        if path.is_absolute() or ".." in path.parts or not path.parts or path.parts[0] not in {"deploy", "monitoring", "images"}:
            raise ValueError("unexpected bundle path")
        if not (member.isdir() or member.isfile()):
            raise ValueError("links and special files are forbidden")
        target = base.joinpath(*path.parts)
        if member.isdir():
            target.mkdir(parents=True, exist_ok=True)
        else:
            target.parent.mkdir(parents=True, exist_ok=True)
            with bundle.extractfile(member) as source, target.open("wb") as output:
                shutil.copyfileobj(source, output, length=1024 * 1024)
PY
if [[ -f "$root/releases/$sha/images/delivery.tar" ]]; then
  docker load -i "$root/releases/$sha/images/delivery.tar"
  rm -f "$root/releases/$sha/images/delivery.tar"
  rmdir "$root/releases/$sha/images"
fi
bash "$root/releases/$sha/deploy/deploy.sh" "$sha"
