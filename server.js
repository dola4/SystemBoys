require('dotenv').config();
const Child = require('./models/Child');
const Action = require('./models/Action');
const Pointage = require('./models/Pointage');
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

// Connexion à MongoDB (à adapter selon ton port)
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connecté à MongoDB!'))
  .catch((err) => console.error('Erreur de connexion MongoDB:', err));

// Petit test pour voir si le serveur roule
app.get('/', (req, res) => {
  res.send('Le serveur roule!');
});

// Route de login admin sécurisée
app.post('/api/admin/login', (req, res) => {
  const { password } = req.body;
  if (password === process.env.ADMIN_PASSWORD) {
    res.json({ success: true });
  } else {
    res.json({ success: false });
  }
});


// Pour tester l'ajout d'un enfant
app.post('/api/children', async (req, res) => {
  const { name } = req.body;
  const child = new Child({ name });
  await child.save();
  res.json(child);
});

// Pour lister tous les enfants
app.get('/api/children', async (req, res) => {
  const children = await Child.find();
  res.json(children);
});

// Supprimer un enfant
app.delete('/api/children/:id', async (req, res) => {
  console.log("DELETE enfant avec id=", req.params.id);
  const deleted = await Child.findByIdAndDelete(req.params.id);
  if (!deleted) {
    console.log("Aucun enfant supprimé !");
    return res.status(404).json({ success: false, message: "Not found" });
  }
  res.json({ success: true });
});



app.post('/api/actions', async (req, res) => {
  const { name, value, children } = req.body;
  const action = new Action({ name, value, children }); // <-- on ajoute children
  await action.save();
  res.json(action);
});


// Lister toutes les actions
app.get('/api/actions', async (req, res) => {
  const actions = await Action.find();
  console.log("Liste des actions:", actions);
  res.json(actions);
});


// Modifier une action (nom, valeur, enfants associés)
app.put('/api/actions/:id', async (req, res) => {
  const { name, value, children } = req.body;
  const action = await Action.findByIdAndUpdate(
    req.params.id,
    { name, value, children },
    { new: true }
  );
  res.json(action);
});


// Supprimer une action
app.delete('/api/actions/:id', async (req, res) => {
  console.log("DELETE action avec id=", req.params.id);
  try {
    const result = await Action.findByIdAndDelete(req.params.id);
    if (!result) {
      console.log("Aucune action supprimé !");
      return res.status(404).json({ success: false, message: "Not found" });
    }
    res.json({ success: true });
  } catch (e) {
    console.log("Erreur suppression:", e);
    res.status(500).json({ success: false, error: e.message });
  }
});




// Ajouter un pointage
app.post('/api/pointages', async (req, res) => {
  const { childId, actionId } = req.body;
  const action = await Action.findById(actionId);
  if (!action) return res.status(400).json({ error: "Action non trouvée" });
  const pointage = new Pointage({
    child: childId,
    action: actionId,
    actionValue: action.value // on sauve la valeur de l’action au moment du pointage
  });
  await pointage.save();
  res.json(pointage);
});



// Lister les pointages (optionnel pour test)
app.get('/api/pointages', async (req, res) => {
  const pointages = await Pointage.find().populate('child').populate('action');
  res.json(pointages);
});

// Résumé des totaux par enfant
app.get('/api/pointages/summary', async (req, res) => {
  const pointages = await Pointage.find({}).populate('action');
  const totals = {};
  pointages.forEach(p => {
    const childId = p.child.toString();
    // p.actionValue est toujours présent et utilisé si l'action n'existe plus
    const val = (p.action?.value ?? p.actionValue) || 0;
    totals[childId] = (totals[childId] || 0) + val;
  });
  const result = Object.entries(totals).map(([childId, total]) => ({ childId, total }));
  res.json(result);
});


// Calcul du cumul depuis le dernier reset pour un enfant
app.get('/api/pointages/cumul/:childId', async (req, res) => {
  const reset = await CumulReset.findOne({ child: req.params.childId });
  const filter = { child: req.params.childId };
  if (reset) filter.createdAt = { $gt: reset.date };
  const pointages = await Pointage.find(filter).populate('action');
  // Filtrer les pointages qui ont bien une action
  const total = pointages.reduce(
    (sum, p) => sum + ((p.action?.value ?? p.actionValue) || 0),
    0
  );

  res.json({ total });
});



