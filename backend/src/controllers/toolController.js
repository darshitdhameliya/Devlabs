const AWS = require('aws-sdk');

AWS.config.update({
    region: process.env.AWS_REGION || 'us-east-1'
});

const dynamoDB = new AWS.DynamoDB.DocumentClient();
const tableName = process.env.ToolTableName || "Tool";

const addTool = async (req, res) => {
    try {
        const { productName, category, image, link, description } = req.body;

        // Validation
        if (!productName || !category || !image || !link || !description) {
            return res.status(400).json({ success: false, errors: ["All fields are required"] });
        }

        const params = {
            TableName: tableName,
            Item: {
                productName,
                category,
                image,
                link,
                description
            }
        };

        await dynamoDB.put(params).promise();
        return res.status(201).json({ success: true });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, errors: ["Internal Server Error"] });
    }
}

const fetchAllTools = async (req, res) => {
    try {
        const params = {
            TableName: tableName
        };

        const data = await dynamoDB.scan(params).promise();
        const tools = data.Items;

        return res.status(200).json({ success: true, tools });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, errors: ["Internal Server Error"] });
    }
}

module.exports = { addTool, fetchAllTools };