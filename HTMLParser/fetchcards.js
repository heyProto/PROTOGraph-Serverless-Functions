const fs = require('fs');
const request = require('request');
const baseURL = process.env.NODE_ENV == 'production' ? "https://cdn.protograph.pykih.com/" : "https://dnt71st2q6cqr.cloudfront.net/";

const cards = [
        "3a22007055b900325586", //toStory
        "58b1b2874072b834cdd5", //toCluster
        "8c7f4a1291ed39c16d26", //composecard
        "c9e5bf64ab18cb01e491", //videyoutube
        "99e448b6fcb668c5a3d4", //toCoverImage
        "9273eab737631412dd01",  //toImageNarrative
        "fa446ad88c6fd390e79b", //Footer
        "fe91c98819d83e422f2c" //CoverStory
    ];

console.log("Fetching the files");
cards.forEach(e => {
    //Fetching the JS.
    request(baseURL + `${e}/ssr-card.min.js`).pipe(fs.createWriteStream(`${process.env.PWD}/cards/js/${e}.min.js`));

    //Fetching the CSS.
    request(baseURL + e + '/card.min.css').pipe(fs.createWriteStream(process.env.PWD + '/cards/css/' + e + '.min.css'));
});