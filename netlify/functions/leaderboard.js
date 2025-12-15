import pkg from "pg";
const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

export async function handler(event) {
  try {
    // ✅ GET leaderboard
    if (event.httpMethod === "GET") {
      const { rows } = await pool.query(
        "SELECT name, score FROM leaderboard ORDER BY score DESC LIMIT 10"
      );

      return {
        statusCode: 200,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(rows),
      };
    }

    // ✅ POST score
    if (event.httpMethod === "POST") {
      const { name, score } = JSON.parse(event.body);

      if (!name || typeof score !== "number") {
        return { statusCode: 400, body: "Invalid data" };
      }

      await pool.query(
        `
        INSERT INTO leaderboard (name, score)
        VALUES ($1, $2)
        ON CONFLICT (name)
        DO UPDATE SET score = GREATEST(leaderboard.score, EXCLUDED.score)
        `,
        [name, score]
      );

      return {
        statusCode: 200,
        body: JSON.stringify({ success: true }),
      };
    }

    return { statusCode: 405, body: "Method not allowed" };
  } catch (err) {
    console.error(err);
    return { statusCode: 500, body: err.message };
  }
}
