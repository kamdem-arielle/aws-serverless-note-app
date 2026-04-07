import { docClient, TABLE_NAME, QueryCommand } from "/opt/nodejs/shared/dynamodb.mjs";
import { success, error } from "/opt/nodejs/shared/response.mjs";

export const handler = async (event) => {
  try {
    // TODO: Replace with Cognito JWT extraction once User Pool is configured
    // const userId = event.requestContext.authorizer.claims.sub;
    const userId = event.headers?.["x-user-id"] || "temp-user-id";

    const result = await docClient.send(
      new QueryCommand({
        TableName: TABLE_NAME,
        KeyConditionExpression: "userId = :uid",
        ExpressionAttributeValues: {
          ":uid": userId,
        },
      })
    );

    const notes = (result.Items || []).sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );

    return success({
      count: notes.length,
      notes,
    });
  } catch (err) {
    console.error("GetNotes Error:", err);
    return error(500, "Internal server error", err);
  }
};
