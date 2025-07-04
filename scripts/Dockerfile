FROM postgres:15-alpine

RUN apk add --no-cache postgresql-client

COPY setup-tenant-databases.sh /setup-tenant-databases.sh
RUN chmod +x /setup-tenant-databases.sh

CMD ["/setup-tenant-databases.sh"]
