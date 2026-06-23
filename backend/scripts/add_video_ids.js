const axios = require("axios");

async function main() {
    const username = "priyadharsant";

    const response = await axios.get(
        `https://alfa-leetcode-api.onrender.com/${username}/calendar`
    );

    console.log(response.data);
}

main();