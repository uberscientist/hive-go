// GET / - Render main page
exports.index = function(req, res){
  res.render('index', { title: 'Hive Go' })
};
