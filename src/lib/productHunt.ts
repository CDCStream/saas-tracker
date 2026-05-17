/**
 * Minimal Product Hunt GraphQL client. We only need vote/comment counts
 * for a single product (after launch), keyed off the slug in the URL.
 *
 * Get a developer token at:
 *   https://www.producthunt.com/v2/oauth/applications
 * (read-only is enough — no review needed).
 */
const ENDPOINT = "https://api.producthunt.com/v2/api/graphql";

function slugFromUrl(url: string): string | null {
  // https://www.producthunt.com/posts/<slug>
  const m = url.match(/posts\/([^/?#]+)/);
  return m?.[1] ?? null;
}

export interface PhSnapshot {
  votesCount: number;
  commentsCount: number;
  reviewsCount: number;
  reviewsRating: number; // 0..5
}

export async function fetchPhSnapshot(
  productHuntUrl: string
): Promise<PhSnapshot | null> {
  const token = process.env.PRODUCT_HUNT_TOKEN;
  if (!token) return null;

  const slug = slugFromUrl(productHuntUrl);
  if (!slug) return null;

  const query = `
    query Post($slug: String!) {
      post(slug: $slug) {
        votesCount
        commentsCount
        reviewsCount
        reviewsRating
      }
    }
  `;

  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ query, variables: { slug } }),
    next: { revalidate: 600 },
  });
  if (!res.ok) return null;

  const json = (await res.json()) as {
    data?: { post?: PhSnapshot | null };
  };
  return json.data?.post ?? null;
}
