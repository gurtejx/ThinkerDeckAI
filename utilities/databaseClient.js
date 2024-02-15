import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

/**
 * Database client class to connect to MongoDB.
 * Follows singleton design pattern.
 */
export class DatabaseClient {
	constructor() {
		if (!DatabaseClient.instance) {
			try {
				// Connect to MongoDB
				console.log(process.env.MONGODB_URI)
				const uri = process.env.MONGODB_URI || `mongodb://127.0.0.1:27017/`;
				mongoose
					.connect(uri, {
						dbName: "generativeai",
					})
					.then(() => {
						console.log("MongoDB connected successfully");
					})
					.catch((err) => {
						console.error("Error connecting to MongoDB:", err);
					});

				this.models = {};
				this.createSchemas();
				DatabaseClient.instance = mongoose.connection;
			} catch (error) {
				console.error("Error initializing DatabaseClient:", error);
			}
		}

		return DatabaseClient.instance;
	}

	/**
	 * Method to create schemas and models for the DB.
	 * Models are created as members of the databaseClient object.
	 */
	createSchemas() {
		// user schema
		const userSchema = new mongoose.Schema({
			username: {
				type: String,
				required: true,
				unique: true,
			},
			password: {
				type: String,
				required: true,
			},
		});
		this.models.User = mongoose.model("User", userSchema);

		// category schema
		const categorySchema = new mongoose.Schema({
			name: {
				type: String,
				required: true,
			},
			numQuizzes: {
				type: Number,
				default: 0,
			},
		});
		this.models.Category = mongoose.model("Category", categorySchema);

		// quiz schema
		const quizSchema = new mongoose.Schema({
			category_id: {
				type: mongoose.Schema.Types.ObjectId,
				ref: "Category",
				required: true,
			},
			title: {
				type: String,
				required: true,
			},
			questionObjects: {
				type: Array,
				required: true,
			},
		});
		this.models.Quiz = mongoose.model("Quiz", quizSchema);
	}

	/**
	 * Method to format a string with first letter of each word captial.
	 * Used in this project to create uniformity among 'subject' strings
	 */
	formatString(str) {
		// Split the string into words
		let words = str.split(" ");

		// Capitalize the first letter of each word and convert the rest to lowercase
		let formattedWords = words.map((word) => {
			return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
		});

		// Join the words back together
		return formattedWords.join(" ");
	}

	async findCategory(subject) {
		try {
			const Category = this.models.Category;
			let category = await Category.findOne({
				name: subject,
			});

			if (!category) {
				const newCategory = new Category({
					name: subject,
				});
				await newCategory.save();
				category = newCategory;
			}

			return category;
		} catch (error) {
			console.error("Error finding or creating category:", error);
		}
	}

	async saveQuiz(subject, questions) {
		console.log("Saving quiz...");
		try {
			const Quiz = this.models.Quiz;

			// Format the subject string
			const formattedSubject = this.formatString(subject);

			// Get the category ID based on the subject
			const category = await this.findCategory(formattedSubject);

			// create a new Quiz document
			const newQuiz = new Quiz({
				category_id: category._id,
				title: `${formattedSubject} - ${category.numQuizzes}`,
				questionObjects: questions,
			});
			await newQuiz.save();
		} catch (error) {
			console.error("Error saving quiz:", error);
		}
	}
}

//export default DatabaseClient;