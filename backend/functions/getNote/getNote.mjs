import { docClient, TABLE_NAME, GetCommand } from "/opt/nodejs/shared/dynamodb.mjs";
import { success, badRequest, notFound, error } from "/opt/nodejs/shared/response.mjs";

export const handler = async (event) => {
  try {
    // TODO: Replace with Cognito JWT extraction once User Pool is configured
    // const userId = event.requestContext.authorizer.claims.sub;
    const userId = event.headers?.["x-user-id"] || "temp-user-id";

    const noteId = event.pathParameters?.noteId;

    if (!noteId) {
      return badRequest("Missing required path parameter: noteId");
    }

    const result = await docClient.send(
      new GetCommand({
        TableName: TABLE_NAME,
        Key: { userId, noteId },
      })
    );

    if (!result.Item) {
      return notFound(`Note ${noteId} not found`);
    }

    return success(result.Item);
  } catch (err) {
    console.error("GetNote Error:", err);
    return error(500, "Internal server error", err);
  }
};
