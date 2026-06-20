const express = require('express');
const { ObjectId } = require('mongodb');
const bcrypt = require('bcryptjs');

module.exports = function (db) {
  const router = express.Router();

  router.get('/', async (req, res) => {
    try {
      const movies = await db.collection('movies').find({}).toArray();
      const formattedMovies = movies.map(m => {
        const doc = { id: m._id.toString(), ...m };
        delete doc._id;
        return doc;
      });
      res.json(formattedMovies);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  router.post('/', async (req, res) => {
    try {
      const result = await db.collection('movies').insertOne(req.body);
      res.json({ id: result.insertedId.toString(), ...req.body });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  router.put('/:id', async (req, res) => {
    try {
      const id = req.params.id;
      const { _id, id: bodyId, ...updateData } = req.body;
      await db.collection('movies').updateOne(
        { _id: new ObjectId(id) },
        { $set: updateData }
      );
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  router.delete('/:id', async (req, res) => {
    try {
      const id = req.params.id;
      await db.collection('movies').deleteOne({ _id: new ObjectId(id) });
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  router.post('/verify', async (req, res) => {
    try {
      const { passcode } = req.body;
      let settings = await db.collection('settings').findOne({ type: 'admin_config' });

      if (!settings) {
        // const hashedPasscode = await bcrypt.hash('1607', 10);
        // await db.collection('settings').insertOne({ type: 'admin_config', passcode: hashedPasscode });
        // settings = { passcode: hashedPasscode };
        res.status(404).json({ success: false, error: 'Admin credentail not found' });

      } else if (!settings.passcode.startsWith('$2')) {
        // Migrate existing plaintext passcode to hash
        const hashedPasscode = await bcrypt.hash(settings.passcode, 10);
        await db.collection('settings').updateOne({ type: 'admin_config' }, { $set: { passcode: hashedPasscode } });
        settings.passcode = hashedPasscode;
      }

      const expectedPasscodeHash = settings.passcode;
      const isMatch = await bcrypt.compare(passcode, expectedPasscodeHash);

      if (isMatch) {
        res.json({ success: true });
      } else {
        res.status(401).json({ success: false, error: 'Incorrect passcode' });
      }
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  return router;
};
