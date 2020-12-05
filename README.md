# PaaS: okd and Heroku example
Create an example service on an OKD/OpenShift and Heroku platform.
## OKD/Openshift

### Prerequisistes
* The Linux VM has at least 4GiB of RAM, 16GiB storage assigned and Docker enabled. 
(e.g. use the Application Container exercise appliance and adjust the RAM settings)

* Ensure the postgresql client is installed, e.g.
```
yum install postgresql
```
* Extract the openshift archive in the root directory
```
tar xvzf openshift-origin-client-tools-v3.11.0-0cbc58b-linux-64bit.tar.gz 
```
* Add the directory containing the extracted openshift to the PATH variable
```
PATH=$PATH:$HOME/openshift-origin-client-tools-v3.11.0-0cbc58b-linux-64bit
```
* Running Openshift Cluster
```
oc cluster up
```
* Clone of this repository is available in the local filesystem
```
git clone https://git-iit.fh-joanneum.at/clcomp/paas-okd-example.git
```
* Current working directory is the repository clone

### Deploy and initialise PSQL database

1. Get all templates from the "openshift" system project
```
oc get templates -n openshift
```
2. List the parameters of the "postgresql-persistent" template
```
oc process --parameters -n openshift postgresql-persistent
```
3. Create a postgresql pod
```
oc new-app --template=postgresql-persistent -p POSTGRESQL_USER=example -p POSTGRESQL_PASSWORD=keines -p POSTGRESQL_DATABASE=example --name=exampledb
``` 
4. Get the cluster IP
```
oc get svc -l app=exampledb
```
5. Initalise the database
```
psql -h <CLUSTER IP> -U example -W example <initdb_postgres.sql
```
6. Check the database content
```
psql -h <CLUSTER IP> -U example -W example
example=> \dt
example=> select * from messages;
example=> \q
```

### Deploy an example application

1. Initiate the deployment of the example nodejs application
```
oc new-app . --name exampleapi -e DATABASE_URL="postgres://example:keines@postgresql.myproject.svc.cluster.local:5432/example"
```
2. Watch the build output
```
oc logs -f bc/exampleapi
```
3. Show the pods
```
oc get pods
```
4.Show the cluster ip of the example service
```
oc get svc exampleapi
```
5. Watch the output from the example service 
```
oc logs -f service/exampleapi
```
6. Retrieve a message from the example service
```
curl http://<CLUSTER IP>:8080/example/1
```
7. Expose a route to the example API
```
oc expose service/exampleapi
oc get route
```
8. Access the example API via the exposed route
```
curl exampleapi-myproject.127.0.0.1.nip.io:/example/1
```

## PaaS-Heroku-example

### Prepare environment

1. In current working directory (repository clone), create links to global node modules: 
```
npm link pg express body-parser
```
2. Login to heroku, using email & password
```
heroku login -i
``` 
### Deploy, initialise and test PSQL database

1. Create a heroku app using the postgresql addon and database plan "hobby-dev"
``` 
heroku apps:create --addons=heroku-postgresql:hobby-dev
``` 
2. List your heroku apps
``` 
heroku apps
``` 
3. List the dynos for your app
``` 
heroku ps
``` 
4. Initialize the database
``` 
heroku pg:psql <initdb_postgres.sql
``` 
5. Check the database content
``` 
heroku pg:psql <<HERE
select * from messages;
HERE
``` 
### Deploy the example app locally

1. Set environment variables
```
export DATABASE_URL=$(heroku config:get DATABASE_URL)
export SSL=true
```
2. Test app locally
```
heroku local
curl http://127.0.0.1:5000/example/1 
``` 
### Deploy app on heroku

1. Push app to heroku and check success
```
git push heroku master
heroku ps
heroku logs
```
2. Open the app URL in a browser
```
heroku open 
```
> NOTE: Only works when browser is available on host (not in VM)
Otherwise look at the output of "git push heroku master" and open the URL in any browser
e.g. https://ancient-caverns-16326.herokuapp.com/example/1
