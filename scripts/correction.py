#!/usr/bin/env python3
import os
import sys
import difflib
import subprocess

def run_python_file(file_path):
    """
    Exécute un fichier Python et retourne son output et ses erreurs.
    """
    try:
        # Exécuter le fichier Python
        process = subprocess.run(
            ['python', file_path],
            capture_output=True,
            text=True,
            timeout=5
        )
        
        # Récupérer l'output et les erreurs
        output = process.stdout.strip()
        errors = process.stderr.strip()
        
        return {
            'success': process.returncode == 0 and not errors,
            'output': output,
            'errors': errors
        }
    except Exception as e:
        return {
            'success': False,
            'output': '',
            'errors': str(e)
        }

def calculate_similarity(file1_path, file2_path):
    """
    Compare deux fichiers et retourne leur pourcentage de similarité.
    """
    try:
        # Lire les deux fichiers
        with open(file1_path, 'r') as f1, open(file2_path, 'r') as f2:
            content1 = f1.read().strip()
            content2 = f2.read().strip()
        
        # Calculer la similarité
        matcher = difflib.SequenceMatcher(None, content1, content2)
        similarity = matcher.ratio() * 100
        
        return round(similarity, 2)
    except Exception as e:
        print(f"Erreur lors de la comparaison des fichiers : {e}")
        return 0

def grade_exercise(exercise_path, solution_path):
    """
    Note un exercice selon trois critères :
    1. Exécution sans erreur (33.33%)
    2. Output correct (33.33%)
    3. Similarité du code (33.34%)
    """
    # Initialiser la note
    grade = 0
    max_grade = 100
    
    print("\n=== Correction de l'exercice ===")
    print(f"Exercice : {exercise_path}")
    print(f"Solution : {solution_path}")
    
    # Vérifier que les fichiers existent
    if not os.path.exists(exercise_path):
        print("Erreur : Fichier exercice non trouvé")
        return 0
    if not os.path.exists(solution_path):
        print("Erreur : Fichier solution non trouvé")
        return 0
    
    # 1. Exécution sans erreur (33.33%)
    print("\n1. Test d'exécution (33.33%)")
    exercise_result = run_python_file(exercise_path)
    
    if exercise_result['success']:
        grade += 33.33
        print("L'exercice s'exécute sans erreur (+33.33 points)")
    else:
        print("Erreur lors de l'exécution :")
        print(f"   {exercise_result['errors']}")
    
    # 2. Output correct (33.33%)
    print("\n2. Vérification de l'output (33.33%)")
    solution_result = run_python_file(solution_path)
    
    if exercise_result['success'] and solution_result['success']:
        if exercise_result['output'] == solution_result['output']:
            grade += 33.33
            print("Output correct (+33.33 points)")
        else:
            print("Output incorrect")
            print(f"   Attendu : {solution_result['output']}")
            print(f"   Obtenu  : {exercise_result['output']}")
    
    # 3. Similarité du code (33.34%)
    print("\n3. Analyse de similarité (33.34%)")
    similarity = calculate_similarity(exercise_path, solution_path)
    similarity_points = (similarity * 33.34) / 100
    grade += similarity_points
    print(f"Similarité : {similarity}% (+{similarity_points:.2f} points)")
    
    # Note finale
    final_grade = round(grade, 2)
    print(f"\n=== Note finale : {final_grade}/100 ===")
    
    # Retourner uniquement le nombre pour le parsing
    return final_grade

if __name__ == "__main__":
    # Vérifier les arguments
    if len(sys.argv) != 3:
        print("Usage: python correction.py <exercise_path> <solution_path>")
        sys.exit(1)
    
    # Récupérer les chemins des fichiers
    exercise_path = sys.argv[1]
    solution_path = sys.argv[2]
    
    # Corriger l'exercice et afficher la note
    grade = grade_exercise(exercise_path, solution_path)
    print(grade)  # Pour le parsing par Node.js