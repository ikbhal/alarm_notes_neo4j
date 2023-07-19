const express = require('express');
const express_session = require('express-session');
const neo4j = require('neo4j-driver');
// const exphbs = require('express-handlebars');
const { v4: uuidv4 } = require('uuid');
const driver = neo4j.driver('neo4j://localhost', neo4j.auth.basic('neo4j', 'password'));
// const session = driver.session({ database: 'alarm_graph_db' });
const session = driver.session({ database: 'neo4j' });


const app = express();

const sessionOptions = {
  secret: 'alhamdulillah',
  resave: false,
  saveUninitialized: false
};

// Middleware to check if user is authenticated
function isAuthenticated(req, res, next) {
  if (req.session && req.session.userId) {
    return next();
  } else {
    res.redirect('/login');
  }
}

app.use(express_session(sessionOptions));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static('public'));
app.set('view engine', 'handlebars');
app.set('view engine', 'ejs');


app.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Error destroying session:', err);
    }
    res.redirect('/login');
  });
});


app.get('/login', (req, res) => {
  res.render('login');
});

app.post('/login', (req, res) => {
  const { email, mobile } = req.body;

  // Check for specific email and mobile number
  if (email !== 'iqbalforall@gmail.com' || mobile !== '9901014560') {
    // Redirect back to login page if email or mobile number does not match
    return res.redirect('/login');
  }

  // Set the user ID in the session
  req.session.userId = 'sampleUserId';

  // Redirect to the home page
  res.redirect('/');
});


app.get('/', isAuthenticated,async (req, res) => {
  const result = await session.run('MATCH (a:Alarm) RETURN a');
  const alarms = result.records.map((record) => record.get('a').properties);
  res.render('index', { alarms });
});

// app.post('/alarms', async (req, res) => {
//   const { time, notes } = req.body;
//   await session.run('CREATE (a:Alarm {time: $time, notes: $notes})', { time, notes });
//   res.redirect('/');
// });
app.get('/api/alarms', async (req, res) => {
  try {
    const result = await session.run('MATCH (a:Alarm) RETURN a');
    const alarms = result.records.map(record => record.get('a').properties);
    res.json({ alarms });
  } catch (error) {
    console.error('Failed to fetch alarms:', error);
    res.status(500).json({ error: 'Failed to fetch alarms' });
  }
});

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
