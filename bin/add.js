#! /usr/bin/env node

var request = require("request-promise");
var find = require('lodash/find');

var filemanager = {
    token: null,
    users: [],
    baseUrl: process.env.FILEMANAGER_BASEURL || "http://localhost",
    adminUsername: process.env.FILEMANAGER_ADMIN_USERNAME || "admin",
    adminPassword: process.env.FILEMANAGER_ADMIN_PASSWORD || "admin",
    newUserUsername: process.argv[2],
    newUserPassword: process.argv[3],
    newUserDirectory: process.argv[4] || "",
    rootDataDirectory: "/srv",

    authenticate: function() {
        return request({
            "method":"POST",
            "uri": filemanager.baseUrl + "/api/auth/get",
            "json": {
                "username": filemanager.adminUsername,
                "password": filemanager.adminPassword
            }
        }).then(function(response) {
            console.log("Authentication successful");
            filemanager.token = response;
            return false;
        }, function(body){
            console.log("Authentication failed");
            return body;
        });
    },

    loadUsers: function() {
        return request({
            "method": "GET",
            "uri": filemanager.baseUrl + "/api/users/",
            "headers": {
                "Authorization": "Bearer " + filemanager.token
            }
        }).then(function(response) {
            filemanager.users = JSON.parse(response);
            console.log(filemanager.users.length + " users found");
            return true;
        }, function(body){
            console.log("Unable to load users");
            return false;
        });
    },

    removeUser: function() {
        var user = find(filemanager.users, {username: filemanager.newUserUsername});

        // skip if user not already exists
        if (!user) {
            return Promise.resolve();
        }

        console.log("User already exists and needs to be deleted");

        // delete user
        return request({
            "method": "DELETE",
            "uri": filemanager.baseUrl + "/api/users/" + user.ID,
            "headers": {
                "Authorization": "Bearer " + filemanager.token
            }
        }).then(function() {
            console.log("User successful deleted");
            return true;
        }, function(){
            console.log("Unable to delete user");
            return false;
        });
    },

    addUser: function() {
        return request({
            "method":"POST",
            "uri": filemanager.baseUrl + "/api/users/",
            "headers": {
                "Authorization": "Bearer " + filemanager.token
            },
            "json": {
                "what": "user",
                "which": "new",
                "data": {
                    "ID": 0,
                    "username": filemanager.newUserUsername,
                    "password": filemanager.newUserPassword,
                    "admin": false,
                    "filesystem": filemanager.rootDataDirectory + "/" + filemanager.newUserDirectory,
                    "rules": [

                    ],
                    "css": "",
                    "locale": "",
                    "lockPassword": true,
                    "allowNew": true,
                    "allowEdit": true,
                    "allowCommands": true,
                    "allowPublish": true,
                    "commands": [
                        ""
                    ],
                    "viewMode": "mosaic"
                }
            }
        }).then(function() {
            console.log("User created");
            return true;
        }, function(body){
            console.log("Unable to create user");
            console.log(body.response.body);
            return false;
        });
    }
}

function main(params) {
    filemanager.token = params.token;
    return filemanager.authenticate()
        .then(filemanager.loadUsers)
        .then(filemanager.removeUser)
        .then(filemanager.addUser);
}

if(!filemanager.newUserUsername || !filemanager.newUserPassword) {
    console.log("Usage:");
    console.log("add-filemanager-user [username] [password] [directory]");
    return;
}

main({"token": process.argv[2]}).then(function(result) {
    console.log("Done...");
});