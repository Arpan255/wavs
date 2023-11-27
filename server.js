const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27017/mydatabase', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
const scanSchema = new mongoose.Schema({
    url: String,
    email: String,
  });
  
  const Scan = mongoose.model('Scan', scanSchema);
  