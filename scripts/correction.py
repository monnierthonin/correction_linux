import os
import subprocess
import difflib
import sys

def execute_script(file_path):
    print(f"Tentative d'exécution du fichier : {file_path}")
    try:
        result = subprocess.run(["python", file_path], capture_output=True, text=True, timeout=5)
        output = result.stdout.strip()
        error = result.stderr.strip()
        if error:
            print(f"Erreur d'exécution : {error}")
        return output, error
    except subprocess.TimeoutExpired:
        return None, "Erreur : Temps d'exécution dépassé."
    except Exception as e:
        print(f"Erreur inattendue : {str(e)}")
        return None, str(e)

def compare_files(file1, file2):
    print(f"Comparaison des fichiers : {file1} et {file2}")
    try:
        with open(file1, "r", encoding="utf-8") as f1, open(file2, "r", encoding="utf-8") as f2:
            content1 = f1.readlines()
            content2 = f2.readlines()
            
        diff = difflib.SequenceMatcher(None, ''.join(content1), ''.join(content2))
        similarity_percentage = round(diff.ratio() * 100, 2)
        return similarity_percentage
    except Exception as e:
        print(f"Erreur lors de la comparaison : {str(e)}")
        return 0

def calculate_grade(exercice_path, solution_path):
    print(f"\nCalcul de la note pour :")
    print(f"Exercice : {exercice_path}")
    print(f"Solution : {solution_path}")
    
    grade = 0.0
    
    if not os.path.exists(exercice_path):
        print(f"Erreur : Le fichier exercice n'existe pas : {exercice_path}")
        return 0.0
    if not os.path.exists(solution_path):
        print(f"Erreur : Le fichier solution n'existe pas : {solution_path}")
        return 0.0
    
    # Premier tiers : vérification de l'exécution sans erreur (0.33 points)
    exercice_output, exercice_error = execute_script(exercice_path)
    solution_output, solution_error = execute_script(solution_path)
    
    if not exercice_error:
        grade += 0.33
        print("Pas d'erreur d'exécution : +0.33 points")
    else:
        print(f"Erreur d'exécution : {exercice_error}")
        return 0.0
        
    # Deuxième tiers : comparaison des outputs (0.33 points)
    if exercice_output == solution_output:
        grade += 0.33
        print("Output correct : +0.33 points")
    else:
        print("Output incorrect")
        print(f"Attendu : {solution_output}")
        print(f"Obtenu  : {exercice_output}")
        
    # Troisième tiers : similarité du code (0.34 points au prorata)
    similarity = compare_files(exercice_path, solution_path)
    similarity_points = round((similarity / 100) * 0.34, 2)
    grade += similarity_points
    print(f"Similarité du code {similarity}% : +{similarity_points} points")
    
    # Arrondir la note finale à 2 décimales et la convertir sur 100
    final_grade = round(grade * 100, 2)
    print(f"Note finale : {final_grade}")
    return final_grade

def main():
    if len(sys.argv) != 3:
        print("Usage: python correction.py <exercice_path> <solution_path>")
        sys.exit(1)
        
    exercice_path = sys.argv[1]
    solution_path = sys.argv[2]
    
    grade = calculate_grade(exercice_path, solution_path)
    
    print(grade)

if __name__ == "__main__":
    main()