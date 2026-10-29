const express = require('express');
const mongoose = require('mongoose');
const apiRoutes = require('./routes/api');
const webRoutes = require('./routes/web');

function initSafarSplit(app, options = {}) {
  const mongoUri = process.env.SAFARSPLIT_MONGO_URI || process.env.MONGO_URI;
  if (mongoUri && mongoose.connection.readyState === 0) {
    mongoose.connect(mongoUri)
      .then(() => console.log('✅ SafarSplit connected to MongoDB Atlas'))
      .catch(err => console.error('❌ SafarSplit MongoDB connection error:', err));
  }

  // Mount API endpoints: /api/trips, /api/safarsplit/trips, /api/version
  app.use('/api', apiRoutes);
  app.use('/api/safarsplit', apiRoutes);

  // Mount Web views: /t/:code, /trip/:code, /safarsplit/t/:code
  app.use('/', webRoutes);
  app.use('/safarsplit', webRoutes);

  console.log('✅ SafarSplit routes mounted:');
  console.log('   - APIs: /api/trips, /api/safarsplit/trips');
  console.log('   - Web Views: /t/:tripCode, /trip/:tripCode, /safarsplit/t/:tripCode');
}

module.exports = { initSafarSplit, apiRoutes, webRoutes };
