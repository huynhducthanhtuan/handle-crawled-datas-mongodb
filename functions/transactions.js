import { fs, log } from "../constants/index.js";
import { DBMainTransactionModel } from "../models/index.js";
import { convertUnixTimestampToNumber } from "../helpers/index.js";
import { getDateNearTransaction, getOriginalPriceOfToken, getPriceWithDaily, getValueFromPromise } from "./coins.js";
import investors from "../databases/DB_Crawl/investors.json" assert { type: "json" };
import investorsConverted from "../databases/DB_Crawl/investors.json" assert { type: "json" };
import transactionsConverted from "../databases/DB_Crawl/transactions-converted.json" assert { type: "json" };

const handleEachTransaction = async ({
	transaction,
	investorId,
	id,
	transactionId
}) => {
	let numberOfTokens =
		Number(transaction["value"]) / 10 ** Number(transaction["tokenDecimal"]);

	let originalPrices = await getOriginalPriceOfToken(
		transaction["tokenSymbol"]
	);

	let hoursPrice = originalPrices?.hourly;

	if (hoursPrice) {
		hoursPrice = Object.keys(hoursPrice).map((unixDate) => {
			let date = convertUnixTimestampToNumber(unixDate);
			date = date.toString();
			return {
				date: date,
				value: hoursPrice[unixDate]
			};
		});

		hoursPrice.sort(
			(firstObj, secondObj) => secondObj["date"] - firstObj["date"]
		);
	}

	let presentData =
		typeof hoursPrice !== "undefined" ? hoursPrice[0] : undefined;

	const dateTransac = convertUnixTimestampToNumber(transaction["timeStamp"]);
	let dateNearTransaction =
		typeof hoursPrice !== "undefined"
			? getDateNearTransaction(hoursPrice, dateTransac.toString())
			: { date: "none", value: 0 };

	if (dateNearTransaction.date === "notfound") {
		let dailyPrice = originalPrices.daily;
		dateNearTransaction = getPriceWithDaily(dailyPrice, dateTransac.toString());
	}

	let presentPrice =
		typeof presentData === "undefined" ? 0 : presentData["value"];

	let presentDate =
		typeof presentData === "undefined" ? "none" : presentData["date"];

	Object.assign(transaction, {
		numberOfTokens: numberOfTokens,
		pastDate: dateNearTransaction["date"],
		pastPrice: dateNearTransaction["value"],
		presentDate: presentDate,
		presentPrice: presentPrice,
		timeStamp: parseInt(transaction.timeStamp),
		investorId: investorId,
		id: id,
		transactionId: transactionId
	});

	return transaction;
};

const convertTransactions = async () => {
	let transactionList = [],
		id = 1;

	for (let i = 0; i < investors.length; i++) {
		let promises = await investors[i].TXs?.map(async (transaction) => {
			return handleEachTransaction({
				transaction: transaction,
				investorId: i + 1,
				id: id,
				transactionId: id++
			});
		});

		const transactions = await getValueFromPromise(promises);
		transactionList.push(...transactions);
	}

	return transactionList;
};

const saveConvertedTransactionsToFile = async () => {
	const datas = await convertTransactions();

	await fs.writeFileAsync(
		`./databases/DB_Crawl/transactions-converted.json`,
		JSON.stringify(datas),
		(error) => {
			if (error) {
				log("Write transactions into file error");
				throw new Error(error);
			}
		}
	);

	log("Write transactions into file successfully");
};	

// 413818 transactions: each 1000 trans are executed with 1m33s
// 195023th transaction has error "MongoServerError: you are over your space quota, using 513 MB of 512 MB"
const saveConvertedTransactionsToDB = async () => {
	for (let i = 195023; i < 413818; i++) {
		// for (let i = 0; i < transactionsConverted.length; i++) {
		try {
			await DBMainTransactionModel.create(transactionsConverted[i])
				.then()
				.catch((error) => {
					log("Write transaction in DB failed");
					throw new Error(error);
				});
		} catch (error) {
			log("Write transaction in DB failed");
			throw new Error(error);
		}
	}

	log("Write transactions in DB successfully");
};

const handleDetailChartTransaction = async () => {
	let sharks = [];
	let shark = {};

	investors.forEach((investor) => {
		let historyDatas = [];
		const sharkWallet = investor._id;
		const symbols = [...new Set(investor.TXs.map((TX) => TX.tokenSymbol))];

		symbols.map((symbol) => {
			let historyData = [];

			investor.TXs.forEach((TX) => {
				if (TX.tokenSymbol === symbol) {
					const n1 = BigInt(TX.value);
					const n2 = BigInt(Number(Math.pow(10, Number(TX.tokenDecimal))));

					historyData.push({
						timeStamp: TX.timeStamp,
						value: "" + Number(BigInt(n1 / n2)),
						status: sharkWallet === TX.from ? "withdraw" : "deposit"
					});
				}
			});

			historyDatas.push({
				coinSymbol: symbol,
				historyData: historyData
			});
		});

		shark = {
			walletAddress: sharkWallet,
			historyDatas: historyDatas
		};

		sharks.push(shark);
	});

	return sharks;
};

export {
	handleEachTransaction,
	convertTransactions,
	saveConvertedTransactionsToFile,
	saveConvertedTransactionsToDB,
	handleDetailChartTransaction
};
