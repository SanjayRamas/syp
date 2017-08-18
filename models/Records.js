var mongoose = require('mongoose');

var RecordSchema = new mongoose.Schema({
  bizname: String,
  address: String,
  email: String,
  phone: String,
  category: String,
  link:String,
  upvotes: {type: Number, default: 0},
  comments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Comment' }]
});

RecordSchema.methods.upvote = function (cb) {
  this.upvotes+=1;
  this.save(cb);
}

mongoose.model('Record', RecordSchema);