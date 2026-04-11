import { docClient, TABLE_NAME, DeleteCommand } from "/opt/nodejs/shared/dynamodb.mjs";
import { success, badRequest, notFound, error } from "/opt/nodejs/shared/response.mjs";

export const handler = async (event) => {
  try {
    const userId = event.requestContext.authorizer.jwt.claims.sub;

    const noteId = event.pathParameters?.noteId;

    if (!noteId) {
      return badRequest("Missing required path parameter: noteId");
    }

    await docClient.send(
      new DeleteCommand({
        TableName: TABLE_NAME,
        Key: { userId, noteId },
        ConditionExpression: "attribute_exists(noteId) AND userId = :uid",
        ExpressionAttributeValues: {
          ":uid": userId,
        },
      })
    );

    return success({ message: `Note ${noteId} deleted successfully` });
  } catch (err) {
    if (err.name === "ConditionalCheckFailedException") {
      return notFound(`Note ${noteId} not found or you do not have access`);
    }
    console.error("DeleteNote Error:", err);
    return error(500, "Internal server error", err);
  }
};
