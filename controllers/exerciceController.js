const path = require('path');
const multer = require('multer');
const fs = require('fs');
const { exec } = require('child_process');
const { Exercice } = require('../models');
const { startCorrection } = require('../services/correctionService');

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

const addExercice = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'Aucun fichier n\'a été uploadé' });
        }

        const relativePath = path.join('uploads', 'exercices', req.file.filename);
        const exerciceName = path.basename(req.file.originalname, '.py');

        const exercice = await Exercice.create({
            name: exerciceName,
            file_path: relativePath,
            note: null,
            userId: req.body.userId || 1
        });

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
