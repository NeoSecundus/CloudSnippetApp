"use strict";

/**
 * Cloud Computing Example Service
 * 
 * Intended to be deployed on OKD/OpenShift or Heroku PaaS platforms
 */

// Get default settings from environment variables
const SSL = process.env.SSL || "false";
const SERVER_PORT = process.env.EXAMPLE_SERVICE_PORT || process.env.PORT || 8080; // PORT environement variable provided by Heroku
const SERVER_PREFIX = process.env.EXAMPLE_SERVICE_PREFIX || "/snippets";
const DB_URL = process.env.EXAMPLE_DB_URL || process.env.DATABASE_URL || "postgres://snippet:keines@127.0.0.1:5432/snippets";

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

    getSnippets() {
        return this.connection.query("SELECT * FROM snippets");
    }

    getSnippetById(id) {
        return this.connection.query("SELECT * FROM snippets WHERE id = $1", [id]);
    }

    getSnippetsByTag(query) {
        return this.connection.query("SELECT * FROM snippets INNER JOIN tags ON fk_table = id WHERE " + query, []);
    }

    async insertSnippet(body) {
        let res = null;

        res = await this.connection.query(
            "SELECT max(id) FROM snippets"
        );
        let id = null;
        if (res.rows[0] != undefined) {
            id = res.rows[0].max + 1;
        } else {
            return res;
        }

        res = await this.connection.query(
            "INSERT INTO snippets VALUES($1, $2, $3, $4, $5, $6)",
            [id, body.name, body.description, body.author, body.language, body.code]
        )
        if (res.rowCount == 0) {
            return res;
        }

        for (let tag in body.tags) {
            res = await this.connection.query(
                "INSERT INTO tags VALUES($1, $2)",
                [id, body.tags[tag]]
            )

            if (res.rowCount == 0) {
                console.log("Error inserting tags for snippet!")
                return res;
            }
        }

        return res;
    }

    updateSnippet(id, body) {
        return this.connection.query(
            "UPDATE snippets SET name=$1, description=$2, author=$3, language=$4, code=$5 WHERE id = $6", 
            [body.name, body.description, body.author,
                body.language, body.code, id]
        );
    }

    deleteSnippet(id) {
        return this.connection.query("DELETE FROM snippets WHERE id = $1", [id]);
    }
}

/** Class implementing the ReST API */
class SnippetAPI {
    async getById(req, res) {
        var result = null;

        try {
            result = await db.getSnippetById(req.params.id);
            if (result.rows[0] == undefined) 
                res.json({ "error": "snippet id not found" });
            else
                res.json(result.rows[0]);
        } catch (error) {
            console.log(JSON.stringify(error));
            res.status(500).json({ "error": "database access error" });
        }
    }

    async getSnippets(req, res) {
        var result = null;

        if (Object.keys(req.query).length != 0) {
            let query = "";
            let first = true;

            for (let key in req.query) {
                if (!first) {
                    query += " AND ";
                } else {
                    first = false;
                }

                query += key + "='" + req.query[key] + "'";
            }

            try {
                result = await db.getSnippetsByTag( query );
                if (result.rows[0] == undefined) 
                    res.json({ "error": "snippet with attributes not found" });
                else
                    res.json(result.rows);
            } catch (error) {
                console.log(JSON.stringify(error));
                res.status(500).json({ "error": "database access error" });
            }
        } else {
            try {
                result = await db.getSnippets();
                if (result.rows[0] == undefined) 
                    res.json({ "error": "snippet id not found" });
                else
                    res.json(result.rows);
            } catch (error) {
                console.log(JSON.stringify(error));
                res.status(500).json({ "error": "database access error" });
            }
        }
    }

    async updateSnippet(req, res) {
        var result = null;

        try {
            result = await db.updateSnippet(req.params.id, req.body);
            if (result.rowCount == 0) 
                res.json({ "error": "add snippet failed!" });
            else
                res.json({"res": "success"});
        } catch (error) {
            console.log(JSON.stringify(error));
            res.status(500).json({ "error": "database access error" });
        }
    }

    async addSnippet(req, res) {
        var result = null;

        try {
            result = await db.insertSnippet(req.body);
            if (result.rowCount == 0) 
                res.json({ "error": "add snippet failed!" });
            else
                res.json({"res": "success"});
        } catch (error) {
            console.log(JSON.stringify(error));
            res.status(500).json({ "error": "database access error" });
        }
    }

    async deleteSnippet(req, res) {
        var result = null;

        try {
            result = await db.deleteSnippet(req.params.id);
            if (result.rowCount == 0) 
                res.json({ "error": "delete snippet failed!" });
            else
                res.json({"res": "success"});
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
        this.app.get(this.prefix, this.getSnippets)
        this.app.get(this.prefix + '/:id', this.getById);
        this.app.put(this.prefix + '/:id', this.updateSnippet);
        this.app.delete(this.prefix + '/:id', this.deleteSnippet);
        this.app.post(this.prefix, this.addSnippet)

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
const api = new SnippetAPI(SERVER_PORT, SERVER_PREFIX, db);