// Historique par jour pour chaque enfant
app.get('/api/pointages/history', async (req, res) => {
  // Récupérer tous les pointages avec les actions (pour la valeur) et les enfants
  const pointages = await Pointage.find().populate('child').populate('action');

  // Grouper les pointages par date (YYYY-MM-DD) puis par enfant
  const days = {};
  pointages.forEach(ptg => {
    // Utilise la date de création (createdAt). Si tu n'as pas le champ, utilise ptg._id.getTimestamp()
    let date;
    if (ptg.createdAt) {
      date = ptg.createdAt.toISOString().slice(0, 10);
    } else {
      date = ptg._id.getTimestamp().toISOString().slice(0, 10);
    }
    if (!days[date]) days[date] = {};
    const childId = ptg.child._id ? ptg.child._id.toString() : ptg.child.toString();
    const val = (ptg.action?.value ?? ptg.actionValue) || 0;
    days[date][childId] = (days[date][childId] || 0) + val;

  });

  // Reformater en tableau pour le frontend
  const data = Object.entries(days)
    .sort(([a], [b]) => b.localeCompare(a)) // tri du plus récent au plus vieux
    .map(([date, scores]) => ({ date, scores }));
  res.json(data);
});

// Nouveau modèle Draft
const draftSchema = new mongoose.Schema({
  scores: { type: Object }, // { childId: { actionId: nombre } }
  date: { type: String } // YYYY-MM-DD
});
const PointageDraft = mongoose.model('PointageDraft', draftSchema);

// Route GET pour récupérer le draft du jour
app.get('/api/pointages/draft', async (req, res) => {
  const draft = await PointageDraft.findOne({ date: new Date().toISOString().slice(0, 10) });
  res.json(draft || { scores: {}, date: new Date().toISOString().slice(0, 10) });
});

// Route POST pour sauver le draft
app.post('/api/pointages/draft', async (req, res) => {
  const { scores } = req.body;
  const date = new Date().toISOString().slice(0, 10);
  await PointageDraft.findOneAndUpdate(
    { date },
    { scores, date },
    { upsert: true, new: true }
  );
  res.json({ ok: true });
});

// Route pour supprimer le draft (après "Enregistrer la journée")
app.delete('/api/pointages/draft', async (req, res) => {
  const date = new Date().toISOString().slice(0, 10);
  await PointageDraft.deleteOne({ date });
  res.json({ ok: true });
});


// Modèle pour les resets cumul
const cumulResetSchema = new mongoose.Schema({
  child: { type: mongoose.Schema.Types.ObjectId, ref: 'Child', required: true },
  date: { type: Date, default: Date.now }
});
const CumulReset = mongoose.model('CumulReset', cumulResetSchema);

// Route POST: reset cumul pour un enfant avec mot de passe
app.post('/api/pointages/reset-cumul/:childId', async (req, res) => {
  const { password } = req.body;
  if (password !== process.env.ADMIN_PASSWORD) {
    return res.status(403).json({ error: "Mot de passe incorrect" });
  }
  await CumulReset.findOneAndUpdate(
    { child: req.params.childId },
    { date: new Date() },
    { upsert: true, new: true }
  );
  res.json({ ok: true });
});


// Route GET: dernier reset cumul par enfant
app.get('/api/pointages/reset-cumul', async (req, res) => {
  const resets = await CumulReset.find();
  res.json(resets);
});


// Détail des points pour un enfant à une date donnée
app.get('/api/pointages/details/:childId/:date', async (req, res) => {
  const { childId, date } = req.params;
  // Cherche tous les pointages pour cet enfant, à cette date précise (date = YYYY-MM-DD)
  // On compare la date sur le champ "createdAt" tronqué à YYYY-MM-DD
  const start = new Date(date + "T00:00:00.000Z");
  const end = new Date(date + "T23:59:59.999Z");
  const pointages = await Pointage.find({
    child: childId,
    createdAt: { $gte: start, $lte: end }
  }).populate('action');
  // Formate les résultats pour le frontend
  res.json(pointages.map(p => ({
    actionName: p.action ? p.action.name : "(action supprimée)",
    value: (p.action?.value ?? p.actionValue) || 0,
    heure: p.createdAt ? p.createdAt.toLocaleTimeString("fr-CA") : "",
  })));
});



// POST: Enregistrer tous les points pour la journée avec mot de passe (sécurisé)
app.post('/api/pointages/secure-save', async (req, res) => {
  const { password, scores } = req.body;
  if (password !== process.env.ADMIN_PASSWORD) {
    return res.status(403).json({ error: "Mot de passe incorrect" });
  }
  // Création des pointages pour chaque enfant/action
  const promises = [];
  Object.entries(scores).forEach(([childId, actionsObj]) => {
    Object.entries(actionsObj).forEach(([actionId, count]) => {
      for (let i = 0; i < count; i++) {
        promises.push(
          (async () => {
            const action = await Action.findById(actionId);
            if (!action) return;
            const pointage = new Pointage({
              child: childId,
              action: actionId,
              actionValue: action.value
            });
            await pointage.save();
          })()
        );
      }
    });
  });
  await Promise.all(promises);
  res.json({ ok: true });
});



const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Serveur lancé sur le port ${PORT}`);
});

