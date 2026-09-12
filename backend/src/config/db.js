require('dotenv').config();

const { Pool } = require('pg');

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is required for the Neon PostgreSQL connection');
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: Number(process.env.DB_POOL_MAX) || 10,
  connectionTimeoutMillis: Number(process.env.DB_CONNECTION_TIMEOUT) || 5000,
  idleTimeoutMillis: Number(process.env.DB_IDLE_TIMEOUT) || 30000,
});

const sql = {
  Int: 'integer',
  Bit: 'boolean',
  Decimal: () => 'numeric',
  NVarChar: () => 'text',
  VarChar: () => 'text',
  MAX: -1,
};

const translateQuery = (query, inputs) => {
  let returning = '';
  let text = query.replace(/\bdbo\./gi, '').replace(/\bOUTPUT\s+INSERTED\.([\s\S]*?)\s+VALUES/gi, (_, columns) => {
    returning = columns.replace(/INSERTED\./gi, '').trim();
    return 'VALUES';
  });

  const topMatch = text.match(/SELECT\s+TOP\s+(\d+)\s+/i);
  if (topMatch) {
    text = text.replace(/SELECT\s+TOP\s+\d+\s+/i, 'SELECT ');
    text = `${text.trim().replace(/;$/, '')} LIMIT ${topMatch[1]}`;
  }

  const values = [];
  text = text.replace(/@([A-Za-z_][A-Za-z0-9_]*)/g, (_, name) => {
    const input = inputs.find((item) => item.name === name);
    if (!input) throw new Error(`Missing database parameter: ${name}`);
    let index = values.indexOf(input.value);
    if (index === -1) {
      values.push(input.value);
      index = values.length - 1;
    }
    return `$${index + 1}`;
  });

  if (returning) text = `${text.trim().replace(/;$/, '')} RETURNING ${returning}`;

  return { text, values };
};

const createRequest = () => {
  const inputs = [];
  return {
    input(name, _type, value) {
      inputs.push({ name, value });
      return this;
    },
    async query(query) {
      const translated = translateQuery(query, inputs);
      const statements = translated.text.split(/;\s*(?=(?:SELECT|UPDATE|INSERT|DELETE)\b)/i).filter(Boolean);
      let result;
      for (const statement of statements) {
        result = await pool.query(statement, translated.values);
      }
      return {
        recordset: result?.rows || [],
        rowsAffected: [result?.rowCount || 0],
      };
    },
    async batch(query) {
      const result = await pool.query(query);
      return { recordset: result.rows, rowsAffected: [result.rowCount || 0] };
    },
  };
};

pool.request = createRequest;

const connectDB = async () => {
  try {
    const client = await pool.connect();
    client.release();
    console.log('✅ Neon PostgreSQL connected');
  } catch (err) {
    console.error('❌ Database connection failed:', err.message);
    throw err;
  }
};

module.exports = { sql, pool, connectDB };
