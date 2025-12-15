import pkg from "pg";
const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

export default async (req) => {
  try {

    // =====================
    // GET LEADERBOARD
    // =====================
    if (req.method === "GET") {
      const { rows } = await pool.query(
        "SELECT name, score FROM leaderboard ORDER BY score DESC LIMIT 10"
      );
      return new Response(JSON.stringify(rows), {
        headers: { "Content-Type": "application/json" },
      });
    }

    // =====================
    // POST SCORE (UPSERT)
    // =====================
    if (req.method === "POST") {
      const { playerId, name, score } = await req.json();

      await pool.query(
        `
        INSERT INTO leaderboard (player_id, name, score)
        VALUES ($1, $2, $3)
        ON CONFLICT (player_id)
        DO UPDATE SET
          name = EXCLUDED.name,
          score = GREATEST(leaderboard.score, EXCLUDED.score)
        `,
        [playerId, name, score]
      );

      return new Response("OK");
    }

    // =====================
    // PUT NAME UPDATE
    // =====================
    if (req.method === "PUT") {
      const { playerId, name } = await req.json();

      await pool.query(
        `
        UPDATE leaderboard
        SET name = $1
        WHERE player_id = $2
        `,
        [name, playerId]
      );

      return new Response("NAME UPDATED");
    }

    return new Response("Method not allowed", { status: 405 });

  } catch (err) {
    return new Response(err.message, { status: 500 });
  }
};
