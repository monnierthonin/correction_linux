// controllers/exerciceController.js
const path = require('path');
const multer = require('multer');
const fs = require('fs');
const { exec } = require('child_process');
const { Exercice } = require('../models');
const { startCorrection } = require('../services/correctionService');

// Configuration de multer pour l'upload des fichiers
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadsDir = path.join(__dirname, '..', 'uploads', 'exercices');
        // Vérifier si le dossier uploads/exercices existe, sinon le créer
        if (!fs.existsSync(uploadsDir)) {
            fs.mkdirSync(uploadsDir, { recursive: true });
        }
        cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
        // Générer un nom de fichier unique avec timestamp
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + '.py');
    }
});

// Filtre pour n'accepter que les fichiers Python
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
        fileSize: 5 * 1024 * 1024 // Limite à 5MB
    }
});

const getUserExercices = async (req, res) => {
    try {
        const userId = req.params.userId;
        const exercices = await Exercice.findAll({
            where: { userId: userId },
            order: [['createdAt', 'DESC']], // Du plus récent au plus ancien
            attributes: ['id', 'name', 'note', 'createdAt'] // On ne renvoie que les champs nécessaires
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

const addExercice = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'Aucun fichier n\'a été uploadé' });
        }

        // Construire le chemin relatif avec le nouveau sous-dossier exercices
        const relativePath = path.join('uploads', 'exercices', req.file.filename);
        const exerciceName = path.basename(req.file.originalname, '.py');

        // Créer l'exercice dans la base de données avec l'ID utilisateur
        const exercice = await Exercice.create({
            name: exerciceName,
            file_path: relativePath,
            note: null,
            userId: req.body.userId || 1 // Utiliser l'ID fourni ou 1 par défaut
        });

        // Déclencher le processus de correction
        startCorrection().catch(error => {
            console.error('Erreur lors du démarrage de la correction:', error);
        });

        res.status(201).json({ 
            message: 'Exercice ajouté avec succès et correction en cours',
            exercice: {
                id: exercice.id,
                name: exercice.name,
                file_path: exercice.file_path,
                userId: exercice.userId
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

const runExercice = async (req, res) => {
    try {
        const { exerciceId } = req.params;
        const exercice = await Exercice.findByPk(exerciceId);

        if (!exercice) {
            return res.status(404).json({ error: 'Exercice non trouvé' });
        }

        const exercicePath = path.join(__dirname, '..', exercice.file_path);

        if (!fs.existsSync(exercicePath)) {
            return res.status(404).json({ error: 'Fichier d\'exercice non trouvé' });
        }

        exec(`python ${exercicePath}`, (error, stdout, stderr) => {
            if (error) {
                return res.status(500).json({ 
                    error: 'Erreur d\'exécution',
                    details: stderr
                });
            }
            res.status(200).json({ 
                output: stdout,
                exercice: {
                    id: exercice.id,
                    name: exercice.name,
                    note: exercice.note,
                    userId: exercice.userId
                }
            });
        });
    } catch (error) {
        console.error('Erreur lors de l\'exécution de l\'exercice:', error);
        res.status(500).json({ 
            error: 'Erreur lors de l\'exécution de l\'exercice',
            details: error.message 
        });
    }
};

module.exports = { upload, addExercice, runExercice, getUserExercices };
