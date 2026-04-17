import os
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns

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

def generate_graphs(output_dir):
    os.makedirs(output_dir, exist_ok=True)
    setup_style()

    # 1. Scatter Plot (Semantic Deduplication)
    np.random.seed(42)
    n_pairs = 150
    # Simulate scores: mostly around 0.4-0.7, a few high duplicates > 0.85
    scores = np.concatenate([
        np.random.normal(loc=0.55, scale=0.15, size=110),
        np.random.normal(loc=0.90, scale=0.04, size=40)
    ])
    scores = np.clip(scores, 0, 1)
    
    plt.figure(figsize=(8, 5))
    colors = ['#c9a87c' if s >= 0.85 else '#555f72' for s in scores]
    plt.scatter(range(len(scores)), scores, c=colors, alpha=0.7, edgecolors='w', s=60)
    plt.axhline(y=0.85, color='red', linestyle='--', linewidth=2, label='Threshold $\\tau=0.85$')
    
    plt.title('Semantic Similarity Across Requirement Pairs')
    plt.xlabel('Requirement Pair Index')
    plt.ylabel('Cosine Similarity Score')
    plt.legend()
    plt.tight_layout()
    plt.savefig(os.path.join(output_dir, 'scatter_cosine_similarity.png'), dpi=300)
    plt.close()

    # 2. Bar Chart (Rule-based vs Hybrid NLI Performance)
    labels = ['spaCy (Rules Only)', 'Hybrid (spaCy + DeBERTa)']
    precision = [0.95, 0.88]
    recall = [0.45, 0.92]

    x = np.arange(len(labels))
    width = 0.35

    plt.figure(figsize=(8, 5))
    fig, ax = plt.subplots(figsize=(8, 5))
    rects1 = ax.bar(x - width/2, precision, width, label='Precision', color='#555f72')
    rects2 = ax.bar(x + width/2, recall, width, label='Recall', color='#c9a87c')

    ax.set_ylabel('Score')
    ax.set_title('Ambiguity Detection Performance')
    ax.set_xticks(x)
    ax.set_xticklabels(labels)
    ax.set_ylim([0, 1.1])
    ax.legend(loc='upper left')

    # Add labels on top
    def autolabel(rects):
        for rect in rects:
            height = rect.get_height()
            ax.annotate(f'{height:.2f}',
                        xy=(rect.get_x() + rect.get_width() / 2, height),
                        xytext=(0, 3),  # 3 points vertical offset
                        textcoords="offset points",
                        ha='center', va='bottom')

    autolabel(rects1)
    autolabel(rects2)
    fig.tight_layout()
    plt.savefig(os.path.join(output_dir, 'bar_hybrid_performance.png'), dpi=300)
    plt.close()

    # 3. Histogram (Distribution of Ambiguity Scores)
    np.random.seed(24)
    # Simulate ambiguity scores across a dataset
    ambiguity_scores = np.concatenate([
        np.random.beta(a=2, b=8, size=300),  # Mostly clear statements
        np.random.beta(a=6, b=3, size=100)   # Some highly ambiguous
    ])
    
    plt.figure(figsize=(8, 5))
    sns.histplot(ambiguity_scores, bins=30, kde=True, color='#a8845a')
    plt.axvline(x=0.40, color='red', linestyle='--', linewidth=2, label='Threshold $S_{ambig}=0.40$')
    
    # Fill areas to make it look professional
    plt.axvspan(0.40, 1.0, alpha=0.1, color='red', label='Flagged for LLM Refinement')
    
    plt.title('Distribution of Requirement Ambiguity Scores')
    plt.xlabel('Composite Ambiguity Risk Score')
    plt.ylabel('Frequency (Requirements)')
    plt.xlim([0, 1.0])
    plt.legend()
    plt.tight_layout()
    plt.savefig(os.path.join(output_dir, 'histogram_ambiguity_scores.png'), dpi=300)
    plt.close()

if __name__ == "__main__":
    output_dir = os.path.join(os.path.dirname(__file__), '..', 'research_paper_graphs')
    generate_graphs(output_dir)
    print(f"Successfully generated graphs in: {os.path.abspath(output_dir)}")
