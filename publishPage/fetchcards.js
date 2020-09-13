const fs = require('fs');
const request = require('request');
const baseURL = process.env.NODE_ENV == 'production' ? "https://cdn.protograph.pykih.com/" : "https://dnt71st2q6cqr.cloudfront.net/";

const cards = [
    "3a22007055b900325586", //toStory
    "58b1b2874072b834cdd5", //toCluster
    "8c7f4a1291ed39c16d26", //composecard
    "c9e5bf64ab18cb01e491" //videyoutube
];

cards.forEach(e => {
    request(baseURL + `${e}/ssr-card.min.js`).pipe(fs.createWriteStream(`${process.env.PWD}/cards/${e}.min.js`));
});