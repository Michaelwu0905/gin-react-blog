#!/usr/bin/env bash
set -Eeuo pipefail
umask 077
root=${DEPLOY_ROOT:-/opt/gin-react-blog}
sha=${1:?release SHA required}
[[ $sha =~ ^[a-f0-9]{40}$ ]] || exit 2
release="$root/releases/$sha"
[[ -f "$release/deploy/compose.prod.yml" ]] || exit 2
exec 9>"$root/deploy.lock"
flock -w 600 9
set -a
source "$root/.env"
set +a
export RELEASE_SHA=$sha DEPLOY_ROOT=$root
compose() {
  docker compose --project-directory "$root" --env-file "$root/.env" -f "$release/deploy/compose.prod.yml" "$@"
}
mkdir -p "$root/data/uploads" "$root/monitoring"
cp -R "$release/monitoring/." "$root/monitoring/"
find "$root/monitoring" -type d -exec chmod 755 {} +
find "$root/monitoring" -type f -exec chmod 644 {} +
chmod 755 "$root/data" "$root/data/uploads"
# Pull before touching the running application.
compose pull backend frontend
if [[ -z $(compose ps -a -q db) ]]; then
  compose pull db
  compose up -d --wait --wait-timeout 180 db
elif [[ -z $(compose ps --status running -q db) ]]; then
  compose up -d --wait --wait-timeout 180 db
fi
previous=""
if [[ -f "$root/current-release" ]]; then previous=$(<"$root/current-release"); fi
rollback() {
  trap - ERR
  echo "Release failed; restoring previous application version." >&2
  if [[ $previous =~ ^[a-f0-9]{40}$ ]]; then
    export RELEASE_SHA=$previous
    release="$root/releases/$previous"
    compose up -d --no-deps --wait --wait-timeout 120 backend frontend
    curl --retry 5 --retry-delay 2 --retry-all-errors -fsS http://127.0.0.1:18080/api/readyz
  fi
  exit 1
}
trap rollback ERR
compose up -d --no-deps --wait --wait-timeout 120 backend frontend
curl --retry 5 --retry-delay 2 --retry-all-errors -fsS http://127.0.0.1:18080/api/readyz
curl -fsS http://127.0.0.1:18080/ >/dev/null
if [[ ${VERIFY_PUBLIC:-false} == true ]]; then
  curl --retry 5 --retry-delay 2 --retry-all-errors -fsS "$PUBLIC_URL/api/readyz"
fi
trap - ERR
if [[ -n $previous && $previous != "$sha" ]]; then printf '%s\n' "$previous" >"$root/previous-release"; fi
printf '%s\n' "$sha" >"$root/current-release.tmp"
mv "$root/current-release.tmp" "$root/current-release"
if [[ ${MONITORING_ENABLED:-false} == true ]]; then
  for image in "$REGISTRY_PREFIX-prometheus:v3.15.0" "$REGISTRY_PREFIX-grafana:13.2.3"; do
    if ! docker image inspect "$image" >/dev/null 2>&1; then docker pull "$image"; fi
  done
  compose --profile monitoring up -d prometheus grafana
  curl --retry 20 --retry-delay 3 --retry-all-errors -fsS http://127.0.0.1:9090/-/ready
  curl --retry 20 --retry-delay 3 --retry-all-errors -fsS http://127.0.0.1:3000/api/health
fi
echo "Deployed $sha"
