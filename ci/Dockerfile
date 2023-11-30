FROM 857556598075.dkr.ecr.us-west-1.amazonaws.com/plivo/jenkins-ci/sellular:node18.12-alpine3.16


LABEL service=calendar-service

USER root

COPY . ./
COPY config/env.ctmpl /etc/sellular-calendar/config/env.ctmpl
RUN rm /entrypoint.sh || true
COPY ci/entrypoint.sh /entrypoint.sh
RUN chmod 755 /entrypoint.sh && chown root:root /entrypoint.sh
EXPOSE 3000
ENTRYPOINT ["/entrypoint.sh"]

