import { docClient, TABLE_NAME, PutCommand } from "/opt/nodejs/shared/dynamodb.mjs";
import { created, badRequest, error } from "/opt/nodejs/shared/response.mjs";

const TITLE_MAX_LENGTH = 200;
const CONTENT_MAX_LENGTH = 400 * 1024;

export const handler = async (event) => {
  try {
    // TODO: Replace with Cognito JWT extraction once User Pool is configured
    // const userId = event.requestContext.authorizer.claims.sub;
    const userId = event.headers?.["x-user-id"] || "temp-user-id";

    const body = JSON.parse(event.body);
    const { title, content } = body;

    if (!title || !content) {
      return badRequest("Missing required fields: title, content");
    }

    if (typeof title !== "string" || title.trim().length === 0) {
      return badRequest("title must be a non-empty string");
    }

    if (title.length > TITLE_MAX_LENGTH) {
      return badRequest(`title must not exceed ${TITLE_MAX_LENGTH} characters`);
    }

    if (typeof content !== "string" || content.trim().length === 0) {
      return badRequest("content must be a non-empty string");
    }

    if (content.length > CONTENT_MAX_LENGTH) {
      return badRequest(`content must not exceed ${CONTENT_MAX_LENGTH} bytes`);
    }

    const now = new Date().toISOString();
    const noteId = crypto.randomUUID();

    await docClient.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: {
          userId,
          noteId,
          title: title.trim(),
          content: content.trim(),
          createdAt: now,
          updatedAt: now,
        },
        ConditionExpression: "attribute_not_exists(noteId)",
      })
    );

    return created({
      message: "Note created successfully",
      note: { userId, noteId, title: title.trim(), content: content.trim(), createdAt: now, updatedAt: now },
    });
  } catch (err) {
    if (err instanceof SyntaxError) {
      return badRequest("Invalid JSON in request body");
    }
    if (err.name === "ConditionalCheckFailedException") {
      return error(409, "A note with this ID already exists", err);
    }
    console.error("CreateNote Error:", err);
    return error(500, "Internal server error", err);
  }
};
