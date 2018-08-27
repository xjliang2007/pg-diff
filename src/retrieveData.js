const Exception = require('./error')
const { Progress } = require('clui');
const chalk = require('chalk');

var helper = {
    __progressBar: new Progress(20),
    __progressBarValue: 0.0,
    __updateProgressbar: function(value, label) {
        this.__progressBarValue = value;
        process.stdout.clearLine();
        process.stdout.cursorTo(0);
        process.stdout.write(this.__progressBar.update(this.__progressBarValue) + ' - ' + chalk.whiteBright(label));
    },
    collectTablesRecords: function(client, tables) {
        return new Promise(async(resolve, reject) => {
            try {
                helper.__updateProgressbar(0.0, 'Collecting tables records ...');
                const progressBarStep = 1.0 / Object.keys(tables).length;

                var tableRecords = {};
                for (let table in tables) {
                    helper.__updateProgressbar(helper.__progressBarValue + progressBarStep, `Collecting RECORDS for table ${table}`);

                    tableRecords[table] = {
                        records: [],
                        exists: false
                    };

                    if (await helper.__checkIfTableExists(client, table, tables[table].schema)) {
                        tableRecords[table].records = await helper.__collectTableRecords(client, table, tables[table]);
                        tableRecords[table].exists = true;
                    }
                }

                helper.__updateProgressbar(1.0, 'Table records collected!');

                resolve(tableRecords);
            } catch (e) {
                reject(e);
            }
        });
    },
    __checkIfTableExists: async function(client, table, schema) {
        let response = await client.query(`SELECT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = '${table}' AND schemaname = '${schema||'public'}')`);
        return response.rows[0].exists;
    },
    __collectTableRecords: async function(client, table, config) {
        let result = {
            fields: null,
            rows: null
        };
        let response = await client.query(`SELECT MD5(ROW(${config.keyFields.join(',')})::text) AS "rowHash", * FROM ${table}`);
        result.fields = response.fields;
        result.rows = response.rows;

        return result;
    }
}

module.exports = helper;