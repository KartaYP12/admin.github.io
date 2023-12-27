const express = require("express");
const router = express.Router();
const User = require("../models/users");
const multer = require("multer");
const fs = require("fs");
const { error } = require("console");

//image up
var storage = multer.diskStorage({
    destination: function(req, file, cb){
        cb(null, "./uploads");
    },
    filename: function(req, file, cb){
        cb(null, file.fieldname+"_"+Date.now()+"_"+file.originalname);
    },
})

var upload = multer({
    storage: storage,
}).single("image");

//insert an user
router.post("/add", upload, (req, res)=>{
    const user = new User({
        name: req.body.name,
        email: req.body.email,
        phone: req.body.phone,
        bidang: req.body.bidang,
        status: req.body.status,
        instagram: req.body.instagram,
        image: req.file.filename,
    });
    user.save()
    .then(() => {
        req.session.message = {
            type: "success",
            message: "Member added successfully!",
        };
        res.redirect("/");
    })
    .catch((error) => {
        res.json({ message: error.message, type: "danger" });
    });
});

//Get all users route
router.get("/", async (req, res) => {
    try {
        const users = await User.find().exec();
        res.render("index", {
            title: "Admin Page",
            users: users,
        });
    } catch (error) {
        res.json({ message: error.message });
    }
});

router.get("/add", (req, res)=> {
    res.render("add_users", {title: "Add Members"});
});

// Edit
router.get("/edit/:id", async (req, res) => {
    try {
        const id = req.params.id;
        const user = await User.findById(id).exec();

        if (user == null) {
            res.redirect("/");
        } else {
            res.render("edit_users", {
                title: "Edit Member",
                user: user,
            });
        }
    } catch (error) {
        res.redirect("/");
    }
});

//update 
router.post("/update/:id", upload, async (req, res) => {
    try {
        const id = req.params.id;
        let new_image = "";

        if (req.file) {
            new_image = req.file.filename;
            try {
                fs.unlinkSync("./uploads/" + req.body.old_image);
            } catch (error) {
                console.log(error);
            }
        } else {
            new_image = req.body.old_image;
        }

        const result = await User.findByIdAndUpdate(id, {
            name: req.body.name,
            email: req.body.email,
            phone: req.body.phone,
            bidang: req.body.bidang,
            status: req.body.status,
            instagram: req.body.instagram,
            image: new_image,
        }).exec();

        if (!result) {
            res.json({ message: "User not found", type: "danger" });
        } else {
            req.session.message = {
                type: "success",
                message: "Member Updated Successfully!",
            };
            res.redirect("/");
        }
    } catch (error) {
        res.json({ message: error.message, type: "danger" });
    }
});

//delete
router.get("/delete/:id", async (req, res) => {
    try {
        const id = req.params.id;
        const result = await User.findByIdAndDelete(id).exec();

        if (result && result.image !== "") {
            try {
                fs.unlinkSync("./uploads/" + result.image);
            } catch (error) {
                console.log(error);
            }
        }

        req.session.message = {
            type: "info",
            message: "Member deleted successfully!",
        };
        res.redirect("/");
    } catch (error) {
        res.json({ message: error.message });
    }
});

module.exports = router;