/**
 * Edge Database Helper for Cloudflare D1
 */

export async function queryD1(sql, params = []) {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const databaseId = process.env.CLOUDFLARE_D1_DATABASE_ID;
  const apiToken = process.env.CLOUDFLARE_D1_API_TOKEN;

  if (!accountId || !databaseId || !apiToken) {
    return [];
  }

  try {
    const endpoint = `https://api.cloudflare.com/client/v4/accounts/${accountId}/d1/database/${databaseId}/query`;
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ sql, params })
    });

    if (!res.ok) {
      console.error('D1 Query HTTP error:', res.status);
      return [];
    }

    const data = await res.json();
    return data.result?.[0]?.results || [];
  } catch (err) {
    console.error('D1 Edge Query Error:', err.message);
    return [];
  }
}
