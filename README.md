# CloudSnippetApp

1. [Architecture](#architecture)
2. [OKD](#okd)
3. [Heroku](#heroku)

## Architecture

![SnippetApp Architecture Diagram](./img/SnippetApp_Architecture.png)

## OKD

**Build and Deploy Guide:**  
Import oc Path:

```bash
PATH=$PATH:$HOME/openshift-origin-client-tools-v3.11.0-0cbc58b-linux-64bit
```

Clone git Repository and move into it:  

```bash
git clone https://github.com/NeoSecundus/CloudSnippetApp.git
cd CloudSnippetApp
```

Create new postgres database in OKD:  

```bash
oc new-app --template=postgresql-persistent -p POSTGRESQL_USER=snippet -p POSTGRESQL_PASSWORD=keines -p POSTGRESQL_DATABASE=snippet --name=snippetdb
```

Display ip address of postgres server:

```bash
oc get svc -l app=snippetdb
```

Initialize database:  

```bash
psql -h <CLUSTER IP> -U snippet -W snippet <pg_init.sql
```

Create SnippetApp with Database:  

```bash
oc new-app . --name snippetapp -e DATABASE_URL="postgres://snippet:keines@postgresql.myproject.svc.cluster.local:5432/snippet"
```

Check if build was finished succesfully:

```bash
oc get pods
```

Expose service to the host:

```bash
oc expose service/snippetapp
```

Get SnippetApp route:

```bash
oc get route
```

Test out if SnippetApp is working:

```bash
curl snippetapp-myproject.127.0.0.1.nip.io:/snippets/0
```

> More examples are in the [CurlTests](./curl-tests.txt) file

## Heroku

**Build and Deploy Guide:**  
Link necessary npm modules:

```bash
npm link pg express body-parser
```

Login to heroku account:

```bash
heroku login -i
```

Create a new App:

```bash
heroku apps:create --addons=heroku-postgresql:hobby-dev
```

Initialize Database:

```bash
heroku pg:psql <pg_init.sql
```

Prepare and start local heroku deployment:

```bash
export DATABASE_URL=$(heroku config:get DATABASE_URL)
export SSL=true
heroku local
```

Test local heroku:

```bash
curl http://127.0.0.1:5000/snippets
```

Push app to heroku master:

```bash
git push heroku master
```

Open heroku app in browser:

```bash
heroku open
```

---

**Personal Heroku Service url:**  
https://warm-dawn-30027.herokuapp.com/snippets

![Heroku Demo](./img/heroku_demo.png)
