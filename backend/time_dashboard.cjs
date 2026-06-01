const pool = require("./src/db");
const { getDashboardData } = require("./src/models/trainingModel");

async function main() {
    console.time("getDashboardData");
    try {
        await getDashboardData();
        console.timeEnd("getDashboardData");
    } catch (err) {
        console.error(err);
    } finally {
        pool.end();
    }
}
main();
