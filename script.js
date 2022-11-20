const cron = require("node-cron");
const Promise = require("bluebird");
const fs = Promise.promisifyAll(require("fs"));
const { log } = require("console");
const { exportCollection, getDBMainTags } = require("./features/read");
const { generateSchemaFromJsonData } = require("./features/handle");
const {
    removeDocumentField,
    updateTagNames,
    updateMetadata,
    handleTokensPrices,
    handleDetailChartTransaction
} = require("./features/write");
const {
    DBCrawlCoinModel,
    DBCrawlInvestorModel,
    DBCrawlMetadataModel,
    DBCrawlTagModel,
    DBCrawlTokenModel,
    DBMainAdminModel,
    DBMainSharkModel,
    DBMainTagModel,
    DBMainTokenModel,
    DBMainTransactionModel,
    DBMainUserModel
} = require("./models");
const {
    DBCrawlCoinsDatas,
    DBCrawlInvestorsDatas,
    DBCrawlMetadatasDatas,
    DBCrawlTagsDatas,
    DBCrawlTokensDatas,
    DBMainAdminsDatas,
    DBMainSharksDatas,
    DBMainTagsDatas,
    DBMainTokensDatas,
    DBMainTransactionsDatas,
    DBMainUsersDatas
} = require("./databases");

const runScript = async () => {};

runScript();

//#region Automation Scripts
const scriptsRunEvery10Minutes = async () => {};
const scriptsRunEveryHour = async () => {};
const scriptsRunEveryDay = async () => {
    // await backupDBCrawlDatas();
    // await backupDBMainDatas();
};
//#endregion

//#region Cronjob
// Every 10 minutes
cron.schedule("*/10 * * * *", async () => {
    await scriptsRunEvery10Minutes();
});

// Every hour at 0th minute
cron.schedule("0 * * * *", async () => {
    await scriptsRunEveryHour();
});

// Every day at 00:00:00
cron.schedule("0 0 * * *", async () => {
    await scriptsRunEveryDay();
});
//#endregion
