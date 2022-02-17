const MongoClient = require('mongodb').MongoClient
export class database {
	private dbConnection: any = null;
	private static readonly mongoUrl = 'mongodb://127.0.0.1:27017/RocketLaunchNotifer';
	static dbConnection: any;
	// Open the MongoDB connection.
	openDbConnection() {
		if (this.dbConnection == null) {
			MongoClient.connect(database.mongoUrl, (_err: any, db: any) => {
				console.log("Connected correctly to MongoDB server.");
				this.dbConnection = db;
			});
		}
	}

	// Close the existing connection.
	static closeDbConnection() {
		if (this.dbConnection) {
			this.dbConnection.close();
			this.dbConnection = null;
		}
	}
	/*	
	updateMissionsDaily = async () => {
			const DB_NAME = 'RocketLaunchNotifer';
			const COLLECTION_NAME = 'Launches';
			const value = await allMissions.getAllMissions('')
			try {
				await dbConnect().db(DB_NAME).collection(COLLECTION_NAME).insert(value)
			}
			catch (error: any) {
				throw new Error();
			}
		}
		*/

	static insertDocument(document: any, collectionName: string) {
		console.log(document)
		this.dbConnection.collection(collectionName).insertOne(document, (_err: any, _result: any) => { });
		database.closeDbConnection();
	}

}