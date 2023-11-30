#!/bin/sh

node -v
echo "Current calendar service ls working directory: $(pwd)"
echo "Output of ls -la command: $(ls -la)"
echo "App run command args: $@"
echo "Getting calendso config from consul and secrets-manager..."
/usr/sbin/consul-template \
    -consul-addr "$CONSUL" \
    -consul-retry-attempts=0 \
    -template "/etc/sellular-calendar/config/env.ctmpl:./.env" \
    -once
# Failing the deployment when config fetch fails
status="$?"
echo "Exit status after getting env: $status"
if [ "$status" != "0" ]
then
  echo "Deployment failed due to config fetch failure"
  exit 1
fi


run_calendar_service() {
  yarn start
}

CMD_TO_EXECUTE="$1"

case "$CMD_TO_EXECUTE" in
  "run_calendar_service")
    run_calendar_service
    exit $?
  ;;
esac

exec "$@"
