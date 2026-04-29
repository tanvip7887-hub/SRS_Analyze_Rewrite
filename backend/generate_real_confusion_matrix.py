import json
import os
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.metrics import confusion_matrix, f1_score, accuracy_score
import pandas as pd

def generate_real_confusion_matrix(output_dir):
    """Generates confusion matrix from ACTUAL project data."""
    
    # Load the actual comparison data
    comparison_file = r'd:\SRS_Analyze_Rewrite\backend\app\storage\output\comparison_output.json'
    
    try:
        with open(comparison_file, 'r', encoding='utf-8') as f:
            data = json.load(f)
    except Exception as e:
        print(f"Error loading data: {e}")
        return
    
    os.makedirs(output_dir, exist_ok=True)
    
    # Extract predictions from both models
    y_true_model_a = []  # Model A predictions
    y_true_model_b = []  # Model B predictions
    agreements = []
    
    for req_id, req_data in data.items():
        model_a_ambiguous = req_data['model_a']['ambiguous']
        model_b_ambiguous = req_data['model_b']['ambiguous']
        agreement = req_data['agreement']
        
        y_true_model_a.append(1 if model_a_ambiguous else 0)
        y_true_model_b.append(1 if model_b_ambiguous else 0)
        agreements.append(1 if agreement else 0)
    
    y_true_model_a = np.array(y_true_model_a)
    y_true_model_b = np.array(y_true_model_b)
    agreements = np.array(agreements)
    
    # Create confusion matrix: Model A vs Model B predictions
    cm = confusion_matrix(y_true_model_a, y_true_model_b)
    labels = ['Clear (0)', 'Ambiguous (1)']
    
    # Calculate statistics
    accuracy = accuracy_score(y_true_model_a, y_true_model_b)
    agreement_rate = np.mean(agreements)
    
    # Display statistics
    print(f"\n{'='*60}")
    print(f"CONFUSION MATRIX ANALYSIS - MODEL A vs MODEL B")
    print(f"{'='*60}")
    print(f"Total Requirements Analyzed: {len(data)}")
    print(f"Agreement Rate: {agreement_rate:.2%}")
    print(f"Accuracy (Model A vs B): {accuracy:.2%}")
    print(f"\nClear Requirements: {np.sum(y_true_model_a == 0)} (Model A), {np.sum(y_true_model_b == 0)} (Model B)")
    print(f"Ambiguous Requirements: {np.sum(y_true_model_a == 1)} (Model A), {np.sum(y_true_model_b == 1)} (Model B)")
    print(f"\nConfusion Matrix:")
    print(cm)
    print(f"{'='*60}\n")
    
    # Create visualization
    plt.figure(figsize=(10, 8))
    sns.set_theme(style="whitegrid", context="paper")
    sns.heatmap(cm, annot=True, fmt='d', cmap='Blues', 
                xticklabels=labels, yticklabels=labels, 
                cbar_kws={'label': 'Count'},
                annot_kws={'size': 16, 'weight': 'bold'})
    
    plt.title(f'Model Comparison: SVM + MiniLM vs RoBERTa NLI\n({len(data)} Requirements, {agreement_rate:.1%} Agreement)', 
              fontsize=16, weight='bold', pad=20)
    plt.ylabel('Model A (SVM + MiniLM)', fontsize=13, weight='bold')
    plt.xlabel('Model B (RoBERTa NLI)', fontsize=13, weight='bold')
    plt.tight_layout()
    plt.savefig(os.path.join(output_dir, 'real_confusion_matrix_model_comparison.png'), dpi=300, bbox_inches='tight')
    plt.close()
    print("✓ Confusion matrix saved: real_confusion_matrix_model_comparison.png")
    
    # Create a detailed metrics table
    metrics = {
        'Model A Clear': np.sum(y_true_model_a == 0),
        'Model A Ambiguous': np.sum(y_true_model_a == 1),
        'Model B Clear': np.sum(y_true_model_b == 0),
        'Model B Ambiguous': np.sum(y_true_model_b == 1),
        'Total Agreement': np.sum(agreements),
        'Total Disagreement': np.sum(1 - agreements),
    }
    
    # Save metrics to CSV
    metrics_df = pd.DataFrame(list(metrics.items()), columns=['Metric', 'Count'])
    metrics_df.to_csv(os.path.join(output_dir, 'confusion_matrix_metrics.csv'), index=False)
    print("✓ Metrics saved: confusion_matrix_metrics.csv")
    
    # Create detailed breakdown visualization
    fig, axes = plt.subplots(1, 2, figsize=(14, 5))
    
    # Subplot 1: Model predictions
    models = ['Model A\n(SVM+MiniLM)', 'Model B\n(RoBERTa)']
    clear_counts = [np.sum(y_true_model_a == 0), np.sum(y_true_model_b == 0)]
    ambiguous_counts = [np.sum(y_true_model_a == 1), np.sum(y_true_model_b == 1)]
    
    x = np.arange(len(models))
    width = 0.35
    
    axes[0].bar(x - width/2, clear_counts, width, label='Clear', color='#2ecc71', alpha=0.8)
    axes[0].bar(x + width/2, ambiguous_counts, width, label='Ambiguous', color='#e74c3c', alpha=0.8)
    axes[0].set_ylabel('Number of Requirements', fontsize=11, weight='bold')
    axes[0].set_title('Model Predictions Distribution', fontsize=12, weight='bold')
    axes[0].set_xticks(x)
    axes[0].set_xticklabels(models)
    axes[0].legend()
    axes[0].grid(axis='y', alpha=0.3)
    
    # Subplot 2: Agreement breakdown
    agreement_labels = ['Agreement', 'Disagreement']
    agreement_vals = [np.sum(agreements), np.sum(1 - agreements)]
    colors = ['#3498db', '#f39c12']
    
    wedges, texts, autotexts = axes[1].pie(agreement_vals, labels=agreement_labels, autopct='%1.1f%%',
                                            colors=colors, startangle=90, textprops={'fontsize': 11, 'weight': 'bold'})
    axes[1].set_title(f'Model Agreement Rate\n({agreement_rate:.1%})', fontsize=12, weight='bold')
    
    plt.tight_layout()
    plt.savefig(os.path.join(output_dir, 'real_model_analysis_detailed.png'), dpi=300, bbox_inches='tight')
    plt.close()
    print("✓ Detailed analysis saved: real_model_analysis_detailed.png")
    
    return data, cm, metrics

if __name__ == '__main__':
    output_directory = r'D:\SRS_Analyze_Rewrite\research_paper_graphs'
    generate_real_confusion_matrix(output_directory)
