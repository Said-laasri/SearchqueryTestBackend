// models/searchModel.js
const pool = require('../config/database');

async function searchContent(q, category, limit, sortBy, sortOrder) {
    let client;
    try {
        client = await pool.connect();

        const searchTerm = q.trim() + ':*';
        const tsQueryFunc = 'websearch_to_tsquery';
        const queryParams = [searchTerm];
        let paramIndex = 1;

        let sql = `
            SELECT
                sc.id, sc.title, sc.description, sc.url, sc.image_url, sc.category,
                ts_rank_cd(sc.search_vector, query) AS score
            FROM
                searchable_content sc,
                ${tsQueryFunc}('pg_catalog.english', $${paramIndex++}) query
            WHERE
                sc.search_vector @@ query
        `;
        queryParams.push(searchTerm);

        if (category && typeof category === 'string') {
            sql += ` AND sc.category = $${paramIndex++}`;
            queryParams.push(category);
        }

        let orderByClause = 'score DESC';
        if (sortBy === 'title') {
            orderByClause = `sc.title ${sortOrder}`;
        } else if (sortBy === 'created_at') {
            orderByClause = `sc.created_at ${sortOrder}`;
        }
        sql += ` ORDER BY ${orderByClause}, sc.id ASC`;

        sql += ` LIMIT $${paramIndex++}`;
        queryParams.push(limit);

        console.log('Executing SQL in Model:', sql);
        console.log('With Params in Model:', queryParams);
        const { rows } = await client.query(sql, queryParams);
        return rows;

    } catch (error) {
        console.error('Database Error in searchContent:', error);
        throw error; // Re-throw the error for the controller to handle
    } finally {
        if (client) {
            client.release();
        }
    }
}

module.exports = { searchContent };