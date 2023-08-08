const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const _ = require("lodash");

const uri = "mongodb+srv://sofiabhernandes:7874senha@cluster0.licg8rz.mongodb.net/todolistDB";
mongoose.connect(uri);
mongoose.set('bufferCommands', false);

const connectDB = async () => {
    try {
      await mongoose.connect("mongodb+srv://sofiabhernandes:7874senha@cluster0.licg8rz.mongodb.net/todolistDB")
      console.log('MongoDB connected!!')
    } catch (err) {
      console.log('Failed to connect to MongoDB', err)
    }
}

const app = express();
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));


/* Mongoose database */
// Model and schema for the items
const Item = mongoose.model('Item', new mongoose.Schema({
    name: String
    })
);

// Default items
const item1 = new Item ({ name: 'Welcome to our to-do list.' });
const item2 = new Item ({ name: 'Add items by pressing the + button.' });
const item3 = new Item ({ name: '<- Hit this to delete an item.' });

// Find all items that exist
const allItems = Item.find({});

// Create a new custom list with the custom route parameters
const List = mongoose.model('List', new mongoose.Schema({
    name: String,
	items: []
	})
);


/* To-do list pages */
// Main list page
app.get("/", function(req, res) {
    Item.find({}).then(function(allItems) { // Lists all of the existing items (in the form of documents)
        if (allItems.length === 0) { // If there are no items in the list, the default ones will be added
            Item.insertMany([item1, item2, item3]).then(function(){
                console.log("Data inserted") // Success
            }).catch(function(err){
                console.log(err) // Failure
            });
            res.redirect("/");
        } else {
            res.render("list", {
                listTitle: "Today",
                newListItems: allItems
            });
        }
    });
});

// Adding items to any list
app.post("/", function(req, res) {
    const itemName = req.body.newItem;
		const listName = req.body.list;

    const addedItem = new Item ({ name: itemName });

		if (listName === "Today") {
			addedItem.save();
			res.redirect("/");
		} else {
			List.findOne({ name: listName }).exec().then(foundList => {
            foundList.items.push(addedItem) // "items" is the name of the array of items defined in the model
            foundList.save()
            res.redirect("/" + listName)
        }).catch(err => {
            console.log(err);
        });
		}
});

// Deletes items after they're checked
app.post("/delete", function (req, res) {
    const checkedItemId = req.body.deletedItem;
		const listName = req.body.list;

		if (listName === "Today") {
			Item.findByIdAndRemove(checkedItemId)
        .then(() => {
            console.log("Successfully deleted checked item");
            res.redirect("/");
		}).catch(err => {
            console.log(err);
        });
		} else {
        List.findByIdAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemId}}})
            .catch((err) => {
                if(!err){
				    console.log("Successfully deleted checked item");
                    res.redirect("/" + listName);
                }
            });
    }
});

// Creates different lists for different topics
app.get('/:theme', (req, res) => {
    const customListName = _.capitalize(req.params.theme);

    List.findOne({name:customListName}).exec()
    .then(function(foundList) {

        if (!foundList) {
            const customList = new List({
                name: customListName,
                items: [item1, item2, item3]
            });
            list.save();
            res.redirect("/" + customListName);
        } else {
            res.render("list",{listTitle: foundList.name, newListItems: foundList.items});
        }

    }).catch(err => {
		console.log(err);
	});
});

app.listen(3001, function() {
    console.log("Server running on port 3001.");
});

connectDB.then(() => {
    app.listen(PORT, () => {
        console.log(`Listening on port ${PORT}`);
    })
});
