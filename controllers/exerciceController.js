const path = require('path');
const multer = require('multer');
const fs = require('fs');
const { spawn } = require('child_process');
const { Exercice, Solution } = require('../models');

// Configuration de multer pour l'upload de fichiers
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadsDir = path.join(__dirname, '..', 'uploads', 'exercices');
        if (!fs.existsSync(uploadsDir)) {
            fs.mkdirSync(uploadsDir, { recursive: true });
        }
        cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + '.py');
    }
});

const fileFilter = (req, file, cb) => {
    if (file.originalname.endsWith('.py')) {
        cb(null, true);
    } else {
        cb(new Error('Seuls les fichiers Python (.py) sont acceptés'), false);
    }
};

const upload = multer({ 
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024
    }
});

// Récupérer les exercices d'un utilisateur
const getUserExercices = async (req, res) => {
    try {
        const userId = req.params.userId;
        const exercices = await Exercice.findAll({
            where: { userId: userId },
            order: [['createdAt', 'DESC']],
            attributes: ['id', 'name', 'note', 'createdAt']
        });

        res.status(200).json(exercices);
    } catch (error) {
        console.error('Erreur lors de la récupération des exercices:', error);
        res.status(500).json({ 
            error: 'Erreur lors de la récupération des exercices',
            details: error.message
        });
    }
};

// Ajouter un nouvel exercice
const addExercice = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'Aucun fichier fourni' });
        }

        // Créer l'exercice dans la base de données
        const exerciceName = req.body.name;
        const relativePath = path.join('uploads', 'exercices', req.file.filename);
        
        const exercice = await Exercice.create({
            name: exerciceName,
            file_path: relativePath,
            note: null,
            userId: req.body.userId || 1
        });

        // Lancer la correction immédiatement
        correctExercice(exercice.id);

        res.status(201).json({
            message: 'Exercice ajouté avec succès',
            exercice: {
                id: exercice.id,
                name: exercice.name,
                note: exercice.note
            }
        });
    } catch (error) {
        console.error('Erreur lors de l\'ajout de l\'exercice:', error);
        res.status(500).json({ 
            error: 'Erreur lors de l\'ajout de l\'exercice',
            details: error.message
        });
    }
};

// Corriger un exercice
const correctExercice = async (exerciceId) => {
    try {
        // Récupérer l'exercice
        const exercice = await Exercice.findByPk(exerciceId);
        if (!exercice) {
            console.error(`Exercice ${exerciceId} non trouvé`);
            return;
        }

        // Trouver la solution correspondante
        const solution = await Solution.findOne({
            where: { name: exercice.name }
        });

        if (!solution) {
            console.error(`Pas de solution trouvée pour l'exercice: ${exercice.name}`);
            return;
        }

        // Chemins absolus pour les fichiers
        const exercicePath = path.join(__dirname, '..', exercice.file_path);
        const solutionPath = path.join(__dirname, '..', solution.file_path);

        // Lancer le script de correction Python
        const pythonProcess = spawn('python', [
            path.join(__dirname, '..', 'scripts', 'correction.py'),
            exercicePath,
            solutionPath
        ]);

        let result = '';
        let error = '';

        // Récupérer la sortie du script
        pythonProcess.stdout.on('data', (data) => {
            result += data.toString();
        });

        pythonProcess.stderr.on('data', (data) => {
            error += data.toString();
        });

        // Attendre la fin de l'exécution
        pythonProcess.on('close', async (code) => {
            if (code !== 0) {
                console.error(`Erreur lors de la correction: ${error}`);
                return;
            }

            // La dernière ligne contient la note
            const lines = result.trim().split('\n');
            const note = parseFloat(lines[lines.length - 1]);

            // Mettre à jour la note dans la base de données
            await exercice.update({ note: note });
            console.log(`Note mise à jour pour l'exercice ${exerciceId}: ${note}`);
        });

    } catch (error) {
        console.error('Erreur lors de la correction:', error);
    }
};

const runExercice = async (req, res) => {
    const { exerciceId } = req.params;

    try {
        const exercice = await Exercice.findByPk(exerciceId);
        if (!exercice) {
            return res.status(404).json({ error: 'Exercice non trouvé' });
        }

        const exercicePath = path.join(__dirname, '..', exercice.file_path);
        
        if (!fs.existsSync(exercicePath)) {
            return res.status(404).json({ error: 'Fichier d\'exercice non trouvé' });
        }

        const pythonProcess = spawn('python', [exercicePath]);

        let result = '';
        let error = '';

        pythonProcess.stdout.on('data', (data) => {
            result += data.toString();
        });

        pythonProcess.stderr.on('data', (data) => {
            error += data.toString();
        });

        pythonProcess.on('close', (code) => {
            if (code !== 0) {
                console.error(`Erreur d'exécution: ${error}`);
                return res.status(500).json({
                    error: 'Erreur lors de l\'exécution',
                    details: error
                });
            }

            res.json({
                output: result,
                message: 'Exécution réussie'
            });
        });
    } catch (error) {
        console.error('Erreur:', error);
        res.status(500).json({
            error: 'Erreur lors de l\'exécution',
            details: error.message
        });
    }
};

module.exports = { 
    upload, 
    addExercice, 
    getUserExercices,
    correctExercice, 
    runExercice
};
