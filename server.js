"use strict";

/**
 * Cloud Computing Example Service
 * 
 * Intended to be deployed on OKD/OpenShift or Heroku PaaS platforms
 */

// Get default settings from environment variables
const SSL = process.env.SSL || "false";
const SERVER_PORT = process.env.EXAMPLE_SERVICE_PORT || process.env.PORT || 8080; // PORT environement variable provided by Heroku
const SERVER_PREFIX = process.env.EXAMPLE_SERVICE_PREFIX || "/example";
const DB_URL = process.env.EXAMPLE_DB_URL || process.env.DATABASE_URL || "postgres://example:keines@127.0.0.1:5432/example";

/** Postgres database access functions objects */
class PSQL_DB {

    /** Create a database connection
     * @constructs PSQL_DB, a PostgreSQL database connection
     * @param {string} url - complete database connection url
    */
    constructor(url) {
        const { Client } = require('pg');
    	console.log(`Using Database URL: ${url}`);
    	var use_ssl = (SSL == "true" || SSL == 1 ? true : false);
        this.connection = new Client({ 
            connectionString: url, 
            ssl: use_ssl 
        });

        // connect to the database
        this.connect();

        // if connection to DB has been closed unexpected
        this.connection.on('end', (error) => {
            console.log('Connection closed ', error);
            // try to re-connect
            this.connect();
        });
    }

    /** Connect to the database */
    connect() {
        console.log(`Connecting to database  ...`);
        this.connection.connect((error) => {
            if (error) {
                console.log(`Connection to database FAILED!`);
		console.log(error);
                process.exit(1);
            }
            else {
                console.log(`Connection to database established!`);
            }
        });
    }

    /** Get message with given id
     * @param {id} id - id of message
     * @returns {Promise} - Promise for the message query
     */
    dbGetMessage(id) {
        // returns Promise object for message query
        return this.connection.query('SELECT message FROM messages WHERE id = $1', [id]);
    }
}

/** Class implementing the ReST Example API */
class ExampleAPI {

    /** Get the message specified by the id paramaeter
     * @param {Object} req - HTTP request as provided by express
     * @param {Object} res - HTTP request as provided by express
     */
    async getById(req, res) {
        var result = null;

        try {
            result = await db.dbGetMessage(req.params.id);
            if (result.rows[0] == undefined) 
                res.json({ "error": "message id not found" });
            else
                res.json(result.rows[0]);
        } catch (error) {
            console.log(JSON.stringify(error));
            res.status(500).json({ "error": "database access error" });
        }
    }

    /** Create an Example ReST API 
     * @param {number} port - port number to listen
     * @param {string} prefix - resource path prefix
     * @param {Object} db - database connection
    */
    constructor(port, prefix, db) {
        this.port = port;
        this.prefix = prefix;
        this.db = db;

        // Add Express for routing
        const express = require('express');
        const bodyParser = require('body-parser');

        // Define express app
        this.app = express();
        this.app.use(bodyParser.urlencoded({ extended: false }));
        this.app.use(bodyParser.json());

        // Select message by id
        this.app.get(this.prefix + '/:id', this.getById);

        // Listen on given port for requests
        this.server = this.app.listen(this.port, () => {
            var host = this.server.address().address;
            var port = this.server.address().port;
            console.log("ExampleAPI listening at http://%s:%s%s", host, port, this.prefix);
        });

    }
};

// create database connection
var db = new PSQL_DB(DB_URL);

// create ReST Example API
const api = new ExampleAPI(SERVER_PORT, SERVER_PREFIX, db);
