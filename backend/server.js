const app = require("./src/app");
// const { connectToDB } = require("./src/config/database");
require("dotenv").config();

const port = process.env.PORT || 443;

app.listen(port, async () => {
    // await connectToDB();
    console.log(`Application running on http://localhost:${port}\n`);
})