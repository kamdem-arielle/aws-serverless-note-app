import { docClient, TABLE_NAME, UpdateCommand } from "/opt/nodejs/shared/dynamodb.mjs";
import { success, badRequest, notFound, error } from "/opt/nodejs/shared/response.mjs";

const TITLE_MAX_LENGTH = 200;
const CONTENT_MAX_LENGTH = 400 * 1024;

export const handler = async (event) => {
  try {
    // TODO: Replace with Cognito JWT extraction once User Pool is configured
    // const userId = event.requestContext.authorizer.claims.sub;
    const userId = event.headers?.["x-user-id"] || "temp-user-id";

    const noteId = event.pathParameters?.noteId;

    if (!noteId) {
      return badRequest("Missing required path parameter: noteId");
    }

    const body = JSON.parse(event.body);
    const { title, content } = body;

    if (!title && !content) {
      return badRequest("At least one of title or content is required");
    }

    if (title !== undefined) {
      if (typeof title !== "string" || title.trim().length === 0) {
        return badRequest("title must be a non-empty string");
      }
      if (title.length > TITLE_MAX_LENGTH) {
        return badRequest(`title must not exceed ${TITLE_MAX_LENGTH} characters`);
      }
    }

    if (content !== undefined) {
      if (typeof content !== "string" || content.trim().length === 0) {
        return badRequest("content must be a non-empty string");
      }
      if (content.length > CONTENT_MAX_LENGTH) {
        return badRequest(`content must not exceed ${CONTENT_MAX_LENGTH} bytes`);
      }
    }

    const expressionParts = [];
    const expressionValues = {};
    const expressionNames = {};

    if (title !== undefined) {
      expressionParts.push("#t = :title");
      expressionValues[":title"] = title.trim();
      expressionNames["#t"] = "title";
    }

    if (content !== undefined) {
      expressionParts.push("#c = :content");
      expressionValues[":content"] = content.trim();
      expressionNames["#c"] = "content";
    }

    expressionParts.push("#u = :updatedAt");
    expressionValues[":updatedAt"] = new Date().toISOString();
    expressionNames["#u"] = "updatedAt";

    const result = await docClient.send(
      new UpdateCommand({
        TableName: TABLE_NAME,
        Key: { userId, noteId },
        UpdateExpression: `SET ${expressionParts.join(", ")}`,
        ExpressionAttributeValues: expressionValues,
        ExpressionAttributeNames: expressionNames,
        ConditionExpression: "attribute_exists(noteId)",
        ReturnValues: "ALL_NEW",
      })
    );

    return success({
      message: "Note updated successfully",
      note: result.Attributes,
    });
  } catch (err) {
    if (err instanceof SyntaxError) {
      return badRequest("Invalid JSON in request body");
    }
    if (err.name === "ConditionalCheckFailedException") {
      return notFound("Note not found or you do not have access");
    }
    console.error("UpdateNote Error:", err);
    return error(500, "Internal server error", err);
  }
};
