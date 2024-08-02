const passwordHash = require("password-hash");
const jwt = require("jsonwebtoken");
const ExpressError = require("../config/ExpressError");
const AWS = require('aws-sdk');

AWS.config.update({
    region: process.env.AWS_REGION || 'us-east-1',
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
});

const dynamoDB = new AWS.DynamoDB.DocumentClient();
const tableName =  process.env.UserTableName || "User";
const toolTableName = process.env.ToolTableName || "Tool";

const newUser = async (req, res) => {
  try {
      const { name, username, password } = req.body;
      if (!password || typeof password !== 'string' || password.trim().length === 0) {
          return res.status(400).json({ error: 'Invalid password' });
      }
      const hashedPassword = passwordHash.generate(password);

      const params = {
          TableName: tableName,
          Item: {
              name,
              username,
              password: hashedPassword,
              bookmarks: []
          }
      };

      await dynamoDB.put(params).promise();

      let token = jwt.sign(
          {
              username: username,
          },
          process.env.JWT_PASS
      );
      res.send(token);
  } catch (err) {
      console.log(err);
      return res.status(500).json({ success: false, errors: ["Internal Server Error"] });
  }
};

const signIn = async (req, res) => {
  try {
      const { username, password } = req.body;

      const params = {
          TableName: tableName,
          Key: { username }
      };

      const data = await dynamoDB.get(params).promise();
      const findUser = data.Item;

      if (findUser) {
          let storedPassword = findUser.password;
          if (passwordHash.verify(password, storedPassword)) {
              let token = jwt.sign(
                  {
                      username: username,
                  },
                  process.env.JWT_PASS
              );
              res.send(token);
          } else {
              throw new ExpressError(403, "Wrong Password!");
          }
      } else {
          throw new ExpressError(404, "Username not found!");
      }
  } catch (err) {
      console.log(err);
      return res.status(500).json({ success: false, errors: ["Internal Server Error"] });
  }
};

const addBookmark = async (req, res) => {
  try {
      const { username, id } = req.body; //id of tool which is being bookmarked

      const userParams = {
          TableName: tableName,
          Key: { username }
      };

      const userData = await dynamoDB.get(userParams).promise();
      const findUser = userData.Item;

      if (findUser) {
          const toolParams = {
              TableName: toolTableName,
              Key: { id }
          };

          const toolData = await dynamoDB.get(toolParams).promise();
          const findTool = toolData.Item;

          if (findTool) {
              findUser.bookmarks.push(id);

              const updateParams = {
                  TableName: tableName,
                  Key: { username },
                  UpdateExpression: "set bookmarks = :b",
                  ExpressionAttributeValues: {
                      ":b": findUser.bookmarks
                  }
              };

              await dynamoDB.update(updateParams).promise();
              res.send("Bookmark added!");
          } else {
              throw new ExpressError(404, "Tool not found!");
          }
      } else {
          throw new ExpressError(404, "User not found!");
      }
  } catch (err) {
      console.log(err);
      return res.status(500).json({ success: false, errors: ["Internal Server Error"] });
  }
};

module.exports = { newUser, signIn, addBookmark };
