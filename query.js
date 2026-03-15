import sqlite3 from 'better-sqlite3';
const db = sqlite3('database.sqlite');
const rows = db.prepare('SELECT * FROM Invoices').all();
console.log(rows);
