const AWS = require('aws-sdk');

AWS.config.update({
    region: process.env.AWS_REGION || 'us-east-1',
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
});

const dynamoDB = new AWS.DynamoDB.DocumentClient();
const tableName = process.env.OpenSourceTableName || "openSource";

const addProject = async (req, res) => {
    try {
        const { projectName, ownerUsername, tags, link, description } = req.body;

        // Validation
        if (!projectName || !ownerUsername || !link || !description) {
            return res.status(400).json({ success: false, errors: ["All fields are required"] });
        }

        const params = {
            TableName: tableName,
            Item: {
                projectName,
                ownerUsername,
                tags,
                link,
                description
            }
        };

        await dynamoDB.put(params).promise();
        return res.status(201).json({ success: true, project: params.Item });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, errors: ["Internal Server Error"] });
    }
};

const fetchAllProjects = async (req, res) => {
    try {
        const { page = 1, limit = 10 } = req.query;
        const params = {
            TableName: tableName,
            Limit: limit,
            ExclusiveStartKey: page > 1 ? { link: (page - 1) * limit } : undefined
        };

        const data = await dynamoDB.scan(params).promise();
        const openSourceProjects = data.Items;

        const countParams = {
            TableName: tableName,
            Select: "COUNT"
        };
        const totalProjectsData = await dynamoDB.scan(countParams).promise();
        const totalProjects = totalProjectsData.Count;

        return res.status(200).json({
            success: true,
            openSourceProjects,
            totalPages: Math.ceil(totalProjects / limit),
            currentPage: parseInt(page)
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, errors: ["Internal Server Error"] });
    }
};

module.exports = { addProject, fetchAllProjects };
