const express = require('express');
const userRouter = require('./routes/user');

const app = express();
require('./db/mongoose');

app.use(express.json());
app.use(userRouter);

app.get('/', function (req, res) {
    res.send('Ok, I am here');
});

const port = process.env.PORT || 3000;

app.listen(port, () => {
    console.log(`Worker ${process.pid} started on port ${port} http`);
});
