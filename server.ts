import express from 'express';
import sql from 'mssql';
import path from 'path';
import { createServer as createViteServer } from 'vite';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Configuração de conexão com o banco de dados SQL Server
  const config: any = {
    user: process.env.DB_USER || 'Glaucio',
    password: process.env.DB_PASSWORD || '123456',
    server: process.env.DB_SERVER || 'localhost', // Apenas o nome da máquina ou localhost, sem \SQLEXPRESS
    database: process.env.DB_NAME || 'Usuarios',
    options: {
      port: 1433, // A porta padrão do SQL Server
      connectionTimeout: 60000,
      encrypt: true,
      trustServerCertificate: true, // Necessário para desenvolvimento local
    },
  };

  // Se desejar usar a instância nomeada através do SQL Server Browser
  // comente a linha port: 1433 acima e descomente a linha abaixo:
  // config.options.instanceName = 'SQLEXPRESS';

  // Função auxiliar para gerar a cláusula SET para a operação de UPDATE (atualização)
  const generateSetClause = (columns: string[], values: any[]) => {
    return columns.map((col, index) => `${col} = '${values[index]}'`).join(', ');
  };

  // Endpoint de Criação (Inserção de dados)
  app.post('/api/create', async (req, res) => {
    try {
      await sql.connect(config);

      const { tableName, columns, values } = req.body;

      if (!Array.isArray(columns) || !Array.isArray(values) || columns.length !== values.length) {
        return res.status(400).send('Invalid request body');
      }

      const columnNames = columns.join(', ');
      const columnValues = values.map((value: any) => `'${value}'`).join(', ');

      const result = await sql.query(`DECLARE @NewId INT; SELECT @NewId = ISNULL(MAX(Id), 0) + 1 FROM ${tableName}; INSERT INTO ${tableName} (Id, ${columnNames}) VALUES (@NewId, ${columnValues});`);
      res.send(result);
    } catch (err: any) {
      console.error(err);
      res.status(500).send('Internal Server Error: ' + err.message);
    } finally {
      (sql as any).close();
    }
  });

  // Endpoint de Leitura (Seleção/Pesquisa de dados)
  app.get('/api/read/:tableName', async (req, res) => {
    try {
      await sql.connect(config);

      const tableName = req.params.tableName;
      const { columns, conditions } = req.query;

      let query = `SELECT ${columns || '*'} FROM ${tableName}`;
      if (conditions) {
        query += ` WHERE ${conditions}`;
      }
      query += ' ORDER BY Id ASC';

      const result = await sql.query(query);
      res.send(result.recordset);
    } catch (err: any) {
      console.error(err);
      res.status(500).send('Internal Server Error: ' + err.message);
    } finally {
      (sql as any).close();
    }
  });

  // Endpoint de Atualização (UPDATE)
  app.put('/api/update/:tableName/:id', async (req, res) => {
    try {
      await sql.connect(config);

      const tableName = req.params.tableName;
      const id = req.params.id;
      const { columns, values } = req.body;

      if (!Array.isArray(columns) || !Array.isArray(values) || columns.length !== values.length) {
        return res.status(400).send('Invalid request body');
      }

      const setClause = generateSetClause(columns, values);

      const result = await sql.query(`UPDATE ${tableName} SET ${setClause} WHERE Id = TRY_CAST('${id}' AS INT) OR Nome = '${id}'`);
      res.send(result);
    } catch (err: any) {
      console.error(err);
      res.status(500).send('Internal Server Error: ' + err.message);
    } finally {
      (sql as any).close();
    }
  });

  // Endpoint de Exclusão (DELETE) com reordenação de IDs
  app.delete('/api/delete/:tableName/:id', async (req, res) => {
    try {
      await sql.connect(config);

      const tableName = req.params.tableName;
      const id = req.params.id;

      const query = `
        DECLARE @TargetId INT;
        SELECT TOP 1 @TargetId = Id FROM ${tableName} WHERE Id = TRY_CAST('${id}' AS INT) OR Nome = '${id}';
        
        IF @TargetId IS NOT NULL
        BEGIN
            DELETE FROM ${tableName} WHERE Id = @TargetId;
            UPDATE ${tableName} SET Id = Id - 1 WHERE Id > @TargetId;
        END
      `;
      const result = await sql.query(query);
      res.send(result);
    } catch (err: any) {
      console.error(err);
      res.status(500).send('Internal Server Error: ' + err.message);
    } finally {
      (sql as any).close();
    }
  });

  // Middleware do Vite para ambiente de desenvolvimento ou Servidor estático para produção
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

startServer();
