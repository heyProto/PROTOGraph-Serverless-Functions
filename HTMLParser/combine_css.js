const minifier = require('minifier');
const cards = [
    "3a22007055b900325586", //toStory
    "58b1b2874072b834cdd5", //toCluster
    "8c7f4a1291ed39c16d26", //composecard
    "c9e5bf64ab18cb01e491", //videyoutube
    "99e448b6fcb668c5a3d4", //toCoverImage
    "9273eab737631412dd01", //toImageNarrative
    "fa446ad88c6fd390e79b", //Footer
    "fe91c98819d83e422f2c"  // CoverStory
];
const input = cards.map(e => `./cards/css/${e}.min.css`);
const options = {
    output: "./dist/ssr-cards.min.css"
}
console.log("Processing the CSS");
minifier.minify(input, options);
console.log("CSS Processed");
