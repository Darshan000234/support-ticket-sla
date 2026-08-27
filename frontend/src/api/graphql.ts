const GRAPHQL_URL = import.meta.env.VITE_GRAPHQL_URL;

interface GraphQLError {
  message: string;
  extensions?: {
    code?: string;
  };
}

interface GraphQLResponse<T> {
  data?: T;
  errors?: GraphQLError[];
}

function getAccessToken(): string | null {
  return localStorage.getItem("accessToken");
}

export async function graphqlRequest<T>(
  query: string,
  variables?: Record<string, unknown>,
): Promise<T> {
  const token = getAccessToken();

  const response = await fetch(GRAPHQL_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token
        ? {
            Authorization: `Bearer ${token}`,
          }
        : {}),
    },
    body: JSON.stringify({
      query,
      variables,
    }),
  });

  if (!response.ok) {
    throw new Error(
      `GraphQL request failed with HTTP ${response.status}`,
    );
  }

  const result =
    (await response.json()) as GraphQLResponse<T>;

  if (result.errors && result.errors.length > 0) {
    const firstError = result.errors[0];

    const code = firstError.extensions?.code;

    throw new Error(
      code
        ? `${code}: ${firstError.message}`
        : firstError.message,
    );
  }

  if (!result.data) {
    throw new Error(
      "GraphQL response did not contain data",
    );
  }

  return result.data;
}