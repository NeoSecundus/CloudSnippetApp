PATH=$PATH:$HOME/openshift-origin-client-tools-v3.11.0-0cbc58b-linux-64bit

git clone https://github.com/NeoSecundus/CloudSnippetApp.git

cd CloudSnippetApp

oc new-app --template=postgresql-persistent -p POSTGRESQL_USER=snippet -p POSTGRESQL_PASSWORD=keines -p POSTGRESQL_DATABASE=snippet --name=snippetdb

oc get svc -l app=snippetdb

psql -h <CLUSTER IP> -U snippet -W snippet <pg_init.sql

oc new-app . --name snippetapp -e DATABASE_URL="postgres://snippet:keines@postgresql.myproject.svc.cluster.local:5432/snippet"

oc expose service/snippetapp

oc get route

curl snippetapp-myproject.127.0.0.1.nip.io:/snippets/0
