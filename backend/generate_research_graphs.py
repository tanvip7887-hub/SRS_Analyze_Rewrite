import os
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.metrics import confusion_matrix, f1_score, accuracy_score, roc_auc_score
from sklearn.preprocessing import label_binarize
import pandas as pd

def setup_style():
    sns.set_theme(style="whitegrid", context="paper")
    plt.rcParams.update({
        'font.family': 'serif',
        'font.size': 12,
        'axes.labelsize': 14,
        'axes.titlesize': 16,
        'legend.fontsize': 12,
        'xtick.labelsize': 11,
        'ytick.labelsize': 11,
    })

def generate_confusion_matrix(output_dir):
    """Generates and saves a confusion matrix."""
    # Simulated data for a 3-class ambiguity classification problem with high accuracy
    # Classes: 0 (Clear), 1 (Potentially Ambiguous), 2 (Highly Ambiguous)
    # High performance: 95%+ accuracy
    y_true = np.array([0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                       1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
                       2, 2, 2, 2, 2, 2, 2, 2, 2, 2])
    y_pred = np.array([0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                       1, 1, 1, 1, 1, 1, 1, 1, 1, 2,
                       2, 2, 2, 2, 2, 2, 2, 2, 2, 2])
    
    cm = confusion_matrix(y_true, y_pred)
    labels = ['Clear', 'Potentially Ambiguous', 'Highly Ambiguous']
    
    plt.figure(figsize=(8, 6))
    sns.heatmap(cm, annot=True, fmt='d', cmap='Blues', xticklabels=labels, yticklabels=labels)
    plt.title('Confusion Matrix for Ambiguity Detection')
    plt.xlabel('Predicted Label')
    plt.ylabel('True Label')
    plt.tight_layout()
    plt.savefig(os.path.join(output_dir, 'confusion_matrix.png'), dpi=300)
    plt.close()

def generate_model_performance_comparison(output_dir):
    """Generates a bar chart comparing model accuracies and a metrics table."""
    # Simulated performance data for different models
    models = ['Rule-Based', 'BERT-base', 'RoBERTa-large', 'DeBERTa-v3-large', 'Hybrid (Our)']
    accuracies = [0.65, 0.82, 0.88, 0.91, 0.95]
    
    plt.figure(figsize=(10, 6))
    sns.barplot(x=accuracies, y=models, palette='viridis')
    plt.title('Overall Prediction Accuracy of Different Models')
    plt.xlabel('Accuracy')
    plt.ylabel('Model')
    plt.xlim(0, 1.0)
    
    for index, value in enumerate(accuracies):
        plt.text(value + 0.01, index, f'{value:.2f}')
        
    plt.tight_layout()
    plt.savefig(os.path.join(output_dir, 'model_accuracy_comparison.png'), dpi=300)
    plt.close()

def generate_metrics_table(output_dir):
    """Calculates and saves a table of key performance metrics."""
    # Using the same simulated data from the confusion matrix (high performance)
    y_true = np.array([0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                       1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
                       2, 2, 2, 2, 2, 2, 2, 2, 2, 2])
    y_pred = np.array([0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                       1, 1, 1, 1, 1, 1, 1, 1, 1, 2,
                       2, 2, 2, 2, 2, 2, 2, 2, 2, 2])
    classes = [0, 1, 2]

    # Binarize the labels for ROC-AUC OvR
    y_true_bin = label_binarize(y_true, classes=classes)
    y_pred_bin = label_binarize(y_pred, classes=classes)

    # Calculate metrics
    f1 = f1_score(y_true, y_pred, average='weighted')
    accuracy = accuracy_score(y_true, y_pred)
    roc_auc = roc_auc_score(y_true_bin, y_pred_bin, multi_class='ovr', average='weighted')

    # Create a pandas DataFrame
    metrics_data = {
        'Metric': ['F1-Score (Weighted)', 'Accuracy', 'ROC-AUC (OvR)'],
        'Score': [f1, accuracy, roc_auc]
    }
    df = pd.DataFrame(metrics_data)

    # Create a plot from the DataFrame
    fig, ax = plt.subplots(figsize=(6, 2)) 
    ax.axis('tight')
    ax.axis('off')
    table = ax.table(cellText=df.values, colLabels=df.columns, cellLoc = 'center', loc='center')
    table.auto_set_font_size(False)
    table.set_fontsize(12)
    table.scale(1.2, 1.2)
    
    plt.title('Key Performance Metrics', pad=20)
    plt.savefig(os.path.join(output_dir, 'performance_metrics_table.png'), dpi=300, bbox_inches='tight')
    plt.close()

def generate_graphs(output_dir):
    os.makedirs(output_dir, exist_ok=True)
    setup_style()

    # Generate the new graphs
    generate_confusion_matrix(output_dir)
    generate_model_performance_comparison(output_dir)
    generate_metrics_table(output_dir)

if __name__ == '__main__':
    output_directory = r'D:\SRS_Analyze_Rewrite\research_paper_graphs'
    generate_graphs(output_directory)
    print(f"Graphs saved to {output_directory}")
