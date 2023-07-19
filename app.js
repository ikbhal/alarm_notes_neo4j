const express = require('express');
const neo4j = require('neo4j-driver');
// const exphbs = require('express-handlebars');
const { v4: uuidv4 } = require('uuid');
const driver = neo4j.driver('neo4j://localhost', neo4j.auth.basic('neo4j', 'password'));
// const session = driver.session({ database: 'alarm_graph_db' });
const session = driver.session({ database: 'neo4j' });


const app = express();

// app.engine('handlebars', exphbs());
// app.set('view engine', 'handlebars');

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static('public'));
app.set('view engine', 'handlebars');
app.set('view engine', 'ejs');

app.get('/', async (req, res) => {
  const result = await session.run('MATCH (a:Alarm) RETURN a');
  const alarms = result.records.map((record) => record.get('a').properties);
  res.render('index', { alarms });
});

// app.post('/alarms', async (req, res) => {
//   const { time, notes } = req.body;
//   await session.run('CREATE (a:Alarm {time: $time, notes: $notes})', { time, notes });
//   res.redirect('/');
// });

app.post('/alarms', async (req, res) => {
  const { time, notes } = req.body;
  const id = uuidv4(); // Generate a new UUID
  await session.run('CREATE (a:Alarm {id: $id, time: $time, notes: $notes})', { id, time, notes });
  res.json({ success: true });
});

app.delete('/alarms/:id', async (req, res) => {
  const { id } = req.params;
  await session.run('MATCH (a:Alarm {id: $id}) DELETE a', { id });
  res.sendStatus(200);
});


// Set up Express middleware and routes

const port = 3003;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
