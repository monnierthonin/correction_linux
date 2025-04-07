const { Exercice, Solution } = require('../models');
const { spawn } = require('child_process');
const path = require('path');

const startCorrection = async () => {
    try {
        const uncorrectedExercices = await Exercice.findAll({
            where: {
                note: null
            }
        });

        console.log(`Trouvé ${uncorrectedExercices.length} exercices à corriger`);

        for (const exercice of uncorrectedExercices) {
            try {
                console.log(`\nTraitement de l'exercice ${exercice.id} (${exercice.name})`);
                console.log(`Chemin du fichier: ${exercice.file_path}`);

                const solution = await Solution.findOne({
                    where: {
                        name: exercice.name
                    }
                });

                if (!solution) {
                    console.log(`Pas de solution trouvée pour l'exercice: ${exercice.name}`);
                    continue;
                }

                console.log(`Solution trouvée: ${solution.id} (${solution.name})`);
                console.log(`Chemin de la solution: ${solution.file_path}`);

                const exercicePath = path.join(__dirname, '..', exercice.file_path);
                const solutionPath = path.join(__dirname, '..', solution.file_path);

                console.log('Chemins absolus:');
                console.log('Exercice:', exercicePath);
                console.log('Solution:', solutionPath);

                const pythonProcess = spawn('python', [
                    path.join(__dirname, '..', 'scripts', 'correction.py'),
                    exercicePath,
                    solutionPath
                ]);

                let result = '';
                let error = '';

                pythonProcess.stdout.on('data', (data) => {
                    result += data.toString();
                    console.log('Python stdout:', data.toString());
                });

                pythonProcess.stderr.on('data', (data) => {
                    error += data.toString();
                    console.error('Python stderr:', data.toString());
                });

                await new Promise((resolve, reject) => {
                    pythonProcess.on('close', async (code) => {
                        console.log(`Process exited with code ${code}`);
                        console.log('Résultat complet:', result);
                        
                        if (code === 0) {
                            try {
                                const lines = result.trim().split('\n');
                                const grade = parseFloat(lines[lines.length - 1]);

                                console.log(`Note extraite: ${grade}`);

                                if (!isNaN(grade)) {
                                    const updated = await exercice.update({ note: grade.toString() });
                                    console.log('Mise à jour réussie:', updated.toJSON());
                                    resolve();
                                } else {
                                    console.error(`Note invalide pour l'exercice ${exercice.id}`);
                                    reject(new Error('Note invalide'));
                                }
                            } catch (updateError) {
                                console.error(`Erreur lors de la mise à jour de la note pour l'exercice ${exercice.id}:`, updateError);
                                reject(updateError);
                            }
                        } else {
                            console.error(`Erreur lors de la correction de l'exercice ${exercice.id}:`, error);
                            reject(new Error(`Code de sortie: ${code}`));
                        }
                    });
                }).catch(error => {
                    console.error(`Erreur lors de la correction de l'exercice ${exercice.id}:`, error);
                });

            } catch (exerciceError) {
                console.error(`Erreur lors du traitement de l'exercice ${exercice.id}:`, exerciceError);
            }
        }
    } catch (error) {
        console.error('Erreur lors du processus de correction:', error);
    }
};

module.exports = { startCorrection };
